#order_views.py
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Count # Add this import
from api.services.id_engine import finalize_order_production
from api.services.order_service import create_full_order
from rest_framework.decorators import api_view, permission_classes
from api.models.orders import Order
from api.models.students import Student
from api.services.processing_service import start_processing_queue
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import zipfile
from io import BytesIO
import threading
import json
import requests

# Download all QR codes for an order as a ZIP file
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_qr_codes(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        students = Student.objects.filter(order=order).exclude(qr_code_url__isnull=True).exclude(qr_code_url='')
        
        if not students.exists():
            return Response({'error': 'No QR codes found'}, status=404)
        
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for student in students:
                if student.qr_code_url:
                    try:
                        # Download from Cloudinary URL
                        response = requests.get(student.qr_code_url, timeout=10)
                        
                        if response.status_code == 200 and len(response.content) > 0:
                            clean_name = student.full_name.replace(' ', '_')
                            filename = f"{student.student_id}_{clean_name}.png"
                            zip_file.writestr(filename, response.content)
                        else:
                            print(f"Warning: Could not download QR for student {student.id}")
                    except Exception as e:
                        print(f"Error downloading QR for student {student.id}: {e}")
        
        zip_buffer.seek(0)
        content = zip_buffer.getvalue()
        
        if not content or len(content) < 100:
            return Response({'error': 'Generated ZIP was empty'}, status=500)
        
        response = HttpResponse(content, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="qr_codes_order_{order_id}.zip"'
        return response
        
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Get single student QR code
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_qr(request, student_id):
    try:
        student = Student.objects.get(id=student_id)
        
        if not student.qr_code_image:
            return Response({
                'error': 'QR code not generated yet'
            }, status=404)
        
        return Response(
            student.qr_code_image.read(),
            content_type='image/png'
        )
    except Student.DoesNotExist:
        return Response({
            'error': 'Student not found'
        }, status=404)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def order_controller(request):
    if request.method == 'GET':
        return _list_orders()
    return _create_order(request)

def _list_orders():
    try:
        orders = Order.objects.annotate(
            total_students=Count('students')
        ).values(
            'id', 'school_name', 'batch_name', 'status', 'created_at', 'total_students'
        )
        order_list = [{**o, 'student_count': o.pop('total_students')} for o in orders]
        return Response(order_list)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
def _create_order(request):
    try:
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON format'}, status=400)

        school_name = data.get('school_name')
        batch_name = data.get('batch_name')
        students = data.get('students', [])

        if not school_name or not batch_name:
            return Response({'error': 'Missing school/batch name'}, status=400)

        if not isinstance(students, list) or len(students) == 0:
            return Response({'error': 'Student list is empty'}, status=400)
        
        institution = getattr(request.user, 'institution', None)

        new_order = create_full_order(
            school_name=school_name,
            batch_name=batch_name,
            student_list=students,
            institution=institution
        )

        # Return the same structure as _list_orders so the UI doesn't break
        return JsonResponse({
            'id': new_order.id, #type: ignore
            'school_name': new_order.school_name,
            'batch_name': new_order.batch_name,
            'status': new_order.status,
            'student_count': len(students),
            'qr_generated': new_order.student_count,
            'message': 'Order created successfully.'
        }, status=201)

    except Exception as e:
        return Response({'error': str(e)}, status=400)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_processing(request, pk):
    try:
        thread = threading.Thread(target=start_processing_queue, args=(pk,))
        thread.daemon = True
        thread.start()
        return Response({'message': 'Processing started in the background', 'order_id': pk})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['POST']) 
@permission_classes([IsAuthenticated])
def complete_order(request, pk):
    try:
        success = finalize_order_production(pk)
        if success:
            return JsonResponse({"message": "Order marked as COMPLETED"}, status=200)
        return JsonResponse({"error": "Order is not in a state that can be completed"}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)