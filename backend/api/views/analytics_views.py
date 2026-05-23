from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.crypto import get_random_string
from api.models.user_profile import UserProfile
from api.models.institution import Institution
from api.models.students import Student
from api.models.students import Order

def is_admin(user):
    try:
        return user.profile.role == UserProfile.Role.ADMIN
    except Exception as e:
        return False

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analytics_overview(request):
    if not is_admin(request.user):
        return Response({
            'error': 'Admin access required'
        }, status=403)
    
    total_ids = Student.objects.filter(order__status='COMPLETED').count()
    total_orders = Order.objects.count()
    active_institutions = Institution.objects.filter(status='ACTIVE').count()
    active_operators = UserProfile.objects.filter(role='OPERATOR', is_active=True).count()
    
    return Response({
        'total_ids': total_ids,
        'total_orders': total_orders,
        'active_institutions': active_institutions,
        'active_operators': active_operators
    })

