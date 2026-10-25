import cv2
import numpy as np
import requests
import os
from django.conf import settings
from django.http import JsonResponse
from io import BytesIO
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from api.models.subjects import Subject      
from api.models.orders import Order

from PIL import Image, ImageDraw, ImageFont
import qrcode
import barcode
from barcode.writer import ImageWriter
import io

# ─────────────────────────────────────────────
# PRINT-SHEET CONSTANTS
# Matches physical CR80 card @ 300 DPI tiled 5-up
# ─────────────────────────────────────────────
CARDS_PER_ROW   = 5          # cards across one row
CARD_GAP_PX     = 10         # gap between cards (pixels)
PAGE_MARGIN_PX  = 30         # outer margin (pixels)
ROW_GAP_PX      = 20         # vertical gap between front and back rows


def manual_crop_photo(request, order_id, subject_id):
    """Manual crop endpoint — now uses Subject instead of Student."""
    try:
        subject = Subject.objects.get(id=subject_id, order_id=order_id)
    except Subject.DoesNotExist:
        return JsonResponse({'error': 'Subject record not found.'}, status=404)

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

    # 2. Layout check
    layouts = subject.order.layouts.all()
    if not layouts.exists():
        return JsonResponse({'error': 'This order configuration template lacks an assigned layout.'}, status=400)

    # 3. Source photo
    photo_url = subject.original_photo_url or (subject.photo.url if subject.photo else None)
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

    # 4. Boundary-clamped crop
    h, w = img.shape[:2]
    x1 = max(0, min(crop_x, w))
    y1 = max(0, min(crop_y, h))
    x2 = max(0, min(crop_x + crop_w, w))
    y2 = max(0, min(crop_y + crop_h, h))

    cropped = img[y1:y2, x1:x2]
    if cropped.size == 0:
        return JsonResponse({'error': 'Calculated crop selection yields an empty image slice matrix.'}, status=400)

    # 5. Write crop to disk (dev) or keep in memory (prod)
    if not settings.DEBUG:
        _, buf = cv2.imencode('.jpg', cropped)
        cropped_input = buf.tobytes()
    else:
        out_dir = os.path.join(settings.MEDIA_ROOT, 'cropped_faces')
        os.makedirs(out_dir, exist_ok=True)
        out_filename = f"manual_crop_{subject.student_id}.jpg"
        out_path = os.path.join(out_dir, out_filename)
        cv2.imwrite(out_path, cropped)
        cropped_input = out_path

    # 6. Render & save
    try:
        outputs = {}
        for layout in layouts:
            output = _render_id_card(cropped_input, subject, layout)
            outputs[layout.side] = output

        subject.processed_photo      = outputs.get('FRONT') or list(outputs.values())[0]
        subject.processed_photo_back = outputs.get('BACK')
        subject.photo_status = Subject.PhotoStatus.PROCESSED
        subject.fail_reason  = ''
        subject.save()

        processed_photo_url = (
            subject.processed_photo
            if not settings.DEBUG
            else f"{settings.MEDIA_URL.rstrip('/')}/{subject.processed_photo.lstrip('/')}"
        )

        return JsonResponse({
            'message': 'Manual slice crop synthesis processed successfully.',
            'processed_photo_url': processed_photo_url
        }, status=200)

    except Exception as runtime_error:
        return JsonResponse({'error': f'ID Card Rendering Crash context: {runtime_error}'}, status=500)


