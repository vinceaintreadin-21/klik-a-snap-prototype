#operator management under admin

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.crypto import get_random_string
from api.models.user_profile import UserProfile

def is_admin(user): 
    try:
        return user.profile.role == UserProfile.Role.ADMIN
    except Exception as e:
        return False

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_operators(request):
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)
    
    operators = UserProfile.objects.filter(
        role = UserProfile.Role.OPERATOR
    ).select_related('user', 'deactivated_by').values(
        'id',
        'user__id',
        'user__username',
        'user__email',
        'user__date_joined',
        'is_active',
        'last_password_reset',
        'deactivated_at',
        'deactivated_by__username',
    )
    
    return Response(list(operators))

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_operator(request):
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)
    
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    
    if not username or not email:
        return Response({'error': 'Username and email are required'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already in use'}, status=400)
    
    temp_password = get_random_string(
        length = 12,
        allowed_chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%'
    )
    
    user = User.objects.create_user(
        username = username,
        email = email,
        password = temp_password,
        is_staff = False,
        is_superuser = False,
    )
    
    profile = user.profile
    profile.role = UserProfile.Role.OPERATOR
    profile.save()
    
    return Response({
        'message': 'Operator created successfully',
        'operator_id': profile.id,
        'username': user.username,
        'email': user.email,
        'temp_password': temp_password,
    }, status = 201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def operator_detail(request, id):
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)

    try:
        profile = UserProfile.objects.select_related(
            'user', 'deactivated_by'
        ).get(id = id, role = UserProfile.Role.OPERATOR)
    except UserProfile.DoesNotExist:
        return Response({'error': 'Operator not found'}, status=404)
    
    return Response({
        'id': profile.id,
        'user_id': profile.user.id,
        'username': profile.user.username,
        'email': profile.user.email,
        'is_active': profile.is_active,
        'date_joined': profile.user.date_joined,
        'last_password_reset': profile.last_password_reset,
        'deactivated_at': profile.deactivated_at,
        'deactivated_by': profile.deactivated_by.username if profile.deactivated_by else None,
    })

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_operator(request, id):
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)

    try:
        profile = UserProfile.objects.select_related('user').get(
            id = id,
            role = UserProfile.Role.OPERATOR
        )
    except UserProfile.DoesNotExist:
        return Response({'error': 'Operator not found'}, status=404)

    data = request.data
    
    #Update info
    new_username = data.get('username', '').strip()
    if new_username:
        if User.objects.exclude(id=profile.user.id).filter(username=new_username).exists():
            return Response({'error': 'Username already taken'}, status=400)
        profile.user.username = new_username

    new_email = data.get('email', '').strip()
    if new_email:
        if User.objects.exclude(id=profile.user.id).filter(email=new_email).exists():
            return Response({'error': 'Email already in use'}, status=400)
        profile.user.email = new_email
        
    #Deactivation
    if 'is_active' in data:
        new_status = bool(data['is_active'])
        profile.is_active = new_status
        profile.user.is_active = new_status 
        
        if not new_status:
            #Deactivating
            profile.deactivated_at = timezone.now()
            profile.deactivated_by = request.user
        else: 
            #Reactivating
            profile.deactivated_at = None
            profile.deactivated_by = None
    
    profile.user.save()
    profile.save()
    
    return Response({
        'message': 'Operator updated successfully'
    })
    
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def reset_password(request, id):
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)
    
    try:
        profile = UserProfile.objects.select_related('user').get(
            id = id,
            role = UserProfile.Role.OPERATOR    
        )
    except UserProfile.DoesNotExist:
        return Response({
            'error': 'Operator not found'
        }, status = 404)
        
    new_password = get_random_string(
        length = 12,
        allowed_chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%'
    )
    
    profile.user.set_password(new_password)
    profile.user.save()
    
    profile.last_password_reset = timezone.now()
    profile.save()
    
    return Response({
        'message': 'Password reset successfully.',
        'temp_password': new_password
    }) 
           
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_operator(request, id):
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)

    try:
        profile = UserProfile.objects.select_related('user').get(
            id=id, role=UserProfile.Role.OPERATOR
        )
    except UserProfile.DoesNotExist:
        return Response({'error': 'Operator not found'}, status=404)

    assigned_count = profile.user.assigned_orders.count()
    if assigned_count > 0:
        return Response({
            'error': f'Cannot delete — operator has {assigned_count} assigned order(s). Deactivate instead.'
        }, status=400)

    profile.user.delete() 
    return Response({'message': 'Operator deleted successfully.'}, status=200)