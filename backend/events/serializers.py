from rest_framework import serializers
from .models import CoordinatorRequest, Event, EventPhoto, EventParticipant, EventUpdate

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

class EventSerializer(serializers.ModelSerializer):
    photos = EventPhotoSerializer(many=True, read_only=True)
    participants = EventParticipantSerializer(many=True, read_only=True)
    updates = EventUpdateSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')