def process_single_photo(image_path, order_id):
    """
    Logic loop with fail_reason tracking:
    'no_qr', 'qr_not_found', 'no_face', 'no_layout', 'error'
    """
    from api.services.processing_service import broadcast_stage

    filename        = os.path.basename(image_path.split('?')[0])
    raw_id          = os.path.splitext(filename)[0].replace("cropped_", "")
    possible_sub_id = raw_id.split('_')[0] if '_' in raw_id else raw_id

    # Download and decode
    broadcast_stage(order_id, "read-qr")
    try:
        response  = requests.get(image_path, timeout=15)
        img_array = np.frombuffer(response.content, np.uint8)
        img       = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"ERROR: Image download or decode crashed: {e}")
        subject = Subject.objects.filter(order_id=order_id, student_id=possible_sub_id).first()
        if subject:
            subject.photo_status = Subject.PhotoStatus.MANUAL_REVIEW
            subject.fail_reason  = 'error'
            subject.save()
            return subject, 'manual_review'
        return None, 'manual_review'

    if img is None:
        subject = Subject.objects.filter(order_id=order_id, student_id=possible_sub_id).first()
        if subject:
            subject.photo_status = Subject.PhotoStatus.MANUAL_REVIEW
            subject.fail_reason  = 'error'
            subject.save()
            return subject, 'manual_review'
        return None, 'manual_review'

    # --- Step 1: QR Detection ---
    detector        = cv2.QRCodeDetector()
    data, bbox, _   = detector.detectAndDecode(img)
    print(f"DEBUG: QR data detected: '{data}'")

    if not data:
        print(f"DEBUG: No QR code found in photo {filename}.")
        subject = Subject.objects.filter(order_id=order_id, student_id=possible_sub_id).first()
        if subject:
            if not subject.original_photo_url:
                subject.original_photo_url = image_path
            subject.photo_status = Subject.PhotoStatus.MANUAL_REVIEW
            subject.fail_reason  = 'no_qr'
            subject.save()
            return subject, 'manual_review'
        return None, 'manual_review'

    # --- Step 2: Match to DB ---
    broadcast_stage(order_id, "match-subject")
    try:
        subject = Subject.objects.get(qr_code_data=data, order_id=order_id)
    except Subject.DoesNotExist:
        print(f"DEBUG: No subject found with qr_code_data='{data}' in order {order_id}")
        subject = Subject.objects.filter(order_id=order_id, student_id=possible_sub_id).first()
        if subject:
            if not subject.original_photo_url:
                subject.original_photo_url = image_path
            subject.photo_status = Subject.PhotoStatus.MANUAL_REVIEW
            subject.fail_reason  = 'qr_not_found'
            subject.save()
            return subject, 'manual_review'
        return None, 'manual_review'

    if not subject.original_photo_url:
        subject.original_photo_url = image_path

    # --- Step 3: Crop face ---
    cropped_path, face_found = _crop_face(order_id, img, image_path)

    if not cropped_path or not face_found:
        subject.photo_status = Subject.PhotoStatus.MANUAL_REVIEW
        subject.fail_reason  = 'no_face'
        subject.save()
        return subject, 'manual_review'

    # --- Step 4: Layout check ---
    broadcast_stage(order_id, "confidence")
    try:
        layouts = subject.order.layouts.all()
        if not layouts.exists():
            subject.photo_status = Subject.PhotoStatus.MANUAL_REVIEW
            subject.fail_reason  = 'no_layout'
            subject.save()
            return subject, 'manual_review'
    except Exception:
        subject.photo_status = Subject.PhotoStatus.MANUAL_REVIEW
        subject.fail_reason  = 'no_layout'
        subject.save()
        return subject, 'manual_review'

    # --- Step 5: Render ID cards (front + back) ---
    broadcast_stage(order_id, "generate-id")
    try:
        outputs = {}
        for layout in layouts:
            output = _render_id_card(cropped_path, subject, layout)
            outputs[layout.side] = output

        subject.processed_photo      = outputs.get('FRONT') or list(outputs.values())[0]
        subject.processed_photo_back = outputs.get('BACK')
        subject.photo_status = Subject.PhotoStatus.PROCESSED
        subject.fail_reason  = ''
        subject.save()
        return subject, 'processed'

    except Exception as e:
        print(f"ERROR: ID Card synthesis engine failed: {e}")
        subject.photo_status = Subject.PhotoStatus.MANUAL_REVIEW
        subject.fail_reason  = 'error'
        subject.save()
        return subject, 'manual_review'


