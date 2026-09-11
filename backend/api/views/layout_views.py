#layout_views.py
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from api.models.orders import Order
from api.models.id_layout import IDLayout
import cloudinary
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_layout(request, order_id):
    """
    Operator uploads background image + JSON field config for an order.
    
    Expected multipart form:
    - background_image: <file>
    - fields_config: JSON string
    - card_width, card_height, photo_x, photo_y, photo_width, photo_height
    - show_* toggles
    """
    try:
        order = Order.objects.get(id=order_id)

        side = request.data.get('side', 'FRONT').upper()
        if side not in ['FRONT', 'BACK']:
            return Response({
                'error': 'side must be FRONT or BACK'
            }, status=400)

        def to_bool(val, default=True):
            if isinstance(val, bool):
                return val
            if isinstance(val, str):
                return val.lower() == 'true'
            return default

        fields_config = json.loads(request.data.get('fields_config', '{}'))
        bg_file = request.FILES.get('background_image')
        bg_url  = None

        if bg_file:
            # Upload FIRST — only delete existing layout after upload succeeds
            upload_result = cloudinary.uploader.upload(
                bg_file,
                folder='id_backgrounds',
                resource_type='image',
            )
            bg_url = upload_result['secure_url']
        else:
            # No new file — preserve existing background URL before deleting
            existing = IDLayout.objects.filter(order=order, side=side).first()
            if existing:
                bg_url = existing.background_image_url

        if not bg_url:
            return Response({'error': 'background_image is required'}, status=400)

        # Safe to delete now — upload already succeeded (or no upload needed)
        IDLayout.objects.filter(order=order, side=side).delete()

        layout = IDLayout.objects.create(
            order=order,
            side=side,
            background_image_url=bg_url, 
            card_width=request.data.get('card_width', 638),
            card_height=request.data.get('card_height', 1012),
            photo_x=request.data.get('photo_x', 169),
            photo_y=request.data.get('photo_y', 180),
            photo_width=request.data.get('photo_width', 300),
            photo_height=request.data.get('photo_height', 350),
            fields_config=fields_config,
            show_full_name=to_bool(request.data.get('show_full_name', True)),
            show_student_id=to_bool(request.data.get('show_student_id', True)),
            show_grade_level=to_bool(request.data.get('show_grade_level', True)),
            show_school_name=to_bool(request.data.get('show_school_name', True)),
            show_school_year=to_bool(request.data.get('show_school_year', True)),
            show_signature_line=to_bool(request.data.get('show_signature_line', False)),
            show_qr_code=to_bool(request.data.get('show_qr_code', True)),
            show_barcode=to_bool(request.data.get('show_barcode', False)),
        )

        return Response({
            'message': 'Layout saved successfully.',
            'layout_id': layout.id,
        }, status=201)

    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    except KeyError:
        return Response({'error': 'background_image is required'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_layout(request, order_id):
    layouts = IDLayout.objects.filter(order_id=order_id)
    if not layouts.exists():
        return Response({'error': 'No layout found for this order'}, status=404)

    result = {}
    for layout in layouts:
        result[layout.side] = {
            'id': layout.id,
            'side': layout.side,
            'card_width': layout.card_width,
            'card_height': layout.card_height,
            'photo_x': layout.photo_x,
            'photo_y': layout.photo_y,
            'photo_width': layout.photo_width,
            'photo_height': layout.photo_height,
            'fields_config': layout.fields_config,
            'show_full_name': layout.show_full_name,
            'show_student_id': layout.show_student_id,
            'show_grade_level': layout.show_grade_level,
            'show_school_name': layout.show_school_name,
            'show_school_year': layout.show_school_year,
            'show_signature_line': layout.show_signature_line,
            'show_qr_code': layout.show_qr_code,
            'show_barcode': layout.show_barcode,
            'background_image_url': layout.background_image_url,
        }
    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def preview_layout(request, order_id):
    from api.services.id_engine import _render_id_card
    from api.models.students import Student
    from django.http import FileResponse
    from api.utils.permissions import check_order_access
    import types

    order, err = check_order_access(request, order_id)
    if err:
        return err

    try:
        # Use first processed student if available, otherwise use dummy data
        real_student = Student.objects.filter(
            order_id=order_id,
            photo_status='PROCESSED'
        ).first()

        if real_student:
            student = real_student
            photo_source = student.processed_photo
        else:
            # Dummy student — no real data exposed during layout design
            student = types.SimpleNamespace(
                full_name='JUAN DELA CRUZ',
                student_id='KAS-2026-DEMO',
                grade_level='Grade 12',
                section='STEM-A',
                order=order,
            )
            # Use a placeholder face — a solid gray rectangle
            from PIL import Image
            from io import BytesIO
            placeholder = Image.new('RGB', (300, 350), color=(180, 180, 180))
            buf = BytesIO()
            placeholder.save(buf, format='JPEG')
            photo_source = buf.getvalue()

        # Fetch background_image_url from the saved layout for the requested side
        side = request.data.get('side', 'FRONT').upper()
        try:
            saved_layout = IDLayout.objects.get(order=order, side=side)
            bg_url = saved_layout.background_image_url
        except IDLayout.DoesNotExist:
            return Response({'error': f'No {side} layout saved for this order yet'}, status=404)

        layout = types.SimpleNamespace(
            card_width=int(request.data.get('card_width', 638)),
            card_height=int(request.data.get('card_height', 1012)),
            photo_x=int(request.data.get('photo_x', 169)),
            photo_y=int(request.data.get('photo_y', 180)),
            photo_width=int(request.data.get('photo_width', 300)),
            photo_height=int(request.data.get('photo_height', 350)),
            fields_config=request.data.get('fields_config', {}),
            background_image_url=bg_url,
            show_full_name=True, show_student_id=True,
            show_grade_level=True, show_school_name=True,
            show_school_year=True, show_signature_line=False,
            show_qr_code=True, show_barcode=False,
        )

        output = _render_id_card(photo_source, student, layout)

        if isinstance(output, str) and output.startswith('http'):
            # Production — Cloudinary URL, redirect or proxy
            import requests as req
            img_response = req.get(output, timeout=15)
            from django.http import HttpResponse
            return HttpResponse(img_response.content, content_type='image/png')
        else:
            # Development — local path
            import os
            from django.conf import settings
            full_path = os.path.join(settings.MEDIA_ROOT, output)
            return FileResponse(open(full_path, 'rb'), content_type='image/png')

    except Exception as e:
        return Response({'error': str(e)}, status=400)