from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from ..auth_user.serializers import RegisterSerializer, UserSerializer

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):

    serializer = UserSerializer(request.user)
    return Response(serializer.data)