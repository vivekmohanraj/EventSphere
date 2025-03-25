from rest_framework import serializers
from .models import CoordinatorRequest, Event, EventPhoto, EventParticipant, EventUpdate, EventFeedback, EventBookmark, EventAnswer, EventQuestion, EventTag

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

    class Meta:
        model = Event
        fields = [
            'id', 'created_by', 'event_name', 'event_type', 'description',
            'audience', 'is_paid', 'price', 'event_time', 'venue',
            'max_participants', 'rsvp_required', 'status', 'created_at',
            'updated_at', 'photos', 'participants', 'updates',
            'organizer_info', 'organizer_website', 'organizer_email',
            'organizer_phone', 'organizer_social', 'organizer_name',
            'tags', 'tags_details'
        ]
        read_only_fields = ('created_by', 'created_at', 'updated_at')

    def get_organizer_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username

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