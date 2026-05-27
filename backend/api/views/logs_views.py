from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from api.models.processing_log import ProcessingLog 
from api.models.admin_audit_log import AdminAuditLog 
from api.models.user_profile import UserProfile 

def is_admin(user):
    try:
        return user.profile.role == UserProfile.Role.ADMIN 
    except: 
        return False 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_processing_logs(request):
    if not is_admin(request.user):
        return Response({
            'error': 'Admin access required'
        }, status=403)
    
    logs = ProcessingLog.objects.select_related('order', 'created_by').all()

    #Optional filters
    order_id = request.query_params.get('order_id')
    level = request.query_params.get('level')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    if order_id:
        logs = logs.filter(order_id=order_id)
    if level:
        logs = logs.filter(level=level.upper())
    if date_from:
        logs = logs.filter(created_at__gte=date_from)
    if date_to:
        logs = logs.filter(created_at__date__lte=date_to)

    logs = logs.order_by('-created_at')[:100]

    return Response({
        'logs': [
            {
                'id': log.id,
                'order_id': log.order_id,
                'level': log.level,
                'message': log.message,
                'details': log.details,
                'created_at': log.created_at,
                'created_by': log.created_by.username if log.created_by else None,
            }
            for log in logs
        ] 
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_error_logs(request):
    if not is_admin(request.user):
        return Response({
            'error': 'Admin access required'
        }, status=403)

    logs = ProcessingLog.objects.select_related('order', 'created_by').filter(
        level__in=['ERROR', 'CRITICAL']
    )

    #Optional filters
    order_id = request.query_params.get('order_id')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    if order_id:
        logs = logs.filter(order=order_id)
    if date_from:
        logs = logs.filter(created_at__date__gte=date_from)
    if date_to:
        logs = logs.filter(created_at__date__lte=date_to)
    
    logs = logs.order_by('-created_at')[:100]

    return Response({
        'error_count': logs.count(),
        'logs': [
            {
                'id': log.id,
                'order_id': log.order_id,
                'order_name': str(log.order),
                'level': log.level,
                'message': log.message,
                'details': log.details,
                'created_at': log.created_at,
                'created_by': log.created_by.username if log.created_by else None,
            }
            for log in logs
        ]
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_audit_logs(request):
    if not is_admin(request.user):
        return Response({
            'error': 'Admin access required'
        }, status=403)
    
    logs = AdminAuditLog.objects.select_related('admin_user').all()

    #Optional filters
    admin_username = request.query_params.get('admin_user')
    action = request.query_params.get('action')
    target_model = request.query_params.get('target_model')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    if admin_username:
        logs = logs.filter(admin_user__username=admin_username)
    if action:
        logs = logs.filter(action=action.upper())
    if target_model:
        logs = logs.filter(target_model=target_model.upper())
    if date_from:
        logs = logs.filter(created_at__date__gte=date_from)
    if date_to:
        logs = logs.filter(created_at__date__lte=date_to)

    logs = logs.order_by('-created_at')[:100]

    return Response({
        'logs': [
            {
                'id': log.id,
                'admin_user': log.admin_user.username if log.admin_user else None, 
                'action': log.action,
                'target_model': log.target_model,
                'target_id': log.target_id,
                'details': log.details,
                'created_at': log.created_at
            }
            for log in logs
        ]
    })
