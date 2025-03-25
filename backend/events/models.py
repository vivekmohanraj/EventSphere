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

class EventTag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    
    def __str__(self):
        return self.name

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
    venue = models.CharField(max_length=255, null=True, blank=True)
    max_participants = models.IntegerField(null=True, blank=True)
    rsvp_required = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='upcoming')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Organizer fields
    organizer_info = models.TextField(blank=True, null=True, help_text="Additional information about the event organizer")
    organizer_website = models.URLField(blank=True, null=True)
    organizer_email = models.EmailField(blank=True, null=True)
    organizer_phone = models.CharField(max_length=20, blank=True, null=True)
    organizer_social = models.JSONField(default=dict, blank=True, null=True, help_text="Social media links for the organizer")

    tags = models.ManyToManyField(EventTag, blank=True, related_name='events')

    def __str__(self):
        return self.event_name

    class Meta:
        ordering = ['-created_at']

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

class EventFeedback(models.Model):
    RATING_CHOICES = [
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent')
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='feedback')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_anonymous = models.BooleanField(default=False)
    
    class Meta:
        # Ensure a user can only give one feedback per event
        unique_together = ('event', 'user')
        ordering = ['-created_at']

class EventBookmark(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='bookmarks')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)  # Optional notes for the bookmark
    
    class Meta:
        unique_together = ('event', 'user')  # Prevent duplicate bookmarks
        ordering = ['-created_at']

class EventQuestion(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='questions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    question = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_answered = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']

class EventAnswer(models.Model):
    question = models.ForeignKey(EventQuestion, on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
