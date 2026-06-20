# backend/api/utils/permissions.py

from rest_framework.response import Response
from api.models.orders import Order
from api.models.students import Student
from api.models.user_profile import UserProfile


def check_order_access(request, order_id):
    """
    Fetches an order and checks that the requesting user has access to it.

    - ADMIN:       always allowed
    - OPERATOR:    must be assigned to the order
    - INSTITUTION: order must belong to their institution
    - COORDINATOR: order must belong to their institution

    Returns:
        (order, None)          — access granted, use the order object
        (None, Response 403)   — access denied, return this response immediately
        (None, Response 404)   — order not found
    """
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return None, Response({'error': 'Order not found'}, status=404)

    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        return None, Response({'error': 'User profile not found'}, status=403)

    role = profile.role
    
    if role == UserProfile.Role.ADMIN:
        return order, None

    elif role == UserProfile.Role.OPERATOR:
        if order.assigned_operator != request.user:
            return None, Response({'error': 'Access denied'}, status=403)

    elif role in (UserProfile.Role.INSTITUTION, UserProfile.Role.COORDINATOR):
        if order.institution != profile.institution:
            return None, Response({'error': 'Access denied'}, status=403)

    else:
        # Unknown role — deny by default
        return None, Response({'error': 'Access denied'}, status=403)

    return order, None


def check_student_access(request, student_id):
    """
    Fetches a student and checks that the requesting user has access to
    the order that student belongs to.

    Returns:
        (student, None)        — access granted
        (None, Response 403)   — access denied
        (None, Response 404)   — student not found
    """
    try:
        student = Student.objects.select_related('order').get(id=student_id)
    except Student.DoesNotExist:
        return None, Response({'error': 'Student not found'}, status=404)

    order, err = check_order_access(request, student.order_id)
    if err:
        return None, err

    return student, None
