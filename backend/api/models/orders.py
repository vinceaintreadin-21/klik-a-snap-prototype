from django.db import models
from django.contrib.auth.models import User

class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Data'
        PROCESSING = 'PROCESSING', 'AI Generating'
        PROOFING = 'PROOFING', 'Awaiting Approval'
        APPROVED = 'APPROVED', 'Approved by Institution'
        PRINTING = 'PRINTING', 'Printing'
        COMPLETED = 'COMPLETED', 'Ready for Pickup'
        CANCELLED = 'CANCELLED', 'Cancelled'
        FAILED = 'FAILED', 'Processing Failed'

    # Relationships
    institution = models.ForeignKey(
        'Institution',
        on_delete=models.PROTECT,       # never delete an institution with orders
        related_name='orders',
        null=True,   # add this
        blank=True   # add this
    )
    assigned_operator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_orders'
    )

    # Core fields
    school_name = models.CharField(max_length=255)
    batch_name = models.CharField(
        max_length=100,
        help_text="e.g., SY 2025-2026 First Batch"
    )
    student_count = models.PositiveIntegerField(default=0)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    # Institution approval
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_orders'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approval_notes = models.TextField(blank=True)

    # Audit
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.school_name} - {self.batch_name}"