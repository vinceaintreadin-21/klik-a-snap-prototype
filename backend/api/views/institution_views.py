from rest_framework.response import Response
from api.models.institution import Institution 
from api.models.user_profile import UserProfile
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, parser_classes, permission_classes
import cloudinary.uploader
from django.utils import timezone
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

    return Response({'institutions': Institution.objects.all().values()})

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
                'error': 'Institution name alredy exists.'
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
        profile = user.profile
        profile.role = UserProfile.Role.INSTITUTION
        profile.save()
                
        institution = Institution.objects.create(
            user = user,
            name = name,
            address = address,
            contact_person = contact_person,
            contact_email = email,
            contact_phone = contact_phone,
            logo_url = photo_url
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

    return Response({'orders': list(orders)})