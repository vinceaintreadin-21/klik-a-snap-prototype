import json
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from api.models.id_layout import IDLayout
from api.models.orders import Order
from api.models.subjects import Subject
from api.services.id_engine import finalize_order_production
from api.services.order_workflow import get_order_workflow
from api.views.order_views import order_controller, start_processing, complete_order


class OrderWorkflowTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.operator = User.objects.create_user(username='workflow-operator')
        self.other = User.objects.create_user(username='other-operator')
        self.order = Order.objects.create(assigned_operator=self.operator, school_name='Client A', batch_name='Batch A')

    def post(self, view, user=None, data=None):
        request = self.factory.post('/', data or {}, format='json')
        force_authenticate(request, user or self.operator)
        return view(request, pk=self.order.pk)

    def layout(self, side='FRONT', url='https://example.com/layout.png'):
        return IDLayout.objects.create(order=self.order, side=side, background_image_url=url)

    def subject(self, **changes):
        values = dict(order=self.order, full_name='Ana Garcia', student_id='A1', grade_level='9')
        values.update(changes)
        return Subject.objects.create(**values)

    def list_orders(self):
        request = self.factory.get('/')
        force_authenticate(request, self.operator)
        return order_controller(request)

    def test_each_stage_exposes_one_action(self):
        cases = [
            ('PENDING', False, 0, 'AWAITING_LAYOUT', 'set_layout'),
            ('PENDING', True, 0, 'PENDING', 'upload_photos'),
            ('FAILED', True, 0, 'FAILED', 'upload_photos'),
            ('PROCESSING', True, 2, 'PROCESSING', 'view_pipeline'),
            ('PROOFING', True, 2, 'NEEDS_REVIEW', 'review_photos'),
            ('PROOFING', True, 0, 'PROOFING', 'view_proofs'),
            ('APPROVED', True, 0, 'APPROVED', 'send_to_print'),
            ('PRINTING', True, 0, 'PRINTING', 'mark_completed'),
            ('COMPLETED', True, 0, 'COMPLETED', 'view_order'),
            ('CANCELLED', False, 0, 'CANCELLED', 'view_order'),
        ]
        for status, has_layout, count, stage, action in cases:
            with self.subTest(status=status, count=count):
                self.assertEqual(
                    get_order_workflow(dict(status=status, has_layout=has_layout, manual_review_count=count)),
                    {'stage': stage, 'primary_action': action},
                )

    def test_assigned_only_and_counts_once_with_front_and_back(self):
        self.order.status = 'PROOFING'
        self.order.save()
        self.layout()
        self.layout('BACK')
        self.subject(photo_status='PROCESSED')
        self.subject(student_id='A2', photo_status='MANUAL_REVIEW')
        self.subject(student_id='A3', original_photo_url='')
        Order.objects.create(assigned_operator=self.other, school_name='Foreign', batch_name='Foreign')
        response = self.list_orders()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        row = response.data[0]
        self.assertEqual((row['student_count'], row['processed_count'], row['manual_review_count']), (3, 1, 2))
        self.assertEqual(row['primary_action'], 'review_photos')
        self.assertIn('deadline', row)

    @patch('api.views.order_views.threading.Thread')
    def test_processing_requires_front_layout_including_non_null_background(self, thread):
        self.layout('BACK')
        self.assertEqual(self.post(start_processing).status_code, 400)
        self.layout(url=None)
        self.assertFalse(self.list_orders().data[0]['has_layout'])
        self.assertEqual(self.post(start_processing).status_code, 400)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'PENDING')
        thread.assert_not_called()

    @patch('api.views.order_views.threading.Thread')
    def test_assigned_operator_can_process_after_saving_layout(self, thread):
        self.layout()
        self.assertEqual(self.post(start_processing).status_code, 200)
        thread.return_value.start.assert_called_once()
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'PROCESSING')

    def test_foreign_operator_cannot_process_or_advance(self):
        for view in [start_processing, complete_order]:
            self.assertEqual(self.post(view, user=self.other).status_code, 403)

    @patch('api.services.id_engine.compose_print_sheet', return_value=['sheet.png'])
    def test_valid_transitions_reject_stale_action(self, compose):
        self.assertEqual(self.post(complete_order).status_code, 400)
        self.layout()
        self.subject(photo_status='PROCESSED', is_approved=True, processed_photo='https://example.com/front.png')
        self.order.status = 'APPROVED'
        self.order.save()
        response = self.post(complete_order, data={'expected_status': 'APPROVED'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)['status'], 'PRINTING')
        self.assertEqual(self.post(complete_order, data={'expected_status': 'APPROVED'}).status_code, 400)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'PRINTING')
        self.assertEqual(self.post(complete_order, data={'expected_status': 'PRINTING'}).status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'COMPLETED')
        self.assertIsNotNone(self.order.completed_at)
        compose.assert_called_once()

    @patch('api.services.id_engine.compose_print_sheet', side_effect=RuntimeError('Render failed'))
    def test_print_failure_preserves_approved_status(self, compose):
        self.layout()
        self.subject(photo_status='PROCESSED', is_approved=True, processed_photo='https://example.com/front.png')
        self.order.status = 'APPROVED'
        self.order.save()
        with self.assertRaises(RuntimeError):
            finalize_order_production(self.order.pk)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'APPROVED')

    @patch('api.services.id_engine.compose_print_sheet')
    def test_missing_back_output_blocks_printing(self, compose):
        self.layout()
        self.layout('BACK')
        self.order.status = 'APPROVED'
        self.order.save()
        self.subject(photo_status='PROCESSED', is_approved=True, processed_photo='https://example.com/front.png')
        self.assertEqual(self.post(complete_order).status_code, 400)
        compose.assert_not_called()