def _crop_face(order_id, img, image_path):
    """MediaPipe face detection with torso/QR skip guard."""
    from api.services.processing_service import broadcast_stage
    broadcast_stage(order_id, "extract-face")
    import urllib.request

    model_dir  = os.path.join(settings.MEDIA_ROOT, 'models')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'blaze_face_short_range.tflite')

    if not os.path.exists(model_path):
        url = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
        try:
            urllib.request.urlretrieve(url, model_path)
        except Exception as e:
            print(f"ERROR: Failed downloading face detection model asset: {e}")
            return None, False

    h, w         = img.shape[:2]
    face_detected = False

    try:
        import mediapipe as mp
        with mp.tasks.vision.FaceDetector.create_from_options(
            mp.tasks.vision.FaceDetectorOptions(
                base_options=mp.tasks.BaseOptions(model_asset_path=model_path),
                min_detection_confidence=0.5
            )
        ) as detector:
            mp_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            )
            results = detector.detect(mp_image)

            if results.detections:
                for detection in results.detections:
                    bbox = detection.bounding_box
                    if bbox.origin_y > (h * 0.55):
                        continue
                    x  = max(0, bbox.origin_x - int(0.05 * w))
                    y  = max(0, bbox.origin_y - int(0.18 * h))
                    x2 = min(w, bbox.origin_x + bbox.width  + int(0.05 * w))
                    y2 = min(h, bbox.origin_y + bbox.height + int(0.10 * h))
                    face_detected = True
                    break

    except Exception as e:
        print(f"DEBUG: MediaPipe Tasks init failed ({e}). Falling back to Haar Cascades...")
        try:
            cc_path      = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cc_path)
            gray         = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces        = face_cascade.detectMultiScale(gray, 1.1, 4)

            for (fx, fy, fw, fh) in faces:
                if fy > (h * 0.55):
                    continue
                x  = max(0, fx - int(0.05 * w))
                y  = max(0, fy - int(0.18 * h))
                x2 = min(w, fx + fw + int(0.05 * w))
                y2 = min(h, fy + fh + int(0.10 * h))
                face_detected = True
                break
        except Exception as cascade_error:
            print(f"ERROR: Cascade fallback exception: {cascade_error}")

    if not face_detected:
        x, y, x2, y2 = int(w * 0.15), int(h * 0.05), int(w * 0.85), int(h * 0.55)

    cropped = img[y:y2, x:x2]

    if not settings.DEBUG:
        _, buf = cv2.imencode('.jpg', cropped)
        return buf.tobytes(), face_detected
    else:
        out_dir  = os.path.join(settings.MEDIA_ROOT, 'cropped_faces')
        os.makedirs(out_dir, exist_ok=True)
        filename = f"cropped_{os.path.basename(image_path.split('/')[-1].split('?')[0])}"
        out      = os.path.join(out_dir, filename)
        cv2.imwrite(out, cropped)
        return out, face_detected


