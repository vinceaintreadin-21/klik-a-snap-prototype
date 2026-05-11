from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class Institution(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'
        SUSPENDED = 'SUSPENDED', 'Suspended'

    # Linked login account
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='institution'
    )

    # Institution details
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    contact_person = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True)
    
    logo_url = models.URLField(
        max_length=500,
        null=True,
        blank=True,  
        help_text="URL to institution's logo"
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    
    suspended_at = models.DateTimeField(null=True, blank=True)
    suspended_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='suspended_institutions')
    suspended_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institutions'

    def __str__(self):
        return self.name