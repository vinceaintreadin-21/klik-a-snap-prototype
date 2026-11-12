#layout_views.py
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from api.utils.permissions import check_order_access
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
    order, err = check_order_access(request, order_id)
    if err is not None:
        return err

    if request.user.profile.role not in ('ADMIN', 'OPERATOR'):
        return Response({
            'error': 'Only authorized admins or assigned operators can change layouts'
        }, status=403)

    if order is None:
        return Response({'error': 'Order not found'}, status=404)
        
    if order.status not in (
        Order.Status.PENDING,
        Order.Status.FAILED,
        Order.Status.PROOFING,
    ): 
        return Response(
            {'error': 'Layouts cannot be changed in the current order status.'},
            status=400,
        )

    try:
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
    order, err = check_order_access(request, order_id)
    if err is not None:
        return err

    layouts = IDLayout.objects.filter(order=order)
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
@parser_classes([MultiPartParser, FormParser])
def preview_layout(request, order_id):
    from io import BytesIO
    from types import SimpleNamespace

    from django.http import HttpResponse
    from PIL import Image, UnidentifiedImageError
    from rest_framework import serializers

    from api.services.id_engine import _render_id_card
    from api.utils.permissions import check_order_access

    class PreviewSerializer(serializers.Serializer):
        side = serializers.ChoiceField(choices=['FRONT', 'BACK'])
        card_width = serializers.IntegerField(min_value=1, max_value=4096)
        card_height = serializers.IntegerField(min_value=1, max_value=4096)

        photo_x = serializers.IntegerField(min_value=0, max_value=4096)
        photo_y = serializers.IntegerField(min_value=0, max_value=4096)
        photo_width = serializers.IntegerField(min_value=1, max_value=4096)
        photo_height = serializers.IntegerField(min_value=1, max_value=4096)

        fields_config = serializers.JSONField()
        background_image = serializers.ImageField(
            required=False,
            max_length=255,
        )

        show_photo = serializers.BooleanField(default=True)
        show_full_name = serializers.BooleanField(default=True)
        show_student_id = serializers.BooleanField(default=True)
        show_grade_level = serializers.BooleanField(default=True)
        show_school_name = serializers.BooleanField(default=True)
        show_school_year = serializers.BooleanField(default=True)
        show_signature_line = serializers.BooleanField(default=False)
        show_qr_code = serializers.BooleanField(default=True)
        show_barcode = serializers.BooleanField(default=False)

        def validate_fields_config(self, value):
            if not isinstance(value, dict):
                raise serializers.ValidationError(
                    'fields_config must be an object.'
                )

            if len(value) > 100:
                raise serializers.ValidationError('Too many layout fields.')

            limits = {
                'x': (0, 4096),
                'y': (0, 4096),
                'font_size': (1, 300),
                'size': (1, 4096),
                'width': (1, 4096),
                'height': (1, 4096),
            }

            for key, config in value.items():
                if not isinstance(config, dict):
                    raise serializers.ValidationError(
                        f'{key} must contain a configuration object.'
                    )

                if 'x' not in config or 'y' not in config:
                    raise serializers.ValidationError(
                        f'{key} requires x and y coordinates.'
                    )

                for name, (minimum, maximum) in limits.items():
                    if name not in config:
                        continue

                    number = config[name]
                    if (
                        isinstance(number, bool)
                        or not isinstance(number, int)
                        or not minimum <= number <= maximum
                    ):
                        raise serializers.ValidationError(
                            f'{key}.{name} must be an integer '
                            f'between {minimum} and {maximum}.'
                        )

            return value

        def validate_background_image(self, value):
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError(
                    'Background image must be 10 MB or smaller.'
                )
            return value

    order, error = check_order_access(request, order_id)
    if error is not None:
        return error

    serializer = PreviewSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = dict(serializer.validated_data)

    background_file = data.pop('background_image', None)
    background_bytes = None
    background_url = None

    if background_file is not None:
        background_file.seek(0)
        background_bytes = background_file.read()
    else:
        # Existing layouts can reuse their saved background.
        saved_layout = IDLayout.objects.filter(
            order=order,
            side=data['side'],
        ).first()

        if not saved_layout or not saved_layout.background_image_url:
            return Response(
                {'error': 'Upload a background image before previewing.'},
                status=400,
            )

        background_url = saved_layout.background_image_url

    # Fixed sample values: no Subject query or processed photo required.
    dummy_order = SimpleNamespace(
        school_name='SAMPLE INSTITUTION',
        batch_name='SY 2026–2027',
    )

    dummy_subject = SimpleNamespace(
        order=dummy_order,
        order_id=order.id,
        full_name='JUAN DELA CRUZ',
        student_id='DEMO-0001',
        grade_level='Grade 12',
        section='STEM-A',
        extra_data={
            'section': 'STEM-A',
            'lrn': '123456789012',
            'address': 'Sample Address',
            'emergency_contact_name': 'MARIA DELA CRUZ',
            'contact_info_number': '09123456789',
        },
    )

    layout = SimpleNamespace(
        **data,
        background_image_url=background_url,
    )

    placeholder = Image.new('RGB', (300, 350), (180, 180, 180))
    portrait_buffer = BytesIO()
    placeholder.save(portrait_buffer, format='PNG')

    try:
        image_bytes = _render_id_card(
            portrait_buffer.getvalue(),
            dummy_subject,
            layout,
            background_bytes=background_bytes,
            preview=True,
        )
    except (ValueError, TypeError, KeyError, UnidentifiedImageError):
        return Response(
            {'error': 'Invalid image or layout field configuration.'},
            status=400,
        )
    except Exception:
        import logging

        logging.getLogger(__name__).exception(
            'Layout preview failed for order %s',
            order_id,
        )
        return Response(
            {'error': 'Could not render the preview. Please try again.'},
            status=500,
        )

    response = HttpResponse(image_bytes, content_type='image/png')
    response['Cache-Control'] = 'no-store'
    return response