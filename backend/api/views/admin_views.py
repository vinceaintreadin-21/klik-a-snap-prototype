#operator management under admin

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.crypto import get_random_string
from api.models.user_profile import UserProfile
from api.models.orders import Order
from api.models.admin_audit_log import AdminAuditLog 

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_orders(request):
    if not is_admin(request.user):
        return Response({
            'error': 'Access admin required'
        }, status=403)
    
    orders = Order.objects.select_related('institution', 'assigned_operator').values(
        'id',
        'institution_id',
        'institution__name',
        'school_name',
        'batch_name',
        'student_count',
        'status',
        'deadline',
        'created_at',
        'assigned_operator__username'
    )

    status_filter = request.query_params.get('status')
    institution_id = request.query_params.get('institution_id')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    if status_filter:
        orders = orders.filter(status=status_filter.upper())
    if institution_id:
        orders = orders.filter(institution_id=institution_id)
    if date_from:
        orders = orders.filter(created_at__date__gte=date_from)
    if date_to:
        orders = orders.filter(created_at__date__lte=date_to)
    
    orders = orders.order_by('-created_at')
    
    return Response({
        'orders': list(orders)
    })

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def assign_operator(request, order_id): 
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)

    operator_id = request.data.get('operator_id')  

    try:
        order = Order.objects.get(id=order_id)  
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    if operator_id is None:
        order.assigned_operator = None
    else:
        try:
            profile = UserProfile.objects.get(user__id=operator_id, role=UserProfile.Role.OPERATOR, is_active=True)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Operator not found'}, status=404)
        order.assigned_operator = profile.user

    order.save()

    return Response({
        'message': 'Operator assignment updated',
        'order_id': order.id,
        'assigned_operator': order.assigned_operator.username if order.assigned_operator else None
    })

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def override_order_status(request, order_id):
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)

    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    new_status = request.data.get('status')
    reason = request.data.get('reason', '')

    if new_status not in [choice[0] for choice in Order.Status.choices]:
        return Response({'error': 'Invalid status'}, status=400)

    old_status = order.status
    order.status = new_status
    order.save()

    AdminAuditLog.objects.create(
        admin_user=request.user,
        action='OVERRIDE_ORDER_STATUS',
        target_model='Order',
        target_id=order.id,
        details={
            'old_status': old_status,
            'new_status': new_status,
            'reason': reason
        }
    )

    return Response({
        'message': 'Order status overridden',
        'order_id': order.id,
        'old_status': old_status,
        'new_status': order.status
    })