from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from ..auth_user.serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from api.models.user_profile import UserProfile
from django.views.decorators.csrf import csrf_exempt

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

login_user.throttle_scope = 'auth'

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