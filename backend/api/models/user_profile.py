from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.db import models


class UserProfile(models.Model):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        OPERATOR = 'OPERATOR', 'Operator'
        INSTITUTION = 'INSTITUTION', 'Institution'
        COORDINATOR = 'COORDINATOR', 'Coordinator'

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.OPERATOR
    )

    # Only populated if role == COORDINATOR
    institution = models.ForeignKey(
        'Institution',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='coordinators'
    )

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_active = models.BooleanField(default=True)
    last_password_reset = models.DateTimeField(default=timezone.now, blank=True)
    deactivated_at = models.DateTimeField(default=timezone.now, editable=False)
    deactivated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deactivated_profiles')

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f"{self.user.username} ({self.role})"