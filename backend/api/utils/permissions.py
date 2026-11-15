# backend/api/utils/permissions.py

from rest_framework.response import Response
from api.models.orders import Order
from api.models.subjects import Subject
from api.models.user_profile import UserProfile


class OrderAction:
    VIEW = "view"
    ADD_STUDENT = "add_student"
    LINK_PHOTO = "link_photo"
    PROCESS = "process"                  # reprocess / process-linked / crop
    APPROVE_STUDENT = "approve_student"
    REQUEST_REVISION = "request_revision"
    APPROVE_ORDER = "approve_order"      # the institution gate
    COMPLETE = "complete"

R = UserProfile.Role
A = OrderAction

ROLE_ACTIONS = {
    R.ADMIN: {A.VIEW, A.ADD_STUDENT, A.LINK_PHOTO, A.PROCESS,
              A.APPROVE_STUDENT, A.REQUEST_REVISION, A.APPROVE_ORDER, A.COMPLETE},
    R.OPERATOR: {A.VIEW, A.ADD_STUDENT, A.LINK_PHOTO, A.PROCESS, A.COMPLETE},
    R.INSTITUTION: {A.VIEW, A.APPROVE_STUDENT, A.REQUEST_REVISION, A.APPROVE_ORDER},
    R.COORDINATOR: {A.VIEW, A.REQUEST_REVISION},   # decide if coordinators may do more
}

def check_order_access(request, order_id, action=OrderAction.VIEW):
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

    if order.institution and order.institution.status == 'DEACTIVATED':
        return None, Response({'error': 'Institution has been deactivated'}, status=403)

    role = profile.role

    if action not in ROLE_ACTIONS.get(role, set()):
        return None, Response({"error": "Role not permitted for this action"}, status=403)
    
    if role == UserProfile.Role.ADMIN:
        return order, None

    elif role == UserProfile.Role.OPERATOR:
        if order.assigned_operator != request.user:
            return None, Response({'error': 'Access denied'}, status=403)

    elif role in (UserProfile.Role.INSTITUTION, UserProfile.Role.COORDINATOR):
        # INSTITUTION users are linked via Institution.user (OneToOneField on User)
        # COORDINATOR users are linked via UserProfile.institution (ForeignKey)
        if role == UserProfile.Role.INSTITUTION:
            try:
                institution = request.user.institution
            except Exception:
                return None, Response({'error': 'No institution linked to this account'}, status=403)
        else:
            institution = profile.institution

        if not institution or order.institution != institution:
            return None, Response({'error': 'Access denied'}, status=403)

    else:
        # Unknown role — deny by default
        return None, Response({'error': 'Access denied'}, status=403)

    return order, None


def check_student_access(request, student_id, action=OrderAction.VIEW):
    """
    Fetches a subject and checks that the requesting user has access to
    the order that subject belongs to.

    Returns:
        (subject, None)        — access granted
        (None, Response 403)   — access denied
        (None, Response 404)   — subject not found
    """
    try:
        student = Subject.objects.select_related('order').get(id=student_id)
    except Subject.DoesNotExist:
        return None, Response({'error': 'Subject not found'}, status=404)

    order, err = check_order_access(request, student.order_id, action=action)
    if err:
        return None, err

    return student, None
