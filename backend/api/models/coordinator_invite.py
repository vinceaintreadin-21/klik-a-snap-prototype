from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
import uuid

class CoordinatorInvite(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='invite')
    institution = models.ForeignKey('Institution', on_delete=models.CASCADE, related_name='invites')
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    expires_at = models.DateTimeField()

    class Meta: 
        db_table = 'coordinator_invites'

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at
    
    