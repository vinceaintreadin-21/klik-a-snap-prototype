from django.contrib.auth.models import User
from rest_framework import serializers
from api.models.user_profile import UserProfile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password')
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )

        # 👇 FIX: Safe update/fallback if a signal already built it
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': UserProfile.Role.OPERATOR}
        )
        
        # If the profile already existed but needs the default role enforced:
        if not created:
            profile.role = UserProfile.Role.OPERATOR
            profile.save()
        
        return user
        
class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_staff', 'is_superuser', 'role')
    
    def get_role(self, obj):
        try:
            return obj.profile.role
        except UserProfile.DoesNotExist:
            return None