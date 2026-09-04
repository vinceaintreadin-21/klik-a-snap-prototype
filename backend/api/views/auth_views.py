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

class AuthRateThrottle(SimpleRateThrottle):
    scope = 'auth'

    def get_cache_key(self, request, view):
        # Use IP address as the cache key — rate limit per IP
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }

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
    
    if not invite.is_valid:
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
        return Response({'error': 'Thislink has expred or already been used'}, status=410)
    
    password = request.data.get('password', '')
    if len(password) < 8:
        return Response({'error', 'Password must be at least 8 characters'}, status=400)

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
    return Respone({
        'message': 'Account activated.',
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    })



@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_obj = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)

    user = authenticate(request, username=username, password=password)
    
    if user is None:
        return Response({
            'error': 'Wrong password'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        profile = user.profile
        if not profile.is_active:
            return Response({
                'error': 'This account has been deactivated'
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