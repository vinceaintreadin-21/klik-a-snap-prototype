# processing_service.py
import os
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings
from api.models.students import Student
from api.models.orders import Order
from api.services.id_engine import process_single_photo
import cloudinary.api

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
        broadcast_status(order_id, "PROCESSING")

        try:
            result = cloudinary.api.resources(
                type='upload',
                prefix=f'student_photos/order_{order_id}/',
                max_results=500
            )
            image_files = [r['secure_url'] for r in result.get('resources', [])]
        except Exception as e:
            print(f"Cloudinary fetch failed: {str(e)}")
            Order.objects.filter(id=order_id).update(status="FAILED")
            broadcast_status(order_id, "FAILED", {"error": str(e)})
            return

        if not image_files:
            print(f"No photos found in Cloudinary for order {order_id}")
            Order.objects.filter(id=order_id).update(status="FAILED")
            broadcast_status(order_id, "FAILED", {"error": "No photos found"})
            return
        
        total = len(image_files)
        processed = 0
        manual_review = 0

        for url in image_files:
            print(f"AI Engine working on: {url}")

            _, photo_result = process_single_photo(url, order_id)

            if photo_result == 'manual_review':
                manual_review += 1
            else: 
                processed += 1

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