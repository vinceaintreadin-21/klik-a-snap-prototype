"""Preview must work before subjects, layouts, or production assets exist."""
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase, override_settings
from PIL import Image, ImageChops
from rest_framework.test import APIRequestFactory, force_authenticate

from api.models.id_layout import IDLayout
from api.models.orders import Order
from api.models.subjects import Subject
from api.services.id_engine import _render_id_card
from api.views.layout_views import create_layout, get_layout, preview_layout


@override_settings(DEBUG=False)
class LayoutPreviewTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User(username='preview-operator')
        self.background = BytesIO()
        Image.new('RGB', (100, 150), 'white').save(self.background, 'PNG')

    def preview(self, **overrides):
        payload = {
            'side': 'FRONT', 'card_width': 100, 'card_height': 150,
            'photo_x': 10, 'photo_y': 10,
            'photo_width': 30, 'photo_height': 35,
            'fields_config': '{}', 'show_photo': 'true',
            'background_image': SimpleUploadedFile(
                'background.png', self.background.getvalue(), 'image/png'
            ),
        }
        payload.update(overrides)
        payload = {key: value for key, value in payload.items() if value is not None}
        request = self.factory.post('/preview/', payload, format='multipart')
        force_authenticate(request, self.user)
        return preview_layout(request, 42)

    def test_unsaved_front_and_back_render_without_queries_or_uploads(self):
        # SimpleTestCase rejects database queries. No real subjects/layouts exist.
        with patch('api.utils.permissions.check_order_access', return_value=(
            SimpleNamespace(id=42), None
        )), patch('cloudinary.uploader.upload') as upload, patch(
            'api.services.id_engine.requests.get'
        ) as download:
            for side in ['FRONT', 'BACK']:
                with self.subTest(side=side):
                    response = self.preview(side=side)
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response['Content-Type'], 'image/png')
                    self.assertEqual(response['Cache-Control'], 'no-store')
                    image = Image.open(BytesIO(response.content))
                    self.assertEqual(image.size, (100, 150))
                    self.assertEqual(image.getpixel((15, 15)), (180, 180, 180))
            upload.assert_not_called()
            download.assert_not_called()

    def test_removed_portrait_is_not_pasted(self):
        with patch('api.utils.permissions.check_order_access', return_value=(
            SimpleNamespace(id=42), None
        )):
            response = self.preview(show_photo='false')
        self.assertEqual(response.status_code, 200)
        image = Image.open(BytesIO(response.content))
        self.assertEqual(image.getpixel((15, 15)), (255, 255, 255))

    def test_missing_background_returns_actionable_error(self):
        with patch('api.utils.permissions.check_order_access', return_value=(
            SimpleNamespace(id=42), None
        )), patch('api.views.layout_views.IDLayout.objects.filter') as layouts:
            layouts.return_value.first.return_value = None
            response = self.preview(background_image=None)
        self.assertEqual(response.status_code, 400)
        self.assertIn('background', response.data['error'])

    def test_saved_background_can_be_reused_without_subjects(self):
        with patch('api.utils.permissions.check_order_access', return_value=(
            SimpleNamespace(id=42), None
        )), patch('api.views.layout_views.IDLayout.objects.filter') as layouts, patch(
            'api.services.id_engine.requests.get'
        ) as download, patch('cloudinary.uploader.upload') as upload:
            layouts.return_value.first.return_value = SimpleNamespace(
                background_image_url='https://example.test/background.png'
            )
            download.return_value.content = self.background.getvalue()
            response = self.preview(background_image=None)
        self.assertEqual(response.status_code, 200)
        download.assert_called_once_with('https://example.test/background.png', timeout=15)
        upload.assert_not_called()

    def test_invalid_dimensions_and_fields_return_validation_errors(self):
        with patch('api.utils.permissions.check_order_access', return_value=(
            SimpleNamespace(id=42), None
        )):
            for invalid in [
                {'card_width': 0},
                {'fields_config': '[]'},
                {'fields_config': '{"full_name":{"x": "bad", "y": 1}}'},
            ]:
                with self.subTest(invalid=invalid):
                    self.assertEqual(self.preview(**invalid).status_code, 400)

    def test_preview_renders_unfamiliar_imported_column_at_configured_position(self):
        config = '{"extra:employee_number":{"x":25,"y":40,"font_size":12,"text_anchor":"top_left"}}'
        with patch('api.utils.permissions.check_order_access', return_value=(
            SimpleNamespace(id=42), None
        )):
            response = self.preview(side='BACK', show_photo='false', fields_config=config)
        self.assertEqual(response.status_code, 200)
        image = Image.open(BytesIO(response.content)).convert('RGB')
        visible = ImageChops.difference(image, Image.new('RGB', image.size, 'white')).getbbox()
        self.assertIsNotNone(visible)
        self.assertGreaterEqual(visible[0], 25)
        self.assertGreaterEqual(visible[1], 40)


@override_settings(DEBUG=False)
class SavedLayoutTests(TestCase):
    def test_saved_back_omits_photo_and_renders_imported_id(self):
        operator = User.objects.create_user('layout-operator')
        operator.profile.role = 'OPERATOR'
        operator.profile.save()
        order = Order.objects.create(
            assigned_operator=operator, school_name='Example', batch_name='Test'
        )
        background_url = 'https://example.test/back.png'
        existing = IDLayout.objects.create(order=order, side='BACK', background_image_url=background_url)
        factory = APIRequestFactory()
        request = factory.post('/save/', {
            'side': 'BACK',
            'show_photo': 'false',
            'card_width': 200,
            'card_height': 100,
            'fields_config': '{"extra:student_id":{"x":20,"y":30,"font_size":12,"text_anchor":"top_left"}}',
        }, format='multipart')
        force_authenticate(request, operator)

        response = create_layout(request, order.pk)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['layout_id'], existing.pk)
        existing.refresh_from_db()
        self.assertFalse(existing.show_photo)

        request = factory.get('/layout/')
        force_authenticate(request, operator)
        result = get_layout(request, order.pk)
        self.assertFalse(result.data['BACK']['show_photo'])

        background = BytesIO()
        Image.new('RGB', (200, 100), 'white').save(background, 'PNG')
        subject = Subject(
            order=order, full_name='Example Person', student_id='INTERNAL',
            extra_data={'student_id': 'E-0004'},
        )
        with patch('cloudinary.uploader.upload') as upload:
            upload.return_value = {'secure_url': 'https://example.test/rendered.png'}
            _render_id_card(None, subject, existing, background_bytes=background.getvalue())
        rendered = Image.open(BytesIO(upload.call_args.args[0].getvalue())).convert('RGB')
        difference = ImageChops.difference(rendered, Image.new('RGB', rendered.size, 'white'))
        self.assertIsNotNone(difference.getbbox())
        self.assertGreaterEqual(difference.getbbox()[0], 20)
        self.assertGreaterEqual(difference.getbbox()[1], 30)
        self.assertEqual(rendered.getpixel((170, 85)), (255, 255, 255))
