#student_views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from api.models.students import Student
from api.models.orders import Order
import json

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_detail_controller(request, order_id):
    if request.method == 'GET':
        students = list(Student.objects.filter(order_id=order_id).values(
            'id', 'student_id', 'full_name', 'grade_level', 
            'is_approved', 'photo_status', 'is_walk_in'
        ))
        return Response(students, safe=False)
    return Response({'error': 'Method not allowed'}, status=405)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_students(request, order_id):
    query = request.GET.get('q', '').strip()
    if not query:
        return Response({'error': 'Query parameter q is required'}, status=400)

    # Validate order exists
    if not Order.objects.filter(id=order_id).exists():
        return Response({'error': 'Order not found'}, status=404)

    students = Student.objects.filter(
        order_id=order_id,
        full_name__icontains=query
    ).values('id', 'student_id', 'full_name', 'grade_level')

    return Response(list(students))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quick_add_student(request, order_id):
    """Fail-Safe C: Walk-in student — create instantly and return student_id for QR display"""
    try:
        order = Order.objects.get(id=order_id)
        data = request.data

        student = Student.objects.create(
            order=order,
            full_name=data['full_name'],
            grade_level=data.get('grade_level', ''),
            student_id=_generate_student_id(order),
            is_walk_in=True
        )

        return Response({
            'id': student.id,
            'student_id': student.student_id,
            'full_name': student.full_name,
            'message': 'Walk-in student added. Display QR for photo.'
        }, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manual_link_photo(request, order_id):
    """Fail-Safe B: Operator manually links an unmatched photo to a student"""
    try:
        student_id = request.data.get('student_id')
        photo_path = request.data.get('photo_path')

        student = Student.objects.get(id=student_id, order_id=order_id)
        student.photo = photo_path
        student.photo_status = Student.PhotoStatus.PENDING  # Re-queue for processing
        student.save()

        return Response({'message': f'Photo linked to {student.full_name}. Re-queued for processing.'})
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


def _generate_student_id(order):
    """Auto-generate KAS-YYYY-XXXX style ID for walk-ins"""
    from django.utils import timezone
    year = timezone.now().year
    count = Student.objects.filter(order=order).count() + 1
    return f"KAS-{year}-{count:04d}"