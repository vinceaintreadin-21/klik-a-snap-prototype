from contextlib import contextmanager
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

from api.views.auth_views import (
    AuthRateThrottle,
    confirm_password_reset,
    login_user,
    request_password_reset,
)


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'],
)
class LoginResetTests(TestCase):
    def setUp(self):
        cache.clear()
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='operator', email='operator@example.com', password='Old-Secure-348!'
        )
        self.lock_patch = patch.object(cache, 'lock', self.lock, create=True)
        self.lock_patch.start()
        self.addCleanup(self.lock_patch.stop)

    @staticmethod
    @contextmanager
    def lock(*args, **kwargs):
        yield

    def post(self, view, data, ip='192.0.2.1'):
        request = self.factory.post('/', data, format='json', REMOTE_ADDR=ip)
        return view(request)

    def payload(self, **changes):
        payload = {
            'uid': urlsafe_base64_encode(force_bytes(self.user.pk)),
            'token': default_token_generator.make_token(self.user),
            'password': 'Brand-New-Secure-482!',
            'confirm_password': 'Brand-New-Secure-482!',
        }
        payload.update(changes)
        return payload

    def test_five_login_attempts_per_ip_and_generic_errors(self):
        for identifier in ['missing', 'operator', 'operator', 'operator', 'operator']:
            response = self.post(login_user, {'username': identifier, 'password': 'wrong'})
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.data['error'], 'Unable to log in with those credentials.')
        response = self.post(login_user, {'username': 'operator', 'password': 'Old-Secure-348!'})
        self.assertEqual(response.status_code, 429)
        self.assertGreater(int(response['Retry-After']), 0)
        response = self.post(login_user, {'username': 'OPERATOR@example.com', 'password': 'Old-Secure-348!'}, ip='192.0.2.2')
        self.assertEqual(response.status_code, 200)

    def test_throttle_history_expires_after_one_minute(self):
        request = self.factory.post('/', REMOTE_ADDR='192.0.2.1')
        with patch.object(AuthRateThrottle, 'timer', return_value=100):
            for _ in range(5):
                self.assertTrue(AuthRateThrottle().allow_request(request, None))
            self.assertFalse(AuthRateThrottle().allow_request(request, None))
        with patch.object(AuthRateThrottle, 'timer', return_value=161):
            self.assertTrue(AuthRateThrottle().allow_request(request, None))

    @patch('api.views.auth_views.send_transactional_email')
    def test_reset_request_is_generic_and_resend_is_limited(self, send):
        first = self.post(request_password_reset, {'email': 'operator@example.com'})
        send.assert_called_once()
        self.assertIn('/reset-password/', send.call_args.kwargs['message'])
        second = self.post(request_password_reset, {'email': 'operator@example.com'})
        self.assertEqual(second.status_code, 429)
        unknown = self.post(request_password_reset, {'email': 'unknown@example.com'}, ip='192.0.2.2')
        self.assertEqual(first.data, unknown.data)
        self.assertEqual(send.call_count, 1)

    def test_reset_changes_password_blacklists_refresh_and_link_is_single_use(self):
        refresh = RefreshToken.for_user(self.user)
        payload = self.payload()
        response = self.post(confirm_password_reset, payload)
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(payload['password']))
        from rest_framework_simplejwt.exceptions import TokenError
        with self.assertRaises(TokenError):
            RefreshToken(str(refresh))
        self.assertEqual(self.post(confirm_password_reset, payload).status_code, 400)

    def test_expired_invalid_mismatched_and_weak_passwords_are_rejected(self):
        for changes in [
            {'uid': 'invalid'},
            {'token': 'invalid'},
            {'confirm_password': 'different'},
            {'password': '12345678', 'confirm_password': '12345678'},
        ]:
            self.assertEqual(self.post(confirm_password_reset, self.payload(**changes)).status_code, 400)
        payload = self.payload()
        with patch.object(default_token_generator, '_now', return_value=timezone.now().replace(tzinfo=None) + timedelta(hours=2)):
            self.assertEqual(self.post(confirm_password_reset, payload).status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Old-Secure-348!'))
