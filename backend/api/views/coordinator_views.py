from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from api.models.orders import Order
from api.models.students import Student
from api.models.user_profile import UserProfile
from django.db.models import Count
from api.models.coordinator_invite import CoordinatorInvite
from rest_framework.permissions import AllowAny


def is_coordinator(user):
    try:
        return user.profile.role == UserProfile.Role.COORDINATOR
    except Exception:
        return False

@api_view(['GET'])
@permission_classes([AllowAny])
def validate_invite(request, token):
    """Check if a token is valid before showing the set-password form."""
    try:
        invite = CoordinatorInvite.objects.select_related('user', 'institution').get(token=token)
    except CoordinatorInvite.DoesNotExist:
        return Response({'error': 'Invalid invite link'}, status=404)

    if not invite.is_valid():
        return Response({'error': 'This invite link has expired or already been used'}, status=410)

    return Response({
        'name':             invite.user.first_name,
        'email':            invite.user.email,
        'institution_name': invite.institution.name,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def accept_invite(request, token):
    """Coordinator sets their password and activates their account."""
    try:
        invite = CoordinatorInvite.objects.select_related('user').get(token=token)
    except CoordinatorInvite.DoesNotExist:
        return Response({'error': 'Invalid invite link'}, status=404)

    if not invite.is_valid():
        return Response({'error': 'This invite link has expired or already been used'}, status=410)

    password = request.data.get('password', '')
    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters'}, status=400)

    user = invite.user
    user.set_password(password)
    user.save()

    # Activate the profile
    profile = user.profile
    profile.is_active = True
    profile.save()

    # Mark invite as used
    invite.is_used = True
    invite.save()

    # Log them in immediately — return JWT tokens
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)

    return Response({
        'message': 'Account activated. Welcome!',
        'tokens': {
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coordinator_orders(request):
    """Returns all orders for the coordinator's institution."""
    if not is_coordinator(request.user):
        return Response({'error': 'Coordinator access required'}, status=403)

    institution = request.user.profile.institution
    if not institution:
        return Response({'error': 'No institution linked to this account'}, status=403)

    orders = Order.objects.filter(
        institution=institution
    ).annotate(
        total_students=Count('students')
    ).values(
        'id', 'school_name', 'batch_name', 'status', 'created_at', 'total_students'
    )

    return Response([
        {**{k: v for k, v in o.items() if k != 'total_students'}, 'student_count': o['total_students']}
        for o in orders
    ])

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coordinator_search_students(request):
    """
    Searches students across all orders belonging to the coordinator's institution.
    Query param: ?q=<name or student_id>
    """
    if not is_coordinator(request.user):
        return Response({'error': 'Coordinator access required'}, status=403)

    institution = request.user.profile.institution
    if not institution:
        return Response({'error': 'No institution linked'}, status=403)

    query = request.GET.get('q', '').strip()
    if not query:
        return Response({'error': 'Query parameter q is required'}, status=400)

    students = Student.objects.filter(
        order__institution=institution
    ).filter(
        full_name__icontains=query
    ).select_related('order').values(
        'id', 'student_id', 'full_name', 'grade_level',
        'photo_status', 'qr_code_url',
        'order__id', 'order__school_name', 'order__batch_name', 'order__status'
    )

    return Response(list(students))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coordinator_student_list(request, order_id):
    """Returns full student list for an order belonging to the coordinator's institution."""
    if not is_coordinator(request.user):
        return Response({'error': 'Coordinator access required'}, status=403)

    institution = request.user.profile.institution
    if not institution:
        return Response({'error': 'No institution linked'}, status=403)

    try:
        order = Order.objects.get(id=order_id, institution=institution)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    students = Student.objects.filter(order=order).values(
        'id', 'student_id', 'full_name', 'grade_level',
        'photo_status', 'is_photographed', 'is_walk_in', 'qr_code_url'
    ).order_by('full_name')

    return Response(list(students))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_photographed(request, student_id):
    """Toggle is_photographed for a student. Coordinator only."""
    if not is_coordinator(request.user):
        return Response({'error': 'Coordinator access required'}, status=403)

    try:
        student = Student.objects.select_related('order__institution').get(id=student_id)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)

    if student.order.institution != request.user.profile.institution:
        return Response({'error': 'Access denied'}, status=403)

    student.is_photographed = not student.is_photographed
    student.save(update_fields=['is_photographed'])

    return Response({'id': student.id, 'is_photographed': student.is_photographed})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coordinator_proofing_orders(request):
    """Returns orders in PROOFING status for the coordinator's institution."""
    if not is_coordinator(request.user):
        return Response({'error': 'Coordinator access required'}, status=403)

    institution = request.user.profile.institution
    if not institution:
        return Response({'error': 'No institution linked'}, status=403)

    orders = Order.objects.filter(
        institution=institution,
        status=Order.Status.PROOFING
    ).values('id', 'school_name', 'batch_name', 'student_count')

    return Response(list(orders))
    