# subject_views.py
import json

import cloudinary
import cloudinary.api
import cloudinary.uploader
from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models.orders import Order
from api.models.subjects import Subject
from api.services.qr_service import generate_student_qr
from api.utils.permissions import check_order_access, check_student_access, OrderAction

from django.db import transaction
from django.db.models import Q


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_detail_controller(request, order_id):
    order, err = check_order_access(request, order_id)
    if err:
        return err

    subjects = list(
        Subject.objects.filter(order=order).values(
            "id",
            "student_id",
            "full_name",
            "grade_level",
            "is_approved",
            "photo_status",
            "is_walk_in",
            "processed_photo",
            "processed_photo_back",
            "fail_reason",
            "original_photo_url",
            "extra_data",
        )
    )

    for s in subjects:
        if s["processed_photo"]:
            # In production, _render_id_card stores a full Cloudinary URL directly.
            # In development, it stores a relative path under MEDIA_URL.
            val = s["processed_photo"]
            if val.startswith("http://") or val.startswith("https://"):
                s["processed_photo_url"] = val
            else:
                s["processed_photo_url"] = request.build_absolute_uri(
                    settings.MEDIA_URL + val
                )
        else:
            s["processed_photo_url"] = None

    return Response(subjects)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_students(request, order_id):
    query = request.GET.get("q", "").strip()
    if not query:
        return Response({"error": "Query parameter q is required"}, status=400)

    order, err = check_order_access(request, order_id)
    if err:
        return err

    subjects = Subject.objects.filter(order=order, full_name__icontains=query).values(
        "id", "student_id", "full_name", "grade_level"
    )

    return Response(list(subjects))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def quick_add_student(request, order_id):
    """Fail-Safe C: Walk-in subject — create instantly and return student_id for QR display"""

    order, err = check_order_access(request, order_id, OrderAction.ADD_STUDENT)
    if err:
        return err
    try:
        data = request.data

        subject = Subject.objects.create(
            order=order,
            full_name=data["full_name"],
            grade_level=data.get("grade_level", ""),
            section=data.get("section", ""),
            student_id=_generate_student_id(order),
            is_walk_in=True,
        )

        generate_student_qr(subject, order_id)
        subject.refresh_from_db()

        return Response(
            {
                "id": subject.id,
                "student_id": subject.student_id,
                "full_name": subject.full_name,
                "qr_code_url": subject.qr_code_url,
                "grade_level": subject.grade_level,
                "section": subject.section,
                "is_walk_in": subject.is_walk_in,
                "photo_status": subject.photo_status,
                "message": "Walk-in subject added. Display QR for photo.",
            },
            status=201,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manual_link_photo(request, order_id):
    """Fail-Safe B: Operator manually links an unmatched photo to a subject"""

    order, err = check_order_access(request, order_id, OrderAction.LINK_PHOTO)
    if err is not None:
        return err

    if request.user.profile.role not in ("ADMIN", "OPERATOR"):
        return Response(
            {"error": "Only authorized admin or assigned operator can link photos"},
            status=403,
        )

    if order is None:
        return Response({'error': 'Order not found'}, status=404)
            
    if order.status not in (
        Order.Status.PENDING,
        Order.Status.FAILED,
        Order.Status.PROOFING,
    ):
        return Response(
            {"error": "Photos cannot be change in this current order status"},
            status=400,
        )

    try:
        subject_id = request.data.get("student_id")
        photo_file = request.FILES.get("photo")

        if not subject_id or photo_file is None:
            return Response({"error": "subject id and photo are required"}, status=400)

        subject = Subject.objects.get(id=subject_id, order_id=order_id)

        upload_result = cloudinary.uploader.upload(
            photo_file,
            folder=f"student_photos/order_{order_id}/manual",
            resource_type="image",
            use_filename=True,
            unique_filename=True,
        )

        subject.original_photo_url = upload_result["secure_url"]
        subject.photo_status = Subject.PhotoStatus.PENDING  # Re-queue for processing
        subject.fail_reason = ""
        subject.is_approved = False
        subject.save()

        return Response(
            {
                "message": f"Photo linked to {subject.full_name}. Re-queued for processing.",
                "photo_url": upload_result["secure_url"],
            }
        )
    except Subject.DoesNotExist:
        return Response({"error": "Subject not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


def _generate_student_id(order):
    """Auto-generate KAS-YYYY-XXXX style ID for walk-ins"""
    import uuid

    from django.utils import timezone

    year = timezone.now().year
    suffix = uuid.uuid4().hex[:6].upper()
    return f"KAS-{year}-{suffix}"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_order(request, order_id):
    order, err = check_order_access(request, order_id, action=OrderAction.APPROVE_ORDER)
    if err:
        return err

    with transaction.atomic():
        order = Order.objects.select_for_update().filter(pk=order_id).first()
        if order is None:
            return Response({"error": "Order not found"}, status=404)

        if order.status != Order.Status.PROOFING:
            return Response({"error": "Order is not in PROOFING status"}, status=400)

        subjects = Subject.objects.filter(order=order)
        total = subjects.count()
        unresolved = subjects.exclude(photo_status=Subject.PhotoStatus.PROCESSED).count()
        missing_output_filter = Q(processed_photo="") | Q(processed_photo__isnull=True)
        requires_back = order.layouts.filter(side="BACK").exists()
        if requires_back:
            missing_output_filter |= Q(processed_photo_back="") | Q(processed_photo_back__isnull=True)
        missing_output = subjects.filter(
            missing_output_filter, photo_status=Subject.PhotoStatus.PROCESSED
        ).count()

        if total == 0 or unresolved or missing_output:
            return Response(
                {
                    "error": "Batch is incomplete",
                    "total": total,
                    "unresolved": unresolved,
                    "missing_rendered_output": missing_output,
                    "requires_back": requires_back,
                },
                status=400,
            )

        subjects.update(is_approved=True)
        order.status = Order.Status.APPROVED
        order.approved_by = request.user
        order.approved_at = timezone.now()
        order.approval_notes = request.data.get("notes", "")
        order.save(update_fields=["status", "approved_by", "approved_at", "approval_notes"])

    return Response({"message": "Order approved", "status": order.status})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_student(request, student_id):
    subject, err = check_student_access(request, student_id, OrderAction.APPROVE_STUDENT)
    if err:
        return err

    with transaction.atomic():
        order = Order.objects.select_for_update().filter(pk=subject.order_id).first()
        if order is None:
            return Response({"error": "Order not found"}, status=404)
        subject = Subject.objects.filter(pk=subject.pk, order=order).first()
        if subject is None:
            return Response({"error": "Subject not found"}, status=404)
        if order.status != Order.Status.PROOFING:
            return Response({"error": "Order is not in PROOFING status"}, status=400)
        if subject.photo_status != Subject.PhotoStatus.PROCESSED or not subject.processed_photo:
            return Response({"error": "A rendered card is required before approval"}, status=400)

        subject.is_approved = True
        subject.save(update_fields=["is_approved", "updated_at"])

    return Response({"id": subject.id, "is_approved": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_revision(request, student_id):
    subject, err = check_student_access(request, student_id, action=OrderAction.REQUEST_REVISION)
    if err is not None:
        return err

    return _flag_subject_for_review(
        subject, request.data.get("reason", "revision_requested"),
        allowed_statuses=(Order.Status.PROOFING,),
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_subject_photo(request, student_id):
    subject, err = check_student_access(request, student_id, action=OrderAction.PROCESS)
    if err is not None:
        return err

    return _flag_subject_for_review(
        subject, "rejected",
        allowed_statuses=(Order.Status.PENDING, Order.Status.FAILED, Order.Status.PROOFING),
    )


def _flag_subject_for_review(subject, reason, *, allowed_statuses):
    if not isinstance(reason, str) or not reason.strip() or len(reason) > 100:
        return Response({"error": "Provide a revision reason of 1 to 100 characters"}, status=400)

    with transaction.atomic():
        order = Order.objects.select_for_update().filter(pk=subject.order_id).first()
        if order is None:
            return Response({"error": "Order not found"}, status=404)
        if order.status not in allowed_statuses:
            return Response({"error": "This order is not open for photo review"}, status=400)

        updated = Subject.objects.filter(pk=subject.pk, order=order).update(
            is_approved=False,
            photo_status=Subject.PhotoStatus.MANUAL_REVIEW,
            fail_reason=reason.strip(),
            updated_at=timezone.now(),
        )
        if not updated:
            return Response({"error": "Subject not found"}, status=404)

    return Response({"id": subject.pk, "photo_status": Subject.PhotoStatus.MANUAL_REVIEW})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reprocess_student(request, student_id):
    """Reprocess a single subject through the AI pipeline.
    If the photo was manually linked (/manual/ path), bypass QR detection
    and go straight to face crop + ID card render.
    """
    subject, err = check_student_access(request, student_id, action=OrderAction.PROCESS)
    if err:
        return err
    if subject.order.status not in (Order.Status.PENDING, Order.Status.FAILED, Order.Status.PROOFING):
        return Response({"error": "This order is not open for photo processing"}, status=400)

    if not subject.original_photo_url:
        return Response({"error": "No photo available to reprocess"}, status=400)

    # Manually linked photos have no QR code — route to the bypass path
    if "/manual/" in subject.original_photo_url:
        return _process_linked_photo(subject)

    import threading

    from api.services.id_engine import process_single_photo

    def run():
        process_single_photo(subject.original_photo_url, subject.order_id)

    thread = threading.Thread(target=run)
    thread.daemon = True
    thread.start()

    return Response({"message": f"Reprocessing started for {subject.full_name}"})


def _process_linked_photo(subject):
    """
    Process a subject whose photo was manually linked.
    Skips QR detection — goes straight to face crop + ID card render.
    """
    if not subject.original_photo_url:
        return Response({"error": "No photo linked to this subject"}, status=400)

    import threading

    import cv2
    import numpy as np
    import requests as req

    from api.services.id_engine import _crop_face, _render_id_card

    def run():
        try:
            response = req.get(subject.original_photo_url, timeout=15)
            img_array = np.frombuffer(response.content, np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

            if img is None:
                subject.fail_reason = "error"
                subject.photo_status = "MANUAL_REVIEW"
                subject.save()
                return

            cropped_path, face_found, _, _ = _crop_face(
                subject.order_id, img, subject.original_photo_url
            )

            layouts = subject.order.layouts.all()
            if not layouts.exists():
                subject.fail_reason = "no_layout"
                subject.photo_status = "MANUAL_REVIEW"
                subject.save()
                return

            outputs = {}
            for layout in layouts:
                output = _render_id_card(cropped_path, subject, layout)
                outputs[layout.side] = output

            subject.processed_photo = outputs.get("FRONT") or list(outputs.values())[0]
            subject.processed_photo_back = outputs.get("BACK")
            subject.photo_status = "PROCESSED"
            subject.fail_reason = ""
            subject.save()
        except Exception as e:
            print(f"process_linked_photo error for subject {subject.id}: {e}")
            subject.fail_reason = "error"
            subject.photo_status = "MANUAL_REVIEW"
            subject.save()

    thread = threading.Thread(target=run)
    thread.daemon = True
    thread.start()

    return Response({"message": f"Processing started for {subject.full_name}"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def process_linked_photo(request, student_id):
    """API endpoint: POST /students/<student_id>/process-linked/"""
    subject, err = check_student_access(request, student_id, action=OrderAction.PROCESS)
    if err:
        return err
    if subject.order.status not in (Order.Status.PENDING, Order.Status.FAILED, Order.Status.PROOFING):
        return Response({"error": "This order is not open for photo processing"}, status=400)
    return _process_linked_photo(subject)
