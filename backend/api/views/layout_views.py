#layout_views.py
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from api.models.orders import Order
from api.models.id_layout import IDLayout
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

        layout = IDLayout.objects.create(
            order=order,
            background_image=request.FILES['background_image'],
            card_width=request.data.get('card_width', 638),
            card_height=request.data.get('card_height', 1012),
            photo_x=request.data.get('photo_x', 169),
            photo_y=request.data.get('photo_y', 180),
            photo_width=request.data.get('photo_width', 300),
            photo_height=request.data.get('photo_height', 350),
            fields_config=fields_config,
            show_full_name=request.data.get('show_full_name', True),
            show_student_id=request.data.get('show_student_id', True),
            show_grade_level=request.data.get('show_grade_level', True),
            show_school_name=request.data.get('show_school_name', True),
            show_school_year=request.data.get('show_school_year', True),
            show_signature_line=request.data.get('show_signature_line', True),
            show_qr_code=request.data.get('show_qr_code', True),
            show_barcode=request.data.get('show_barcode', True),
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
            'background_image_url': request.build_absolute_uri(layout.background_image.url),
        })
    except IDLayout.DoesNotExist:
        return Response({'error': 'No layout found for this order'}, status=404)