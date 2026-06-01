#id_engine.py
import cv2
import mediapipe as mp
import numpy as np
import requests
import qrcode
import barcode
from barcode.writer import ImageWriter
from PIL import Image, ImageDraw, ImageFont
import os
import io
from django.conf import settings
from api.models.students import Student
from api.models.orders import Order


def process_single_photo(image_path, order_id):
    """
    Logic Loop:
    1. OpenCV scans QR → finds student_id
    2. Django queries DB → matches to Student
    3. MediaPipe crops face
    4. Pillow merges into dynamic layout
    """
    response = requests.get(image_path)
    img_array = np.frombuffer(response.content, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if img is None:
        return None, 'manual_review'

    # Step 1: QR Detection
    detector = cv2.QRCodeDetector()
    data, bbox, _ = detector.detectAndDecode(img)

    if not data:
        return None, 'manual_review'

    # Step 2: Match to DB
    try:
        student = Student.objects.get(student_id=data, order_id=order_id)
    except Student.DoesNotExist:
        return None, 'manual_review'

    # Step 3: Crop face
    cropped_path = _crop_face(img, image_path)
    if not cropped_path:
        student.photo_status = Student.PhotoStatus.MANUAL_REVIEW
        student.save()
        return student, 'manual_review'

    # Step 4: Render ID card
    try:
        layout = student.order.layout
    except Exception:
        student.photo_status = Student.PhotoStatus.MANUAL_REVIEW
        student.save()
        return student, 'manual_review'

    output_path = _render_id_card(cropped_path, student, layout)

    student.processed_photo = output_path
    student.photo_status = Student.PhotoStatus.PROCESSED
    student.save()
    return student, 'processed'


def _crop_face(img, image_path):
    """MediaPipe face detection → crop from overhead to chin with padding"""
    mp_face = mp.solutions.face_detection
    with mp_face.FaceDetection(
        model_selection=1, min_detection_confidence=0.5
    ) as detector:
        results = detector.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

        if not results.detections:
            return None

        detection = results.detections[0]
        bbox = detection.location_data.relative_bounding_box
        h, w = img.shape[:2]

        pad_top = 0.15
        pad_bottom = 0.10
        x  = max(0, int((bbox.xmin - 0.05) * w))
        y  = max(0, int((bbox.ymin - pad_top) * h))
        x2 = min(w, int((bbox.xmin + bbox.width + 0.05) * w))
        y2 = min(h, int((bbox.ymin + bbox.height + pad_bottom) * h))

        cropped = img[y:y2, x:x2]

        out_dir = os.path.join(settings.MEDIA_ROOT, 'cropped_faces')
        os.makedirs(out_dir, exist_ok=True)
        filename = f"cropped_{os.path.basename(image_path.split('/')[-1])}"
        out = os.path.join(out_dir, filename)
        cv2.imwrite(out, cropped)
        return out


def _render_id_card(cropped_path, student, layout):
    """
    Pillow: compose full ID card from:
    - Background image
    - Cropped face photo
    - Text fields (name, grade, ID, school, year)
    - Signature line
    - QR code
    - Barcode
    """
    order = student.order

    # --- Canvas ---
    bg_path = os.path.join(settings.MEDIA_ROOT, str(layout.background_image))
    card = Image.open(bg_path).convert('RGBA')
    card = card.resize((layout.card_width, layout.card_height))

    draw = ImageDraw.Draw(card)
    cfg = layout.fields_config  # shorthand

    # --- Photo ---
    face = Image.open(cropped_path).convert('RGBA')
    face = face.resize((layout.photo_width, layout.photo_height))
    card.paste(face, (layout.photo_x, layout.photo_y), face)
    
    def _get_font(size = 24):
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

    # --- Text fields ---
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

    # --- QR Code ---
    if layout.show_qr_code and 'qr_code' in cfg:
        f = cfg['qr_code']
        qr = qrcode.make(student.student_id)
        qr = qr.resize((f.get('size', 100), f.get('size', 100)))
        card.paste(qr.convert('RGBA'), (f['x'], f['y']))

    # --- Barcode ---
    if layout.show_barcode and 'barcode' in cfg:
        f = cfg['barcode']
        CODE128 = barcode.get_barcode_class('code128')
        buf = io.BytesIO()
        CODE128(student.student_id, writer=ImageWriter()).write(buf)
        buf.seek(0)
        bc_img = Image.open(buf).convert('RGBA')
        bc_img = bc_img.resize((f.get('width', 200), f.get('height', 60)))
        card.paste(bc_img, (f['x'], f['y']))

    # --- Save ---
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