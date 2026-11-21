from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from ..auth_user.serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from api.models.account_invite import AccountInvite
from api.models.user_profile import UserProfile
from django.views.decorators.csrf import csrf_exempt
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.decorators import authentication_classes
from rest_framework.exceptions import APIException
from rest_framework import serializers
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from redis.exceptions import RedisError
from api.utils.emails import send_transactional_email
import logging

logger = logging.getLogger(__name__)

class AuthRateThrottle(SimpleRateThrottle):
    scope = 'auth'

    def allow_request(self, request, view):
        key = self.get_cache_key(request, view)
        try:
            # Serialize concurrent requests from the same IP across workers.
            with self.cache.lock(f'{key}:lock', timeout=5, blocking_timeout=3):
                return super().allow_request(request, view)
        except RedisError as exc:
            error = APIException('Sign-in service is temporarily unavailable. Please try again.')
            error.status_code = 503
            raise error from exc

    def get_cache_key(self, request, view):
        # Use IP address as the cache key — rate limit per IP
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class PasswordResetThrottle(AuthRateThrottle):
    scope = 'password_reset'


class PasswordResetConfirmThrottle(AuthRateThrottle):
    scope = 'password_reset_confirm'

#function decomissioned, will not use for production
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    # register_user.throttle_scope = 'auth'
    try:
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            refresh = RefreshToken.for_user(user) #type: ignore
            
            return Response({
                "message": "Account created successfully",
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
register_user.throttle_scope = 'auth'

@api_view(['GET'])
@permission_classes([AllowAny])
def validate_account_invite(request, token):
    try:
        invite = AccountInvite.objects.select_related('user').get(token=token)
    except AccountInvite.DoesNotExist:
        return Response({'error': 'Invalid activation link'}, status=404)
    
    if not invite.is_valid():
        return Response({'error': 'This link has expired or already been used'}, status=410)

    return Response({
        'username': invite.user.username,
        'email': invite.user.email,
        'invite_type': invite.invite_type 
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def accept_account_invite(request, token):
    try:
        invite = AccountInvite.objects.select_related('user').get(token=token)
    except AccountInvite.DoesNotExist:
        return Response({'error': 'Invalid activation link'}, status=404)

    if not invite.is_valid():
        return Response({'error': 'This link has expired or already been used'}, status=410)

    password = request.data.get('password', '')
    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters'}, status=400)

    user = invite.user
    user.set_password(password)
    user.is_active = True
    user.save()

    profile = user.profile
    profile.is_active = True
    profile.save()

    invite.is_used = True
    invite.save()

    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'Account activated.',
        'invite_type': invite.invite_type,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    })



@api_view(['POST'])
@throttle_classes([AuthRateThrottle])
@authentication_classes([])
@permission_classes([AllowAny])
def login_user(request):
    identifier = request.data.get('username') #accepts username or email 
    password = request.data.get('password')

    if not isinstance(identifier, str) or not isinstance(password, str) or not identifier or not password:
        return Response({
            'error': 'Unable to log in with those credentials.'
        }, status=status.HTTP_400_BAD_REQUEST)

    user_obj = None
    if '@' in identifier:
        user_obj = User.objects.filter(email__iexact=identifier).first()
    else: 
        user_obj = User.objects.filter(username=identifier).first()
    
    if not user_obj:
        return Response({'error': 'Unable to log in with those credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = authenticate(request, username=user_obj.get_username(), password=password)
    
    if user is None:
        return Response({'error': 'Unable to log in with those credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        profile = user.profile
        if not profile.is_active:
            return Response({
                'error': 'Unable to log in with those credentials.'
            }, status=status.HTTP_403_FORBIDDEN)
    except UserProfile.DoesNotExist:
        pass 

    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "Login successful",
        "user": UserSerializer(user).data,
        "tokens": {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
    }, status=status.HTTP_200_OK)

login_user.cls.throttle_classes = [AuthRateThrottle]


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def request_password_reset(request):
    email = serializers.EmailField().run_validation(request.data.get('email', ''))
    users = User.objects.filter(email__iexact=email, is_active=True)
    for user in users:
        if not user.has_usable_password():
            continue
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link = f'{settings.FRONTEND_BASE_URL.rstrip("/")}/reset-password/{uid}/{token}'
        try:
            send_transactional_email(
                subject='Reset your QueueBits password',
                message=(
                    f'Use this link to reset your QueueBits password:\n\n{link}\n\n'
                    'This link expires in one hour. If you did not request it, you can ignore this email.'
                ),
                recipient_list=[user.email],
            )
        except Exception:
            logger.exception('Password reset email delivery failed')
    return Response({
        'message': 'If an eligible account uses this email, a password reset link has been sent.',
        'retry_after': 60,
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetConfirmThrottle])
def confirm_password_reset(request):
    uid = request.data.get('uid', '')
    token = request.data.get('token', '')
    password = request.data.get('password', '')
    confirm = request.data.get('confirm_password', '')
    if not all(isinstance(value, str) for value in (uid, token, password, confirm)):
        return Response({'error': 'Invalid reset request.'}, status=400)
    if not password or password != confirm:
        return Response({'error': 'Passwords must match.'}, status=400)
    try:
        user_id = urlsafe_base64_decode(uid).decode()
        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=user_id, is_active=True)
            if not default_token_generator.check_token(user, token):
                return Response({'error': 'This reset link is invalid or expired. Request a new link.'}, status=400)
            try:
                validate_password(password, user=user)
            except ValidationError as exc:
                return Response({'error': ' '.join(exc.messages)}, status=400)
            user.set_password(password)
            user.save(update_fields=['password'])
            from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
            for outstanding in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=outstanding)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError, UnicodeDecodeError):
        return Response({'error': 'This reset link is invalid or expired. Request a new link.'}, status=400)
    return Response({'message': 'Your password has been reset. Log in with your new password.'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    try:
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response({
                'error':  'Refresh token is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response({
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'Invalid or expired token'
        }, status=status.HTTP_400_BAD_REQUEST) 


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):

    serializer = UserSerializer(request.user)
    return Response(serializer.data)
