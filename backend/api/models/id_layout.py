from django.db import models
from django.utils import timezone

class IDLayout(models.Model):
    order = models.OneToOneField(
        'Order', 
        on_delete=models.CASCADE, 
        related_name='layout'
    )
    
    # Background
    background_image = models.ImageField(upload_to='id_backgrounds/', null=True, blank=True)
    background_image_url = models.URLField(max_length=500, null=True, blank=True)
    
    # ID card dimensions (in pixels, for Pillow canvas)
    card_width = models.PositiveIntegerField(default=638)
    card_height = models.PositiveIntegerField(default=1012)
    
    # Photo box placement
    photo_x = models.PositiveIntegerField(default=169)
    photo_y = models.PositiveIntegerField(default=180)
    photo_width = models.PositiveIntegerField(default=300)
    photo_height = models.PositiveIntegerField(default=350)
    
    # Field placement config (stored as JSON)
    # Shape: { "full_name": {"x": 100, "y": 560, "font_size": 28, "color": "#000000", "align": "center"}, ... }
    fields_config = models.JSONField(default=dict)
    
    # Toggle which fields are visible
    show_full_name = models.BooleanField(default=True)
    show_student_id = models.BooleanField(default=True)
    show_grade_level = models.BooleanField(default=True)
    show_school_name = models.BooleanField(default=True)
    show_school_year = models.BooleanField(default=True)
    show_signature_line = models.BooleanField(default=True)
    show_qr_code = models.BooleanField(default=True)
    show_barcode = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'id_layouts'

    def __str__(self):
        return f"Layout for Order #{self.order_id}"