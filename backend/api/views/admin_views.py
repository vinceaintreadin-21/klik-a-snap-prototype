from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from api.models.user_profile import UserProfile

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_operators(request):
    pass

@api_view(['POST'])
@permission_classes([isAuthenticated])
def create_operator(request):
    pass

@api_view(['GET'])
@permission_classes([isAuthenticated])
def operator_detail(request):
    pass

@api_view(['PATCH'])
@permission_classes([isAuthenticated])
def update_operator(request):
    pass

@api_view(['PATCH'])
@permission_classes([isAuthenticated])
def reset_password(request):
    pass

@api_view(['DELETE'])
@permission_classes([isAuthenticated])
def delete_operator(request):
    pass