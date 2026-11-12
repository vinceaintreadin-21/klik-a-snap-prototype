from datetime import timedelta
from tempfile import TemporaryDirectory
from pathlib import Path
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase, SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from api.models.institution import Institution
from api.models.orders import Order
from api.models.subjects import Subject
from api.models.id_layout import IDLayout
from api.views.institution_views import update_institution
from api.services.institution_cleanup import _delete_prefix, _delete_reference, AssetCleanupError


class InstitutionDeactivationTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user('admin')
        self.admin.profile.role = 'ADMIN'
        self.admin.profile.save()
        self.owner = User.objects.create_user('owner')
        self.institution = Institution.objects.create(user=self.owner, name='School',
            contract_ends_at=timezone.now() - timedelta(days=1))
        self.order = Order.objects.create(institution=self.institution, status='COMPLETED',
            school_name='School', batch_name='Batch')
        self.subject = Subject.objects.create(order=self.order, full_name='Subject', student_id='1',
            qr_code_url='https://res.cloudinary.com/test/image/upload/v1/qr_codes/order_%7Border_id%7D/student_1_uuid.png')
        IDLayout.objects.create(order=self.order,
            background_image_url='https://res.cloudinary.com/test/image/upload/v1/id_backgrounds/background.png')
        other_owner = User.objects.create_user('other')
        self.other = Institution.objects.create(user=other_owner, name='Other')
        self.other_order = Order.objects.create(institution=self.other, school_name='Other', batch_name='Batch')

    def call(self, **data):
        payload = {'status': 'DEACTIVATED', 'confirm_deletion': True, 'deactivated_reason': 'Contract ended'}
        payload.update(data)
        request = APIRequestFactory().patch('/', payload, format='json')
        force_authenticate(request, self.admin)
        return update_institution(request, self.institution.pk)

    @override_settings(MEDIA_ROOT='/tmp/no-institution-test-assets')
    def test_deactivation_purges_only_target_and_is_idempotent(self):
        with patch('cloudinary.config') as config, patch('cloudinary.uploader.destroy') as destroy, patch(
            'cloudinary.api.delete_resources_by_prefix'
        ) as delete:
            config.return_value.cloud_name = 'test'
            destroy.return_value = {'result': 'ok'}
            delete.side_effect = lambda *a, **kw: {'deleted': {}, 'partial': False}
            response = self.call()
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual(response.data['deleted_orders'], 1)
            self.assertEqual(response.data['deleted_subjects'], 1)
            self.assertFalse(Order.objects.filter(pk=self.order.pk).exists())
            self.assertTrue(Order.objects.filter(pk=self.other_order.pk).exists())
            self.assertFalse(Subject.objects.filter(pk=self.subject.pk).exists())
            self.owner.refresh_from_db()
            self.assertFalse(self.owner.is_active)
            self.institution.refresh_from_db()
            self.assertEqual(self.institution.cleanup_status, 'COMPLETED')
            prefixes = [call.args[0] for call in delete.call_args_list]
            self.assertEqual(prefixes, [f'{folder}/order_{self.order.pk}/' for folder in
                ('student_photos', 'final_ids', 'print_sheets', 'qr_codes')])
            self.assertIn('qr_codes/order_{order_id}/student_1_uuid', [c.args[0] for c in destroy.call_args_list])
            destroy.reset_mock()
            self.assertEqual(self.call().status_code, 200)
            destroy.assert_not_called()

    def test_cleanup_failure_retains_rows_and_allows_retry(self):
        with patch('api.services.institution_cleanup.purge_institution_assets', side_effect=RuntimeError('provider offline')):
            response = self.call()
        self.assertEqual(response.status_code, 502)
        self.institution.refresh_from_db()
        self.assertEqual(self.institution.status, 'DEACTIVATED')
        self.assertEqual(self.institution.cleanup_status, 'FAILED')
        self.assertTrue(Subject.objects.filter(pk=self.subject.pk).exists())
        with patch('api.services.institution_cleanup.purge_institution_assets'):
            self.assertEqual(self.call().status_code, 200)

    def test_unfinished_orders_and_unconfirmed_requests_do_not_delete(self):
        with patch('api.services.institution_cleanup.purge_institution_assets') as purge:
            self.assertEqual(self.call(confirm_deletion=False).status_code, 400)
            self.order.status = 'PROCESSING'
            self.order.save()
            self.assertEqual(self.call().status_code, 400)
            purge.assert_not_called()
        self.owner.refresh_from_db()
        self.assertTrue(self.owner.is_active)

    def test_temporary_suspension_does_not_purge(self):
        with patch('api.services.institution_cleanup.purge_institution_assets') as purge:
            self.assertEqual(self.call(status='SUSPENDED').status_code, 200)
            purge.assert_not_called()
        self.assertTrue(Order.objects.filter(pk=self.order.pk).exists())


class AssetDeletionTests(SimpleTestCase):
    def test_partial_cloudinary_results_are_paginated(self):
        with patch('cloudinary.api.delete_resources_by_prefix', side_effect=[
            {'partial': True, 'next_cursor': 'next', 'deleted': {'a': 'deleted'}},
            {'partial': False, 'deleted': {'b': 'deleted'}},
        ]) as delete:
            _delete_prefix('student_photos/order_1/')
        self.assertEqual(delete.call_count, 2)
        self.assertEqual(delete.call_args.kwargs['next_cursor'], 'next')

    def test_local_paths_cannot_escape_media_root(self):
        with TemporaryDirectory() as directory, override_settings(MEDIA_ROOT=directory):
            with self.assertRaises(AssetCleanupError):
                _delete_reference('../outside.png')
            target = Path(directory) / 'test.png'
            target.write_bytes(b'asset')
            _delete_reference('test.png')
            self.assertFalse(target.exists())
