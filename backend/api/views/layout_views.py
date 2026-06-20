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

        # Delete existing layout if re-uploading
        IDLayout.objects.filter(order=order).delete()

        fields_config = json.loads(request.data.get('fields_config', '{}'))

        def to_bool(val, default=True):
            if isinstance(val, bool):
                return val
            if isinstance(val, str):
                return val.lower() == 'true'
            return default

        bg_file = request.FILES.get('background_image')
        bg_url  = None

        if bg_file:
            upload_result = cloudinary.uploader.upload(
                bg_file,
                folder='id_backgrounds',
                resource_type='image',
            )
            bg_url = upload_result['secure_url']
        else:
            # Re-saving without a new file — keep existing URL
            existing_url = None
            existing = IDLayout.objects.filter(order=order).first()
            if existing:
                existing_url = existing.background_image_url
            IDLayout.objects.filter(order=order).delete()

        if not bg_url:
            bg_url = existing_url

        if not bg_url:
            return Response({'error': 'background_image is required'}, status=400)

        layout = IDLayout.objects.create(
            order=order,
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
    """Returns current layout config for an order"""
    try:
        layout = IDLayout.objects.get(order_id=order_id)
        return Response({
            'id': layout.id,
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
        })
    except IDLayout.DoesNotExist:
        return Response({'error': 'No layout found for this order'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def preview_layout(request, order_id):
    from api.services.id_engine import _render_id_card
    from api.models.students import Student
    from django.http import FileResponse
    import types

    try:
        student = Student.objects.filter(
            order_id=order_id,
            photo_status='PROCESSED'
        ).first()

        if not student:
            return Response({'error': 'No processed student found for preview'}, status=404)

        # Build a mock layout object from request data
        layout = types.SimpleNamespace(
            card_width=int(request.data.get('card_width', 638)),
            card_height=int(request.data.get('card_height', 1012)),
            photo_x=int(request.data.get('photo_x', 50)),
            photo_y=int(request.data.get('photo_y', 50)),
            photo_width=int(request.data.get('photo_width', 150)),
            photo_height=int(request.data.get('photo_height', 200)),
            fields_config=request.data.get('fields_config', {}),
            background_image=student.order.layout.background_image,
            show_full_name=True, show_student_id=True,
            show_grade_level=True, show_school_name=True,
            show_school_year=True, show_signature_line=False,
            show_qr_code=True, show_barcode=False,
        )

        output_path = _render_id_card(
            student.processed_photo,  # reuse existing cropped
            student,
            layout
        )

        full_path = os.path.join(settings.MEDIA_ROOT, output_path)
        return FileResponse(open(full_path, 'rb'), content_type='image/png')

    except Exception as e:
        return Response({'error': str(e)}, status=400)