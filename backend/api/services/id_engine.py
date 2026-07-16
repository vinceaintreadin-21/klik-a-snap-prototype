import cv2
import numpy as np
import requests
import os
import requests
from django.conf import settings
from django.http import JsonResponse
from io import BytesIO
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from api.models.students import Student
from api.models.orders import Order

from PIL import Image, ImageDraw, ImageFont
import qrcode
import barcode
from barcode.writer import ImageWriter
import io

def manual_crop_photo(request, order_id, student_id):
    try:
        student = Student.objects.get(id=student_id, order_id=order_id)
    except Student.DoesNotExist:
        return JsonResponse({'error': 'Student record not found.'}, status=404)

    # 1. Coordinate Validation Extraction
    try:
        crop_x = int(float(request.POST.get('crop_x', 0)))
        crop_y = int(float(request.POST.get('crop_y', 0)))
        crop_w = int(float(request.POST.get('crop_width', 0)))
        crop_h = int(float(request.POST.get('crop_height', 0)))
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid pixel matrix coordinates.'}, status=400)

    if crop_w <= 0 or crop_h <= 0:
        return JsonResponse({'error': 'Crop selections must possess positive dimensions.'}, status=400)

    # 2. Layout Layout Check Boundary Guard
    try:
        layout = student.order.layout
    except Exception:
        return JsonResponse({'error': 'This order configuration template lacks an assigned layout.'}, status=400)

    # 3. Source File Streaming Local Import
    photo_url = student.original_photo_url or (student.photo.url if student.photo else None)
    if not photo_url:
        return JsonResponse({'error': 'No original source photo link found attached to this record.'}, status=400)

    try:
        response = requests.get(photo_url, timeout=15)
        img_array = np.frombuffer(response.content, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    except Exception as network_error:
        return JsonResponse({'error': f'Failed downloading source image asset: {network_error}'}, status=502)

    if img is None:
        return JsonResponse({'error': 'Failed to decode downloaded raw byte buffer array into matrix array.'}, status=400)

    # 4. Canvas Matrix Boundary Intersection Calculations
    h, w = img.shape[:2]
    x1 = max(0, min(crop_x, w))
    y1 = max(0, min(crop_y, h))
    x2 = max(0, min(crop_x + crop_w, w))
    y2 = max(0, min(crop_y + crop_h, h))

    cropped = img[y1:y2, x1:x2]
    if cropped.size == 0:
        return JsonResponse({'error': 'Calculated crop selection yields an empty image slice matrix.'}, status=400)

    # 5. Write to Disk Layout
    out_dir = os.path.join(settings.MEDIA_ROOT, 'cropped_faces')
    os.makedirs(out_dir, exist_ok=True)
    out_filename = f"manual_crop_{student.student_id}.jpg"
    out_path = os.path.join(out_dir, out_filename)
    cv2.imwrite(out_path, cropped)

    # 6. Synthesize Card and Mutate Row Record Flags
    try:
        output_relative_route = _render_id_card(out_path, student, layout)
        
        student.processed_photo = output_relative_route
        student.photo_status = Student.PhotoStatus.PROCESSED
        student.fail_reason = '' 
        student.save()

        processed_photo_url = f"{settings.MEDIA_URL.rstrip('/')}/{output_relative_route.lstrip('/')}"
        
        return JsonResponse({
            'message': 'Manual slice crop synthesis processed successfully.',
            'processed_photo_url': processed_photo_url
        }, status=200)

    except Exception as runtime_error:
        return JsonResponse({'error': f'ID Card Rendering Crash context: {runtime_error}'}, status=500)


def process_single_photo(image_path, order_id):
    """
    Logic Loop with distinct tracking for fail_reason:
    'no_qr', 'qr_not_found', 'no_face', 'no_layout', 'error'
    """
    filename = os.path.basename(image_path.split('?')[0])
    possible_student_id = os.path.splitext(filename)[0].replace("cropped_", "")

    try:
        response = requests.get(image_path, timeout=15)
        img_array = np.frombuffer(response.content, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"ERROR: Image download or decode crashed: {e}")
        student = Student.objects.filter(order_id=order_id, student_id=possible_student_id).first()
        if student:
            student.photo_status = Student.PhotoStatus.MANUAL_REVIEW
            student.fail_reason = 'error'
            student.save()
            return student, 'manual_review'
        return None, 'manual_review'

    if img is None:
        student = Student.objects.filter(order_id=order_id, student_id=possible_student_id).first()
        if student:
            student.photo_status = Student.PhotoStatus.MANUAL_REVIEW
            student.fail_reason = 'error'
            student.save()
            return student, 'manual_review'
        return None, 'manual_review'

    # --- Step 1: QR Detection ---
    detector = cv2.QRCodeDetector()
    data, bbox, _ = detector.detectAndDecode(img)
    print(f"DEBUG: QR data detected: '{data}'") 

    if not data:
        print(f"DEBUG: No QR code found in photo {filename}.")
        student = Student.objects.filter(order_id=order_id, student_id=possible_student_id).first()
        if student:
            student.photo_status = Student.PhotoStatus.MANUAL_REVIEW
            student.fail_reason = 'no_qr'
            student.save()
            return student, 'manual_review'
        return None, 'manual_review'

    # --- Step 2: Match to DB ---
    try:
        student = Student.objects.get(qr_code_data=data, order_id=order_id)
    except Student.DoesNotExist:
        print(f"DEBUG: No student found with qr_code_data='{data}' in order {order_id}")
        student = Student.objects.filter(order_id=order_id, student_id=possible_student_id).first()
        if student:
            student.photo_status = Student.PhotoStatus.MANUAL_REVIEW
            student.fail_reason = 'qr_not_found'
            student.save()
            return student, 'manual_review'
        return None, 'manual_review'

    # Store incoming raw photo path if it hasn't been set yet
    if not student.original_photo_url:
        student.original_photo_url = image_path

    # --- Step 3: Crop face ---
    # Captures boolean success status to see if it fell back to default guess template boundaries
    cropped_path, face_found = _crop_face(img, image_path)
    
    if not cropped_path or not face_found:
        student.photo_status = Student.PhotoStatus.MANUAL_REVIEW
        student.fail_reason = 'no_face'
        student.save()
        return student, 'manual_review'

    # --- Step 4: Render ID card ---
    try:
        layout = student.order.layout
    except Exception:
        student.photo_status = Student.PhotoStatus.MANUAL_REVIEW
        student.fail_reason = 'no_layout'
        student.save()
        return student, 'manual_review'

    # --- Step 5: Save Production Card Layout ---
    try:
        output_path = _render_id_card(cropped_path, student, layout)
        
        student.processed_photo = output_path
        student.photo_status = Student.PhotoStatus.PROCESSED
        student.fail_reason = '' 
        student.save()
        return student, 'processed'
        
    except Exception as e:
        print(f"ERROR: ID Card synthesis engine failed: {e}")
        student.photo_status = Student.PhotoStatus.MANUAL_REVIEW
        student.fail_reason = 'error'
        student.save()
        return student, 'manual_review'


def _crop_face(img, image_path):
    """MediaPipe face detection with deep torso/QR code pattern skip filtering"""
    import urllib.request
    
    model_dir = os.path.join(settings.MEDIA_ROOT, 'models')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'blaze_face_short_range.tflite')
    
    if not os.path.exists(model_path):
        url = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
        try:
            urllib.request.urlretrieve(url, model_path)
        except Exception as e:
            print(f"ERROR: Failed downloading face detection model asset: {e}")
            return None, False

    h, w = img.shape[:2]
    face_detected = False

    try:
        import mediapipe as mp
        with mp.tasks.vision.FaceDetector.create_from_options(
            mp.tasks.vision.FaceDetectorOptions(
                base_options=mp.tasks.BaseOptions(model_asset_path=model_path),
                min_detection_confidence=0.5
            )
        ) as detector:
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            results = detector.detect(mp_image)
            
            if results.detections:
                for detection in results.detections:
                    bbox = detection.bounding_box
                    
                    # 🛡️ Torso/Shirt QR protection constraint
                    if bbox.origin_y > (h * 0.55):
                        continue
                        
                    x = max(0, bbox.origin_x - int(0.05 * w))
                    y = max(0, bbox.origin_y - int(0.18 * h))
                    x2 = min(w, bbox.origin_x + bbox.width + int(0.05 * w))
                    y2 = min(h, bbox.origin_y + bbox.height + int(0.10 * h))
                    face_detected = True
                    break

    except Exception as e:
        print(f"DEBUG: MediaPipe Tasks initialization missed ({e}). Falling back to Haar Cascades...")
        try:
            cc_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cc_path)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            for (fx, fy, fw, fh) in faces:
                if fy > (h * 0.55): 
                    continue
                x = max(0, fx - int(0.05 * w))
                y = max(0, fy - int(0.18 * h))
                x2 = min(w, fx + fw + int(0.05 * w))
                y2 = min(h, fy + fh + int(0.10 * h))
                face_detected = True
                break
        except Exception as cascade_error:
            print(f"ERROR: Cascade core fallback exception: {cascade_error}")

    # Fallback to a rule-of-thirds default crop if no face was found high enough in the frame
    if not face_detected:
        x, y, x2, y2 = int(w * 0.15), int(h * 0.05), int(w * 0.85), int(h * 0.55)

    cropped = img[y:y2, x:x2]
    out_dir = os.path.join(settings.MEDIA_ROOT, 'cropped_faces')
    os.makedirs(out_dir, exist_ok=True)
    filename = f"cropped_{os.path.basename(image_path.split('/')[-1].split('?')[0])}"
    out = os.path.join(out_dir, filename)
    cv2.imwrite(out, cropped)
    
    return out, face_detected