def _render_id_card(cropped_path_or_bytes, subject, layout):
    """
    Compose a single ID card face (front or back) using Pillow.

    Production  → uploads to Cloudinary, returns secure URL.
    Development → saves to media/final_ids/, returns relative path.
    """
    order = subject.order

    response = requests.get(layout.background_image_url, timeout=15)
    card     = Image.open(BytesIO(response.content)).convert('RGBA')
    card     = card.resize((layout.card_width, layout.card_height))

    draw = ImageDraw.Draw(card)
    cfg  = layout.fields_config

    # Accept file path (dev) or raw bytes (prod)
    if isinstance(cropped_path_or_bytes, (bytes, bytearray)):
        face = Image.open(BytesIO(cropped_path_or_bytes)).convert('RGBA')
    else:
        face = Image.open(cropped_path_or_bytes).convert('RGBA')
    face = face.resize((layout.photo_width, layout.photo_height))
    card.paste(face, (layout.photo_x, layout.photo_y), face)

    def _get_font(size=24):
        for path in [
            'arial.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/System/Library/Fonts/Helvetica.ttc',
        ]:
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
        return ImageFont.load_default()

    def place_text(field_key, text):
        if field_key not in cfg:
            return
        f     = cfg[field_key]
        font  = _get_font(f.get('font_size', 24))
        color = f.get('color', '#000000')
        x, y  = f['x'], f['y']

        if f.get('align') == 'center':
            bbox   = draw.textbbox((0, 0), text, font=font)
            text_w = bbox[2] - bbox[0]
            x      = x - text_w // 2

        draw.text((x, y), text, fill=color, font=font)

    if layout.show_full_name:
        place_text('full_name', subject.full_name.upper())

    if layout.show_student_id:
        place_text('student_id', subject.student_id)

    if layout.show_grade_level:
        place_text('grade_level', subject.grade_level)

    if layout.show_school_name:
        place_text('school_name', order.school_name)

    if layout.show_school_year:
        place_text('batch_name', order.batch_name)

    if layout.show_signature_line and 'signature_line' in cfg:
        f = cfg['signature_line']
        sx, sy, sw = f['x'], f['y'], f.get('width', 200)
        draw.line([(sx, sy), (sx + sw, sy)], fill='#000000', width=2)

    if layout.show_qr_code and 'qr_code' in cfg:
        f  = cfg['qr_code']
        qr = qrcode.make(subject.student_id)
        qr = qr.resize((f.get('size', 100), f.get('size', 100)))
        card.paste(qr.convert('RGBA'), (f['x'], f['y']))

    if layout.show_barcode and 'barcode' in cfg:
        f       = cfg['barcode']
        CODE128 = barcode.get_barcode_class('code128')
        buf     = io.BytesIO()
        CODE128(subject.student_id, writer=ImageWriter()).write(buf)
        buf.seek(0)
        bc_img  = Image.open(buf).convert('RGBA')
        bc_img  = bc_img.resize((f.get('width', 200), f.get('height', 60)))
        card.paste(bc_img, (f['x'], f['y']))

    # Extra SIS fields
    CORE_FIELDS = {
        'full_name', 'student_id', 'grade_level', 'school_name',
        'batch_name', 'signature_line', 'qr_code', 'barcode',
    }
    extra_data = getattr(subject, 'extra_data', None) or {}
    for field_key, value in extra_data.items():
        if field_key not in CORE_FIELDS and field_key in cfg and value:
            place_text(field_key, str(value))

    side_label = layout.side.lower()   # 'front' or 'back'

    if not settings.DEBUG:
        import cloudinary.uploader
        buf = io.BytesIO()
        card.convert('RGB').save(buf, format='PNG')
        buf.seek(0)
        result = cloudinary.uploader.upload(
            buf,
            folder=f'final_ids/order_{subject.order_id}',
            public_id=f"{subject.student_id}_id_{side_label}",
            resource_type='image',
            format='png',
            overwrite=True,
        )
        return result['secure_url']
    else:
        out_dir  = os.path.join(settings.MEDIA_ROOT, 'final_ids')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f"{subject.student_id}_id_{side_label}.png")
        card.save(out_path)
        return f"final_ids/{subject.student_id}_id_{side_label}.png"


