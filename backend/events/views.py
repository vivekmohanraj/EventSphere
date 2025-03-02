from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import CoordinatorRequest, Event, EventPhoto, EventParticipant, EventUpdate
from .serializers import (
    CoordinatorRequestSerializer, EventSerializer, 
    EventPhotoSerializer, EventParticipantSerializer, 
    EventUpdateSerializer
)

class CoordinatorRequestViewSet(viewsets.ModelViewSet):
    queryset = CoordinatorRequest.objects.all()
    serializer_class = CoordinatorRequestSerializer
    
    @action(detail=True, methods=['post'])
    def process_request(self, request, pk=None):
        coordinator_request = self.get_object()
        status = request.data.get('status')
        if status not in ['approved', 'rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        coordinator_request.status = status
        coordinator_request.admin = request.user
        coordinator_request.processed_at = timezone.now()
        coordinator_request.save()
        
        return Response(CoordinatorRequestSerializer(coordinator_request).data)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter events based on user role"""
        user = self.request.user
        if user.user_type == 'admin':
            return Event.objects.all()
        elif user.user_type == 'coordinator':
            return Event.objects.filter(created_by=user)
        return Event.objects.filter(status='upcoming')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class EventPhotoViewSet(viewsets.ModelViewSet):
    queryset = EventPhoto.objects.all()
    serializer_class = EventPhotoSerializer

class EventParticipantViewSet(viewsets.ModelViewSet):
    queryset = EventParticipant.objects.all()
    serializer_class = EventParticipantSerializer
    
    @action(detail=False, methods=['get'])
    def my_participations(self, request):
        participations = self.queryset.filter(user=request.user)
        serializer = self.get_serializer(participations, many=True)
        return Response(serializer.data)

class EventUpdateViewSet(viewsets.ModelViewSet):
    queryset = EventUpdate.objects.all()
    serializer_class = EventUpdateSerializer
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
