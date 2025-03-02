from django.db import models
from django.conf import settings

class CoordinatorRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coordinator_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='processed_requests')
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

class Event(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('canceled', 'Canceled'),
        ('postponed', 'Postponed'),
        ('completed', 'Completed')
    ]
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event_name = models.CharField(max_length=255)
    event_type = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    audience = models.TextField(null=True, blank=True)
    is_paid = models.BooleanField()
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    event_time = models.DateTimeField()
    rsvp_required = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='upcoming')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

def event_photo_path(instance, filename):
    # Generate file path: event_photos/event_id/filename
    return f'event_photos/event_{instance.event.id}/{filename}'

class EventPhoto(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='photos')
    photo_url = models.ImageField(upload_to=event_photo_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class EventParticipant(models.Model):
    STATUS_CHOICES = [
        ('registered', 'Registered'),
        ('attended', 'Attended'),
        ('canceled', 'Canceled')
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='registered')

class EventUpdate(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='updates')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
