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
from api.models.orders import Order
from django.db.models.functions import TruncMonth
from django.db.models import Count

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
    pending_orders = Order.objects.filter(status__in=['PENDING', 'PROCESSING', 'PROOFING', 'PRINTING']).count()
    active_institutions = Institution.objects.filter(status='ACTIVE').count()
    active_operators = UserProfile.objects.filter(role='OPERATOR', is_active=True).count()
    
    return Response({
        'total_ids': total_ids,
        'total_orders': total_orders,
        'pending_orders': pending_orders,   
        'active_institutions': active_institutions,
        'active_operators': active_operators
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orders_per_month(request):
    if not is_admin(request.user):
        return Response({
            'error': 'Admin access required'
        }, status=403)

    data = (
        Order.objects.
        annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )

    return Response({
        'orders_per_month': [
            {
                'month': entry['month'].strftime('%Y-%m'),
                'count': entry['count']
            }
            for entry in data
        ]
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_manual_review_rate(request):
    if not is_admin(request.user):
        return Response({
            'error': 'Admin access required'
        }, status=403)

    total_students = Student.objects.count()
    manual_review_students = Student.objects.filter(photo_status=Student.PhotoStatus.MANUAL_REVIEW).count()
    
    if total_students == 0:
        return Response({
            'rate': 0,
            'manual_review_count': 0,
            'total_students': 0
        })
    
    rate = round((manual_review_students / total_students) * 100, 2)
    return Response({
        'rate': rate,
        'manual_review_count': manual_review_students,
        'total_students': total_students
    })



