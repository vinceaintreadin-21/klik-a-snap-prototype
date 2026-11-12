from rest_framework.response import Response
from api.models.institution import Institution 
from api.models.user_profile import UserProfile
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, parser_classes, permission_classes
from api.models.coordinator_invite import CoordinatorInvite
from api.models.account_invite import AccountInvite
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import cloudinary.uploader
from django.contrib.auth.models import User 
from django.utils.crypto import get_random_string
from rest_framework.parsers import MultiPartParser, FormParser
from api.utils.emails import send_transactional_email 
from django.db import transaction
from api.models.orders import Order



def is_admin(user): 
    try:
        return user.profile.role == UserProfile.Role.ADMIN
    except Exception as e:
        return False
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_institutions(request):
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)

    institutions = Institution.objects.select_related('suspended_by', 'deactivated_by').values(
        'id',
        'name',
        'address',
        'contact_person',
        'contact_email',
        'contact_phone',
        'logo_url',
        'status',
        'created_at',
        'suspended_at',
        'suspended_by__username',
        'suspended_reason',
        'contract_ends_at',
        'deactivated_at',
        'deactivated_by__username',
        'deactivated_reason',
        'cleanup_status',
        'cleanup_completed_at',
    )
    return Response({'institutions': list(institutions)})

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def create_institution(request):
    if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=403)
        
    try:
        name = request.data.get('name', '').strip()
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        address = request.data.get('address', '').strip()
        contact_person = request.data.get('contact_person', '').strip()
        contact_phone = request.data.get('contact_phone', '').strip()
        logo_file = request.FILES.get('logo')
        order_quota = request.data.get('order_quota', None)
        contract_ends_at = request.data.get('contract_ends_at', None)

        if not username:
            return Response({'error': 'username is required'}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already taken'}, status=400)

        if order_quota is not None: 
            try: 
                order_quota = int(order_quota)
            except (ValueError, TypeError):
                return Response({
                    'error': 'order_quota must be an integer'
                }, status=400)
        
        if Institution.objects.filter(name=name).exists():
            return Response({
                'error': 'Institution name already exists.'
            }, status=400)
            
        if not name or not address or not contact_person:
            return Response({"error": "name, address, and contact person are required"}, status=400)

        photo_url = None
        
        if logo_file:
            upload_result = cloudinary.uploader.upload(
                logo_file,
                folder='institutions/logo',
                resource_type = 'image',
                format='png'
            )
            photo_url = upload_result['secure_url']
            
        if not email:
            return Response({"error": "email is required"}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already in use'}, status=400)

        # Create user account
        user = User.objects.create_user(
            username=username,  # Use email as username
            email=email,
            password=None,
            is_staff=False,
            is_superuser=False
        )

        # Create UserProfile
        institution = Institution.objects.create(
            user = user,
            name = name,
            address = address,
            contact_person = contact_person,
            contact_email = email,
            contact_phone = contact_phone,
            logo_url = photo_url,
            order_quota=order_quota,
            contract_ends_at=contract_ends_at
        )
        profile = user.profile
        profile.role = UserProfile.Role.INSTITUTION
        profile.institution = institution
        profile.is_active = False
        profile.save()

        #Create invite token
        invite = AccountInvite.objects.create(
            user=user,
            invite_type='INSTITUTION',
            expires_at=timezone.now() + timedelta(hours=72)
        )

        base_url = request.data.get('base_url', settings.FRONTEND_BASE_URL)

        send_transactional_email(
            subject='Your QueueBits Institution Account',
            message=(
                f"Hello,\n\n"
                f"You have been registered as an institution on QueueBits.\n\n"
                f"Please click the link below to set your password and activate your account:\n"
                f"{base_url}/activate/{invite.token}\n\n"
                f"This link will expire in 72 hours.\n\n"
                f"Best regards,\nThe QueueBits Team"
            ),
            recipient_list=[email],
        )
        
        return Response({
            'message': 'Institution successfully created',
            'institution': {
                'id': institution.id,
                'name': institution.name,
                'address': institution.address,
                'contact_person': institution.contact_person,
                'contact_phone': institution.contact_phone,
                'logo_url': institution.logo_url,
                'order_quota': institution.order_quota,
                'contract_ends_at': institution.contract_ends_at
            }
        }, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])    
def institution_detail(request, id):
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)
    
    try:
        institution = Institution.objects.get(id=id)
        
        return Response({
            'institution': {
                'id': institution.id,
                'name': institution.name,
                'address': institution.address,
                'contact_person': institution.contact_person,
                'contact_email': institution.contact_email,
                'contact_phone': institution.contact_phone,
                'logo_url': institution.logo_url,
                'status': institution.status,
                'created_at': institution.created_at,
            }
        }, status=200)
    
    except Exception as e:
        return Response({'error': 'Institution not found'}, status = 404)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_institution(request, id):
    from api.models.admin_audit_log import AdminAuditLog
    from api.services.institution_cleanup import purge_institution_assets
    import logging

    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)
    new_status = request.data.get('status')
    if new_status not in Institution.Status.values:
        return Response({'error': 'Invalid institution status'}, status=400)

    with transaction.atomic():
        try:
            institution = Institution.objects.select_for_update().get(pk=id)
        except Institution.DoesNotExist:
            return Response({'error': 'Institution not found'}, status=404)

        if institution.status == Institution.Status.DEACTIVATED:
            if new_status != Institution.Status.DEACTIVATED:
                return Response({'error': 'A deactivated institution cannot be reactivated.'}, status=400)
            if institution.cleanup_status == Institution.CleanupStatus.COMPLETED:
                return Response({'status': institution.status, 'cleanup_status': institution.cleanup_status,
                                 'message': 'Institution data has already been deleted.'})
            if institution.cleanup_status == Institution.CleanupStatus.RUNNING:
                return Response({'error': 'Cleanup is already running.'}, status=409)

        if new_status != Institution.Status.DEACTIVATED:
            # Temporary suspension never purges data.
            institution.status = new_status
            suspended = new_status == Institution.Status.SUSPENDED
            institution.suspended_at = timezone.now() if suspended else None
            institution.suspended_by = request.user if suspended else None
            institution.suspended_reason = request.data.get('suspended_reason', '') if suspended else ''
            institution.save()
            return Response({'message': f'Institution status updated to {new_status}', 'status': new_status})

        if institution.contract_ends_at is None or institution.contract_ends_at > timezone.now():
            return Response({'error': 'The contract end date must have been reached.'}, status=400)
        if institution.orders.exclude(status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED]).exists():
            return Response({'error': 'Complete or cancel all orders before deactivation.'}, status=400)
        if request.data.get('confirm_deletion') is not True:
            return Response({'error': 'confirm_deletion must be true to permanently delete orders, subjects and assets.'}, status=400)
        reason = request.data.get('deactivated_reason', request.data.get('deactivation_reason', ''))
        if not isinstance(reason, str) or not reason.strip():
            return Response({'error': 'A deactivation reason is required.'}, status=400)

        institution.status = Institution.Status.DEACTIVATED
        if institution.deactivated_at is None:
            institution.deactivated_at = timezone.now()
            institution.deactivated_by = request.user
            institution.deactivated_reason = reason.strip()
        institution.cleanup_status = Institution.CleanupStatus.RUNNING
        institution.cleanup_error = ''
        institution.save()
        user_ids = [institution.user_id, *UserProfile.objects.filter(
            institution=institution, role=UserProfile.Role.COORDINATOR
        ).values_list('user_id', flat=True)]
        User.objects.filter(pk__in=user_ids).update(is_active=False)
        UserProfile.objects.filter(user_id__in=user_ids).update(is_active=False)
        # Outstanding activation links must not reactivate these accounts.
        AccountInvite.objects.filter(user_id__in=user_ids).update(is_used=True)
        CoordinatorInvite.objects.filter(institution=institution).update(is_used=True)
        AdminAuditLog.objects.create(admin_user=request.user, action='DEACTIVATE_INSTITUTION',
            target_model='Institution', target_id=id, details={'cleanup_status': 'RUNNING'})

    # Account deactivation is committed before irreversible external deletions.
    # Keep database rows until every asset operation succeeds so failed cleanup can retry.
    try:
        purge_institution_assets(institution)
        with transaction.atomic():
            institution = Institution.objects.select_for_update().get(pk=id)
            if institution.orders.exclude(status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED]).exists():
                raise ValueError('Order state changed during cleanup')
            subject_count = sum(order.subjects.count() for order in institution.orders.all())
            order_count = institution.orders.count()
            institution.orders.all().delete()  # Cascades to subjects, layouts and processing logs.
            institution.logo_url = None
            institution.cleanup_status = Institution.CleanupStatus.COMPLETED
            institution.cleanup_completed_at = timezone.now()
            institution.cleanup_error = ''
            institution.save()
            AdminAuditLog.objects.create(admin_user=request.user, action='PURGE_INSTITUTION_DATA',
                target_model='Institution', target_id=id,
                details={'deleted_orders': order_count, 'deleted_subjects': subject_count})
    except Exception:
        logging.getLogger(__name__).exception('Institution %s cleanup failed', id)
        Institution.objects.filter(pk=id).update(cleanup_status=Institution.CleanupStatus.FAILED,
            cleanup_error='Asset or database cleanup failed. See server logs and retry deactivation.')
        return Response({'error': 'Institution deactivated, but cleanup failed. Records retained for retry.',
                         'status': Institution.Status.DEACTIVATED, 'cleanup_status': Institution.CleanupStatus.FAILED}, status=502)

    return Response({'message': 'Institution deactivated; orders, subject records and assets deleted.',
                     'status': institution.status, 'cleanup_status': institution.cleanup_status,
                     'deleted_orders': order_count, 'deleted_subjects': subject_count})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_institution_orders(request, id):
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)
    
    try: 
        institution = Institution.objects.get(id=id)
    except Institution.DoesNotExist:
        return Response({'error': 'Institution not found'}, status=404)

    orders = institution.orders.all().values(
        'id',
        'school_name',
        'batch_name',
        'student_count',
        'status',
        'deadline',
        'created_at'
    )

    return Response({'orders': list(orders)})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_institution(request):
    try:
        institution = request.user.institution
    except Exception:
        return Response({'error': 'No institution linked to this account'}, status=404)

    return Response({
        'id':             institution.id,
        'name':           institution.name,
        'address':        institution.address,
        'contact_person': institution.contact_person,
        'contact_email':  institution.contact_email,
        'contact_phone':  institution.contact_phone,
        'logo_url':       institution.logo_url,
        'status':         institution.status,
        'created_at':     institution.created_at,
    })


