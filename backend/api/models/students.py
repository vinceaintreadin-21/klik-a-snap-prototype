from django.db import models
from django.utils import timezone

class Student(models.Model):
    class PhotoStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSED = 'PROCESSED', 'Processed'
        MANUAL_REVIEW = 'MANUAL_REVIEW', 'Manual Review'

    order = models.ForeignKey(
        'Order',
        on_delete=models.CASCADE,
        related_name='students'
    )
    
    def student_photo_path(instance, filename):
        return f'student_photos/order_{instance.order_id}/{filename}'

    # Identity
    student_id = models.CharField(max_length=50)
    full_name = models.CharField(max_length=255)
    grade_level = models.CharField(max_length=50)
    section = models.CharField(max_length=100, blank=True)

    # Photos
    photo = models.ImageField(
        upload_to=student_photo_path,
        null=True, blank=True,
    )
    processed_photo = models.ImageField(
        upload_to='processed_photos/',
        null=True, blank=True
    )
    
    #QR Code
    qr_code_data = models.CharField(
        max_length = 255,
        unique = True,
        null = True,
        blank = True,
        editable = False
    )
    
    qr_code_url = models.URLField(
        max_length=500,
        null=True, blank=True,
        help_text = 'Cloudinary URL for QR code'
    )
    

    # Status flags
    photo_status = models.CharField(
        max_length=20,
        choices=PhotoStatus.choices,
        default=PhotoStatus.PENDING
    )
    

    is_approved = models.BooleanField(default=False)
    is_walk_in = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'
        unique_together = ('order', 'student_id')
        indexes = [
            models.Index(fields=['qr_code_data'])
        ]

    def __str__(self):
        return f"{self.student_id} - {self.full_name}"