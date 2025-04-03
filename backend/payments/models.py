from django.db import models
from django.conf import settings
from events.models import Event, Venue

class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded')
    ]
    
    PAYMENT_TYPE_CHOICES = [
        ('event_creation', 'Event Creation Fee'),
        ('event_registration', 'Event Registration'),
        ('event_promotion', 'Event Promotion'),
        ('other', 'Other')
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='payments')
    coordinator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, default='razorpay')
    payment_status = models.CharField(
        max_length=10,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending'
    )
    payment_type = models.CharField(
        max_length=20,
        choices=PAYMENT_TYPE_CHOICES,
        default='event_creation'
    )
    transaction_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Razorpay specific fields
    razorpay_order_id = models.CharField(max_length=255, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=255, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=255, null=True, blank=True)
    
    # Additional details stored as JSON
    payment_details = models.JSONField(default=dict, blank=True, null=True)
    
    # Number of hours the venue is booked for
    booking_hours = models.PositiveIntegerField(default=3)

    def __str__(self):
        return f"Payment {self.id} - {self.event.event_name} - {self.payment_status}"
        
    class Meta:
        ordering = ['-created_at']
