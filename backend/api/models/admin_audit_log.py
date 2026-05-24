from django.db import models 
from django.utils import timezone
from django.contrib.auth.models import User

class AdminAuditLog(models.Model):
    admin_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='admin_actions'
    )
    action = models.CharField(max_length=100)
    target_model = models.CharField(max_length=50)
    target_id = models.PositiveIntegerField()
    details = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'admin_audit_logs'
        
    def __str__(self):
        return f"{self.action} on {self.target_model}#{self.target_id} by {self.admin_user}"