from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from .models import CoordinatorRequest, Event, EventParticipant, EventPhoto, EventUpdate, EventFeedback, EventBookmark, EventQuestion, EventAnswer, EventTag
from .serializers import (
    CoordinatorRequestSerializer,
    EventParticipantSerializer,
    EventPhotoSerializer,
    EventSerializer,
    EventUpdateSerializer,
    EventFeedbackSerializer,
    EventBookmarkSerializer,
    EventQuestionSerializer,
    EventAnswerSerializer,
    EventTagSerializer,
)


class CoordinatorRequestViewSet(viewsets.ModelViewSet):
    queryset = CoordinatorRequest.objects.all()
    serializer_class = CoordinatorRequestSerializer

    @action(detail=True, methods=["post"])
    def process_request(self, request, pk=None):
        coordinator_request = self.get_object()
        status = request.data.get("status")
        if status not in ["approved", "rejected"]:
            return Response(
                {"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST
            )

        coordinator_request.status = status
        coordinator_request.admin = request.user
        coordinator_request.processed_at = timezone.now()
        coordinator_request.save()

        return Response(CoordinatorRequestSerializer(coordinator_request).data)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        queryset = Event.objects.all()
        
        # Filter by tag
        tag = self.request.query_params.get('tag', None)
        if tag:
            queryset = queryset.filter(tags__slug=tag)
            
        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def related(self, request, pk=None):
        """Get related events based on event type and tags"""
        event = self.get_object()
        
        # Get events of the same type, excluding the current event
        related_events = Event.objects.filter(
            event_type=event.event_type,
            status='upcoming'  # Only show upcoming events
        ).exclude(
            id=event.id
        ).order_by(
            'event_time'
        )[:3]  # Limit to 3 related events
        
        serializer = self.get_serializer(related_events, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post', 'delete'])
    def bookmark(self, request, pk=None):
        """Toggle bookmark status for an event"""
        event = self.get_object()
        bookmark = EventBookmark.objects.filter(event=event, user=request.user).first()
        
        if request.method == 'DELETE' and bookmark:
            bookmark.delete()
            return Response({"status": "removed"}, status=200)
        elif request.method == 'POST' and not bookmark:
            EventBookmark.objects.create(event=event, user=request.user)
            return Response({"status": "bookmarked"}, status=201)
        
        return Response({"status": "no change"}, status=200)

    @action(detail=False, methods=['get'])
    def bookmarked(self, request):
        """Get all bookmarked events for the current user"""
        bookmarked_events = Event.objects.filter(bookmarks__user=request.user)
        serializer = self.get_serializer(bookmarked_events, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'])
    def questions(self, request, pk=None):
        """Get or create questions for an event"""
        event = self.get_object()
        
        if request.method == 'GET':
            questions = EventQuestion.objects.filter(event=event)
            serializer = EventQuestionSerializer(questions, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = EventQuestionSerializer(data={
                'event': event.id,
                'question': request.data.get('question')
            })
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)


class EventPhotoViewSet(viewsets.ModelViewSet):
    queryset = EventPhoto.objects.all()
    serializer_class = EventPhotoSerializer


class EventParticipantViewSet(viewsets.ModelViewSet):
    queryset = EventParticipant.objects.all()
    serializer_class = EventParticipantSerializer

    @action(detail=False, methods=["get"])
    def my_participations(self, request):
        participations = self.queryset.filter(user=request.user)
        serializer = self.get_serializer(participations, many=True)
        return Response(serializer.data)


class EventUpdateViewSet(viewsets.ModelViewSet):
    queryset = EventUpdate.objects.all()
    serializer_class = EventUpdateSerializer

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class EventFeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = EventFeedbackSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return EventFeedback.objects.filter(event_id=self.kwargs.get('event_id'))
    
    def perform_create(self, serializer):
        event_id = self.kwargs.get('event_id')
        event = get_object_or_404(Event, id=event_id)
        
        # Check if user has attended the event
        if not EventParticipant.objects.filter(event=event, user=self.request.user).exists():
            raise ValidationError("You must be a participant to leave feedback")
            
        # Check if user has already left feedback
        if EventFeedback.objects.filter(event=event, user=self.request.user).exists():
            raise ValidationError("You have already left feedback for this event")
            
        serializer.save(user=self.request.user, event=event)


class EventQuestionViewSet(viewsets.ModelViewSet):
    queryset = EventQuestion.objects.all()
    serializer_class = EventQuestionSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def answers(self, request, pk=None):
        """Add an answer to a question"""
        question = self.get_object()
        
        # Only event organizer or coordinators can answer
        event = question.event
        if request.user != event.created_by and not request.user.is_coordinator:
            return Response(
                {"error": "Only event organizers can answer questions"},
                status=403
            )
        
        serializer = EventAnswerSerializer(data={
            'question': question.id,
            'answer': request.data.get('answer')
        })
        
        if serializer.is_valid():
            serializer.save(user=request.user)
            # Mark question as answered
            question.is_answered = True
            question.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class EventTagViewSet(viewsets.ModelViewSet):
    queryset = EventTag.objects.all()
    serializer_class = EventTagSerializer
    
    @action(detail=True)
    def events(self, request, pk=None):
        """Get all events with this tag"""
        tag = self.get_object()
        events = Event.objects.filter(tags=tag)
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)
