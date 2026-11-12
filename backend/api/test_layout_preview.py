"""Preview must work before subjects, layouts, or production assets exist."""
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from PIL import Image
from rest_framework.test import APIRequestFactory, force_authenticate

from api.views.layout_views import preview_layout


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
