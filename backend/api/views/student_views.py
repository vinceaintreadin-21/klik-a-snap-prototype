#student_views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from api.services.qr_service import generate_student_qr
from api.models.students import Student
from api.models.orders import Order
from api.utils.permissions import check_order_access, check_student_access
import json
from django.conf import settings
import cloudinary
import cloudinary.api
import cloudinary.uploader

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_detail_controller(request, order_id):
    order, err = check_order_access(request, order_id)
    if err:
        return err

    students = list(Student.objects.filter(order=order).values(
        'id', 'student_id', 'full_name', 'grade_level',
        'is_approved', 'photo_status', 'is_walk_in', 'processed_photo',
        'fail_reason', 'original_photo_url'
    ))

    for s in students:
        if s['processed_photo']:
            s['processed_photo_url'] = request.build_absolute_uri(
                settings.MEDIA_URL + s['processed_photo']
            )
        else:
            s['processed_photo_url'] = None

    return Response(students)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_students(request, order_id):
    query = request.GET.get('q', '').strip()
    if not query:
        return Response({'error': 'Query parameter q is required'}, status=400)

    order, err = check_order_access(request, order_id)
    if err:
        return err

    students = Student.objects.filter(
        order=order,
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

        generate_student_qr(student, order_id)
        student.refresh_from_db()

        return Response({
            'id': student.id,
            'student_id': student.student_id,
            'full_name': student.full_name,
            'qr_code_url': student.qr_code_url,
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
        photo_file = request.FILES.get('photo')

        student = Student.objects.get(id=student_id, order_id=order_id)

        upload_result = cloudinary.uploader.upload(
            photo_file,
            folder=f'student_photos/order_{order_id}/manual',
            resource_type='image',
            use_filename=True,
            unique_filename=True
        )


        student.photo_status = Student.PhotoStatus.PENDING  # Re-queue for processing
        student.save()

        return Response({
            'message': f'Photo linked to {student.full_name}. Re-queued for processing.',
            'photo_url': upload_result['secure_url']
        })
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


def _generate_student_id(order):
    """Auto-generate KAS-YYYY-XXXX style ID for walk-ins"""
    import uuid
    from django.utils import timezone
    year = timezone.now().year
    suffix = uuid.uuid4().hex[:6].upper()
    return f"KAS-{year}-{suffix}"

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_order(request, order_id):
    order, err = check_order_access(request, order_id)
    if err:
        return err

    if order.status != Order.Status.PROOFING:
        return Response({'error': 'Order is not in PROOFING status'}, status=400)

    Student.objects.filter(order=order, photo_status=Student.PhotoStatus.PROCESSED).update(is_approved=True)

    order.status = Order.Status.APPROVED
    order.approved_by = request.user
    order.approved_at = timezone.now()
    order.approval_notes = request.data.get('notes', '')
    order.save()

    return Response({'message': 'Order approved', 'status': order.status})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_student(request, student_id):
    student, err = check_student_access(request, student_id)
    if err:
        return err

    student.is_approved = True
    student.save()

    return Response({'id': student.id, 'is_approved': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_revision(request, student_id):
    student, err = check_student_access(request, student_id)
    if err:
        return err

    student.is_approved = False
    student.photo_status = Student.PhotoStatus.MANUAL_REVIEW
    student.fail_reason = request.data.get('reason', 'revision_requested')
    student.save()

    return Response({'id': student.id, 'photo_status': student.photo_status})

