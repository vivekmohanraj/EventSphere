from rest_framework import serializers
from .models import (
    CoordinatorRequest, 
    Event, 
    EventParticipant, 
    EventPhoto, 
    EventUpdate, 
    EventFeedback,
    EventBookmark,
    EventQuestion,
    EventAnswer,
    EventTag,
    Venue  # Add the new Venue model
)

class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = ['id', 'name', 'address', 'capacity', 'price_per_hour', 
                 'description', 'image_url', 'features']

class CoordinatorRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoordinatorRequest
        fields = '__all__'
        read_only_fields = ('status', 'admin', 'processed_at')

class EventPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventPhoto
        fields = '__all__'

class EventParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventParticipant
        fields = '__all__'
        read_only_fields = ('user',)

class EventUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventUpdate
        fields = '__all__'

class EventTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventTag
        fields = ['id', 'name', 'slug']

class EventSerializer(serializers.ModelSerializer):
    photos = EventPhotoSerializer(many=True, read_only=True)
    participants = EventParticipantSerializer(many=True, read_only=True)
    updates = EventUpdateSerializer(many=True, read_only=True)
    organizer_name = serializers.SerializerMethodField()
    tags_details = EventTagSerializer(source='tags', many=True, read_only=True)
    participant_count = serializers.SerializerMethodField(read_only=True)
    is_full = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'created_by', 'event_name', 'event_type', 'description',
            'audience', 'is_paid', 'price', 'event_time', 'venue',
            'max_participants', 'rsvp_required', 'status', 'created_at',
            'updated_at', 'photos', 'participants', 'updates',
            'organizer_info', 'organizer_website', 'organizer_email',
            'organizer_phone', 'organizer_social', 'organizer_name',
            'tags', 'tags_details', 'participant_count', 'is_full'
        ]
        read_only_fields = ('created_by', 'created_at', 'updated_at')

    def get_organizer_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username
        
    def get_participant_count(self, obj):
        """Get the number of active participants for this event"""
        return obj.participants.filter(status__in=['registered', 'attended']).count()
        
    def get_is_full(self, obj):
        """Determine if event has reached its capacity"""
        if not obj.max_participants:
            return False
        return self.get_participant_count(obj) >= obj.max_participants
        
    def validate_max_participants(self, value):
        """Validate that max_participants is a positive number when provided"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Maximum participants must be a positive number.")
        return value

class EventFeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EventFeedback
        fields = ['id', 'event', 'user', 'user_name', 'rating', 'comment', 
                  'created_at', 'updated_at', 'is_anonymous']
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        if obj.is_anonymous:
            return "Anonymous"
        return obj.user.username

class EventBookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventBookmark
        fields = ['id', 'event', 'user', 'created_at', 'notes']
        read_only_fields = ['user']

class EventAnswerSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EventAnswer
        fields = ['id', 'question', 'user', 'user_name', 'answer', 'created_at']
        read_only_fields = ['user']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

class EventQuestionSerializer(serializers.ModelSerializer):
    answers = EventAnswerSerializer(many=True, read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EventQuestion
        fields = ['id', 'event', 'user', 'user_name', 'question', 'created_at', 'is_answered', 'answers']
        read_only_fields = ['user', 'is_answered']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username