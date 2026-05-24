# processing_service.py
import os
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings
from api.models.students import Student
from api.models.orders import Order
from api.services.id_engine import process_single_photo


def broadcast_status(order_id, status, extra=None):
    channel_layer = get_channel_layer()
    message = {"action": "status_update", "id": order_id, "status": status}
    if extra:
        message.update(extra)
    async_to_sync(channel_layer.group_send)(
        f"order_{order_id}", # Scope by order ID 
        {"type": "post_update", "message": message}
    )


def start_processing_queue(order_id):
    try:
        order = Order.objects.get(id=order_id)
        order.status = "PROCESSING"
        order.save()
        broadcast_status(order_id, "PROCESSING")

        # Scan the uploaded folder for this order
        order_folder = os.path.join(
            settings.MEDIA_ROOT, 'student_photos', f'order_{order_id}'
        )

        if not os.path.exists(order_folder):
            print(f"Directory not found: {order_folder}")
            order.status = "FAILED"
            order.save()
            broadcast_status(order_id, "FAILED")
            return

        # Collect all valid image files
        image_files = [
            f for f in os.listdir(order_folder)
            if f.lower().endswith(('.png', '.jpg', '.jpeg'))
        ]
        total = len(image_files)
        processed = 0
        manual_review = 0

        broadcast_status(order.id, "PENDING", {
            "action": "order_created",
            "order": {
                "id": order.id,
                "school_name": order.school_name,
                "batch_name": order.batch_name,
                "status": "PENDING",  
            }
        })

        for filename in image_files:
            file_path = os.path.join(order_folder, filename)
            print(f"AI Engine working on: {filename}")

            _, photo_result = process_single_photo(file_path, order_id)

            if photo_result == 'manual_review':
                manual_review += 1
            else:
                processed += 1

            # Broadcast per-photo progress to frontend via WebSocket
            broadcast_status(order_id, "PROCESSING", {
                "action": "progress_update",
                "processed": processed,
                "manual_review": manual_review,
                "total": total
            })

        order.status = "PROOFING"
        order.save()
        
        broadcast_status(order_id, "PROOFING", {
            "processed": processed,
            "manual_review": manual_review,
            "total": total
        })
        print(f"Order {order_id} processing complete.")

    except Exception as e:
        print(f"Error in Processing Queue: {str(e)}")
        Order.objects.filter(id=order_id).update(status="FAILED")
        broadcast_status(order_id, "FAILED", {"error": str(e)})