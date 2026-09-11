from django.db import models 
from django.utils import timezone 
from django.contrib.auth.models import User 
import uuid 

class AccountInvite(models.Model):

    class InviteType(models.TextChoices):
        OPERATOR = 'OPERATOR', 'Operator',
        INSTITUTION = 'INSTITUTION', 'Institution'
    
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='account_invite'
    )

    invite_type = models.CharField(
        max_length=20,
        choices=InviteType.choices
    )

    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'account_invites'

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at