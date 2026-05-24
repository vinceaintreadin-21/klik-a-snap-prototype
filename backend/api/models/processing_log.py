from django.db import models 
from django.utils import timezone
from django.contrib.auth.models import User

class ProcessingLog(models.Model):
    class LogLevel(models.TextChoices):
        INFO = 'INFO', 'Info',
        WARNING = 'WARNING', 'Warning',
        ERROR = 'Error', 'Error',
        CRITICAL = 'CRITICAL', 'Critical',
        
    order = models.ForeignKey(
        'Order',
        on_delete=models.CASCADE,
        related_name='logs'
    )
    
    level = models.CharField(
        max_length=20,
        choices=LogLevel.choices
    )
    
    message = models.TextField()
    details = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'processing_logs'
        
    def __str__(self):
        return f"{self.level} - Order {self.order_id} - {self.created_at}" 