@api_view(['PATCH'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def update_my_institution(request):
    try:
        institution = request.user.institution
    except Exception:
        return Response({'error': 'No institution linked to this account'}, status=404)

    if 'name' in request.data:
        new_name = request.data['name'].strip()
        if Institution.objects.exclude(id=institution.id).filter(name=new_name).exists():
            return Response({'error': 'Institution name already taken'}, status=400)
        institution.name = new_name

    if 'address' in request.data:
        institution.address = request.data['address'].strip()
    if 'contact_person' in request.data:
        institution.contact_person = request.data['contact_person'].strip()
    if 'contact_phone' in request.data:
        institution.contact_phone = request.data['contact_phone'].strip()

    logo_file = request.FILES.get('logo')
    if logo_file:
        upload_result = cloudinary.uploader.upload(
            logo_file,
            folder='institutions/logo',
            resource_type='image',
            format='png'
        )
        institution.logo_url = upload_result['secure_url']

    institution.save()

    return Response({
        'message':        'Profile updated successfully',
        'name':           institution.name,
        'address':        institution.address,
        'contact_person': institution.contact_person,
        'contact_phone':  institution.contact_phone,
        'logo_url':       institution.logo_url,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_my_password(request):
    current_password = request.data.get('current_password', '')
    new_password     = request.data.get('new_password', '')

    if not current_password or not new_password:
        return Response({'error': 'current_password and new_password are required'}, status=400)

    if len(new_password) < 8:
        return Response({'error': 'New password must be at least 8 characters'}, status=400)

    user = request.user
    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, status=400)

    user.set_password(new_password)
    user.save()

    return Response({'message': 'Password changed successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_coordinator(request):
    try:
        institution = request.user.institution
    except Exception:
        return Response({'error': 'No institution linked to this account'}, status=403)
    
    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip()

    if not name or not email:
        return Response({'error': 'Name and email are required'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already in use'}, status=400)

    user = User.objects.create_user(
        username=email, 
        email=email,    
        password=None,           
        first_name=name,    
        is_active=False, 
    )
    user.set_unusable_password()
    user.save()

    profile = user.profile
    profile.role = UserProfile.Role.COORDINATOR
    profile.institution = institution
    profile.is_active = False
    profile.save()

    #expiration 
    expires_in_hours = int(request.data.get('expires_in_hours', 168))
    invite = CoordinatorInvite.objects.create(
        user=user,
        institution=institution,
        expires_at=timezone.now() + timedelta(hours=expires_in_hours)
    )

    base_url = request.data.get('base_url', '').rstrip('/') or settings.FRONTEND_BASE_URL.rstrip('/')
    invite_url = f"{base_url}/coordinator/join/{invite.token}" 

    send_transactional_email(
        subject='You have been invited as a Coordinator',
        message=(
            f"Hello {name},\n\n"
            f"You have been invited to join {institution.name} as a Photo Day Coordinator on Klik-a-Snap.\n\n"
            f"Click the link below to set your password and activate your account:\n"
            f"{invite_url}\n\n"
            f"This link expires in 7 days.\n\n"
            f"Best regards,\nThe Klik-a-Snap Team"
        ),
        recipient_list=[email],
    )

    return Response({
        'message':    'Coordinator invite created',
        'name':       name,
        'email':      email,
        'token':      str(invite.token),
        'invite_url': invite_url,
        'expires_at': invite.expires_at,
    }, status=201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_coordinators(request):
    try:
        institution = request.user.institution
    except Exception:
        return Response({'error': 'No institution linked'}, status=403)

    coordinators = UserProfile.objects.filter(
        institution=institution,
        role=UserProfile.Role.COORDINATOR
    ).select_related('user').values(
        'user__id', 'user__first_name', 'user__email',
        'is_active', 'created_at'
    )

    return Response(list(coordinators))