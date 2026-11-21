from django.db import models 

class ProcessingAttempt(models.Model):
    class Outcome(models.TextChoices):
        PROCESSED = "processed", "Processed",
        MANUAL_REVIEW = "manual_review", "Manual review"
        ERROR = "error", "Unexpected error"

    order = models.ForeignKey(
        "api.Order",
        on_delete=models.CASCADE,
        related_name="processing_attempts"
    )

    subject = models.ForeignKey(
        "api.Subject",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    elapsed_ms = models.PositiveIntegerField()
    outcome = models.CharField(max_length=16, choices=Outcome.choices)
    fail_reason = models.CharField(max_length=32, blank=True)
    detector = models.CharField(max_length=16, blank=True)
    face_confidence = models.FloatField(null=True, blank=True)