def compose_print_sheet(order_id):
    """
    Build a print-ready sheet image for the order.

    Layout matches the target format:
      ┌──────────────────────────────────────────┐
      │  [FRONT 1] [FRONT 2] [FRONT 3] [FRONT 4] [FRONT 5]  │
      │  [BACK  1] [BACK  2] [BACK  3] [BACK  4] [BACK  5]  │  ← rotated 180°
      │  ...repeats for remaining subjects...                 │
      └──────────────────────────────────────────┘

    Each back card is rotated 180° so that when the sheet is flipped
    over the front row, the back aligns with its matching front.

    Saves one PNG per sheet page to media/print_sheets/ (dev) or
    uploads to Cloudinary (prod) and returns a list of URLs/paths.
    """
    order    = Order.objects.get(id=order_id)
    subjects = list(order.subjects.filter(
        photo_status=Subject.PhotoStatus.PROCESSED
    ).order_by('student_id'))

    if not subjects:
        return []

    # Determine card dimensions from any layout on this order
    sample_layout = order.layouts.first()
    if not sample_layout:
        raise ValueError(f"Order {order_id} has no layouts configured.")

    card_w = sample_layout.card_width
    card_h = sample_layout.card_height

    sheet_results = []

    # Process in chunks of CARDS_PER_ROW
    for chunk_start in range(0, len(subjects), CARDS_PER_ROW):
        chunk = subjects[chunk_start: chunk_start + CARDS_PER_ROW]

        # Sheet canvas dimensions
        n          = len(chunk)
        sheet_w    = PAGE_MARGIN_PX * 2 + n * card_w + (n - 1) * CARD_GAP_PX
        sheet_h    = PAGE_MARGIN_PX * 2 + 2 * card_h + ROW_GAP_PX   # front row + back row

        sheet = Image.new('RGB', (sheet_w, sheet_h), color='white')

        for col_idx, subject in enumerate(chunk):
            x_offset = PAGE_MARGIN_PX + col_idx * (card_w + CARD_GAP_PX)

            # ── Front card ──────────────────────────────────────────
            front_url = subject.processed_photo
            if front_url:
                if front_url.startswith('http'):
                    resp       = requests.get(front_url, timeout=15)
                    front_img  = Image.open(BytesIO(resp.content)).convert('RGB')
                else:
                    front_img  = Image.open(
                        os.path.join(settings.MEDIA_ROOT, front_url)
                    ).convert('RGB')
                front_img = front_img.resize((card_w, card_h))
                sheet.paste(front_img, (x_offset, PAGE_MARGIN_PX))

            # ── Back card (rotated 180° for flip-printing) ──────────
            back_url = subject.processed_photo_back
            if back_url:
                if back_url.startswith('http'):
                    resp      = requests.get(back_url, timeout=15)
                    back_img  = Image.open(BytesIO(resp.content)).convert('RGB')
                else:
                    back_img  = Image.open(
                        os.path.join(settings.MEDIA_ROOT, back_url)
                    ).convert('RGB')
                back_img  = back_img.resize((card_w, card_h))
                back_img  = back_img.rotate(180)             # flip for back-side alignment
                back_y    = PAGE_MARGIN_PX + card_h + ROW_GAP_PX
                sheet.paste(back_img, (x_offset, back_y))

        # Save / upload sheet
        page_num    = chunk_start // CARDS_PER_ROW + 1
        sheet_label = f"order_{order_id}_sheet_{page_num}"

        if not settings.DEBUG:
            import cloudinary.uploader
            buf = io.BytesIO()
            sheet.save(buf, format='PNG')
            buf.seek(0)
            result = cloudinary.uploader.upload(
                buf,
                folder=f'print_sheets/order_{order_id}',
                public_id=sheet_label,
                resource_type='image',
                format='png',
                overwrite=True,
            )
            sheet_results.append(result['secure_url'])
        else:
            out_dir  = os.path.join(settings.MEDIA_ROOT, 'print_sheets')
            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, f"{sheet_label}.png")
            sheet.save(out_path)
            sheet_results.append(f"print_sheets/{sheet_label}.png")

    return sheet_results


def finalize_order_production(order_id):
    """
    PENDING → PRINTING  : triggers print-sheet composition
    PRINTING → COMPLETED: marks order done
    """
    order = Order.objects.get(id=order_id)

    if order.status == Order.Status.APPROVED:
        order.status = Order.Status.PRINTING
        order.save()
        from api.services.processing_service import broadcast_status
        broadcast_status(order.id, Order.Status.PRINTING)

        # Compose print sheets now that all cards are approved
        try:
            sheet_paths = compose_print_sheet(order_id)
            print(f"INFO: Generated {len(sheet_paths)} print sheet(s) for order {order_id}.")
        except Exception as e:
            print(f"WARNING: Print sheet composition failed: {e}")

        return True, 'PRINTING'

    if order.status == Order.Status.PRINTING:
        order.status       = Order.Status.COMPLETED
        order.completed_at = timezone.now()
        order.save()
        from api.services.processing_service import broadcast_status
        broadcast_status(order.id, Order.Status.COMPLETED)
        return True, 'COMPLETED'

    return False, None
