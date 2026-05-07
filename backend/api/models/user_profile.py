from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


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

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f"{self.user.username} ({self.role})"