def _render_id_card(cropped_path, student, layout):
    """Pillow: compose full ID card layout"""
    order = student.order

    response = requests.get(layout.background_image_url, timeout=15)
    card = Image.open(BytesIO(response.content)).convert('RGBA')
    card = card.resize((layout.card_width, layout.card_height))

    draw = ImageDraw.Draw(card)
    cfg = layout.fields_config

    face = Image.open(cropped_path).convert('RGBA')
    face = face.resize((layout.photo_width, layout.photo_height))
    card.paste(face, (layout.photo_x, layout.photo_y), face)
    
    def _get_font(size=24):
        font_paths = [
            'arial.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/System/Library/Fonts/Helvetica.ttc'
        ]
        for path in font_paths:
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
        return ImageFont.load_default()

    def place_text(field_key, text):
        if field_key not in cfg:
            return
        f = cfg[field_key]
        font = _get_font(f.get('font_size', 24))
        color = f.get('color', '#000000')
        x, y = f['x'], f['y']
        align = f.get('align', 'left')

        if align == 'center':
            bbox = draw.textbbox((0, 0), text, font=font)
            text_w = bbox[2] - bbox[0]
            x = x - text_w // 2

        draw.text((x, y), text, fill=color, font=font)

    if layout.show_full_name:
        place_text('full_name', student.full_name.upper())

    if layout.show_student_id:
        place_text('student_id', student.student_id)

    if layout.show_grade_level:
        place_text('grade_level', student.grade_level)

    if layout.show_school_name:
        place_text('school_name', order.school_name)

    if layout.show_school_year:
        place_text('batch_name', order.batch_name)

    if layout.show_signature_line and 'signature_line' in cfg:
        f = cfg['signature_line']
        sx, sy, sw = f['x'], f['y'], f.get('width', 200)
        draw.line([(sx, sy), (sx + sw, sy)], fill='#000000', width=2)

    if layout.show_qr_code and 'qr_code' in cfg:
        f = cfg['qr_code']
        qr = qrcode.make(student.student_id)
        qr = qr.resize((f.get('size', 100), f.get('size', 100)))
        card.paste(qr.convert('RGBA'), (f['x'], f['y']))

    if layout.show_barcode and 'barcode' in cfg:
        f = cfg['barcode']
        CODE128 = barcode.get_barcode_class('code128')
        buf = io.BytesIO()
        CODE128(student.student_id, writer=ImageWriter()).write(buf)
        buf.seek(0)
        bc_img = Image.open(buf).convert('RGBA')
        bc_img = bc_img.resize((f.get('width', 200), f.get('height', 60)))
        card.paste(bc_img, (f['x'], f['y']))

    CORE_FIELDS_KEYS = {
        'full_name', 'student_id', 'grade_level', 'school_name',
        'batch_name', 'signature_line', 'qr_code', 'barcode'
    }

    extra_data = getattr(student, 'extra_data', None) or {}
    for field_key, value in extra_data.items():
        if field_key not in CORE_FIELDS_KEYS and field_key in cfg and value:
            place_text(field_key, str(value))
            
    out_dir = os.path.join(settings.MEDIA_ROOT, 'final_ids')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{student.student_id}_id.png")
    card.save(out_path)
    return f"final_ids/{student.student_id}_id.png"


def finalize_order_production(order_id):
    order = Order.objects.get(id=order_id)
    if order.status == Order.Status.APPROVED:
        order.status = Order.Status.PRINTING
        order.save()
        from api.services.processing_service import broadcast_status
        broadcast_status(order.id, Order.Status.PRINTING)
        return True, 'PRINTING'

    if order.status == Order.Status.PRINTING:
        order.status = Order.Status.COMPLETED
        order.save()
        from api.services.processing_service import broadcast_status
        broadcast_status(order.id, Order.Status.COMPLETED)
        return True, 'COMPLETED'

    return False, None