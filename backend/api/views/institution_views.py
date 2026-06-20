from rest_framework.response import Response
from api.models.institution import Institution 
from api.models.user_profile import UserProfile
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, parser_classes, permission_classes
from api.models.coordinator_invite import CoordinatorInvite
from django.utils import timezone
from datetime import timedelta
import cloudinary.uploader
from django.contrib.auth.models import User 
from django.utils.crypto import get_random_string
from rest_framework.parsers import MultiPartParser, FormParser


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

    institutions = Institution.objects.select_related('suspended_by').values(
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
        'suspended_reason'
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
        email = request.data.get('email', '').strip()
        address = request.data.get('address', '').strip()
        contact_person = request.data.get('contact_person', '').strip()
        contact_phone = request.data.get('contact_phone', '').strip()
        logo_file = request.FILES.get('logo')
        
        if Institution.objects.filter(name=name).exists():
            return Response({
                'error': 'Institution name already exists.'
            }, status=400)
            
        if not name or not address or not contact_person:
            return Response({"error": "name, address, and contact_person are required"}, status=400)

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
        temp_password = get_random_string(
            length=12,
            allowed_chars='abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%'
        )

        user = User.objects.create_user(
            username=email,  # Use email as username
            email=email,
            password=temp_password,
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
            logo_url = photo_url
        )
        profile = user.profile
        profile.role = UserProfile.Role.INSTITUTION
        profile.institution = institution
        profile.save()
        
        return Response({
            'message': 'Institution successfully created',
            'institution': {
                'id': institution.id,
                'name': institution.name,
                'address': institution.address,
                'contact_person': institution.contact_person,
                'contact_phone': institution.contact_phone,
                'logo_url': institution.logo_url,
                'temp_password': temp_password
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
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=403)
    
    try:
        institution = Institution.objects.get(id = id)
    except Institution.DoesNotExist:
        return Response({'error': 'Institution not found'}, status=404)
    
    new_status = request.data.get('status')
    
    if new_status not in [choice[0] for choice in Institution.Status.choices]:
        return Response({'error': 'Invalid status update'}, status=400)

    institution.status = new_status
        
    if new_status == Institution.Status.SUSPENDED:
            institution.suspended_at = timezone.now()
            institution.suspended_by = request.user
            institution.suspended_reason = request.data.get('suspended_reason', '')
    else:
        institution.suspended_at = None
        institution.suspended_by = None
        institution.suspended_reason = ''
    
    institution.save()
    
    return Response({'message': f'Institution status updated to {new_status}'})
        
        
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
        is_active=True, 
    )
    user.set_unusable_password()
    user.save()

    profile = user.profile
    profile.role = UserProfile.Role.COORDINATOR
    profile.institution = institution
    profile.is_active = False
    profile.save()

    invite = CoordinatorInvite.objects.create(
        user=user,
        institution=institution,
        expires_at=timezone.now() + timedelta(days=7)
    )

    invite_url = f"{request.data.get('base_url', '')}/coordinator/join/{invite.token}" 

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