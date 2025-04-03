from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from django.db.models import Count, Sum, Avg, F, Q
from django.db.models.functions import TruncMonth, TruncDay
from datetime import datetime, timedelta
import random  # For demo data
import logging
from django.conf import settings

from .models import CoordinatorRequest, Event, EventParticipant, EventPhoto, EventUpdate, EventFeedback, EventBookmark, EventQuestion, EventAnswer, EventTag, Venue
from payments.models import Payment
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
    VenueSerializer,
)

logger = logging.getLogger(__name__)

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
        
        # Update event statuses before returning the list
        self._update_event_statuses(queryset)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    def retrieve(self, request, *args, **kwargs):
        # Get the event and update its status if needed
        instance = self.get_object()
        instance.update_status_based_on_time()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
        
    def _update_event_statuses(self, queryset):
        """
        Helper method to efficiently update event statuses
        """
        now = timezone.now()
        # Find events that need status update (upcoming but time has passed)
        past_events = queryset.filter(
            status='upcoming',
            event_time__lt=now
        )
        
        # Update statuses in bulk if there are any events to update
        if past_events.exists():
            updated_count = past_events.update(status='completed')
            logger.info(f"Updated {updated_count} events from upcoming to completed")

    def perform_create(self, serializer):
        """
        Create event with different behavior for admins vs coordinators.
        Admins can create events directly, coordinators need to pay.
        """
        user = self.request.user
        
        # Set event status based on user role
        if user.user_role == 'admin':
            # Admins create events directly in 'upcoming' status
            event = serializer.save(created_by=user)
        else:
            # Coordinators create events in 'draft' status that need payment
            event = serializer.save(created_by=user, status='draft')
            
            # Check if payment is required for coordinators
            if getattr(settings, 'COORDINATOR_EVENT_PAYMENT_REQUIRED', True):
                # We'll handle payment creation in the frontend
                logger.info(f"Created draft event {event.id} for coordinator {user.id} pending payment")
            else:
                # If payment is not required, set to upcoming automatically
                event.status = 'upcoming'
                event.save()
                
        return event
        
    def create(self, request, *args, **kwargs):
        """
        Override create to handle coordinator event creation with payment
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = self.perform_create(serializer)
        
        # Get serialized response data
        headers = self.get_success_headers(serializer.data)
        response_data = serializer.data
        
        # Add payment required flag for coordinators
        if request.user.user_role != 'admin':
            response_data['payment_required'] = getattr(settings, 'COORDINATOR_EVENT_PAYMENT_REQUIRED', True)
            response_data['is_draft'] = event.status == 'draft'
            
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def coordinator_stats(self, request):
        """Get dashboard statistics for coordinator"""
        try:
            # Get events created by this coordinator
            coordinator_events = Event.objects.filter(created_by=request.user)
            
            # Calculate stats
            managed_events_count = coordinator_events.count()
            upcoming_events_count = coordinator_events.filter(
                status='upcoming',
                event_time__gt=timezone.now()
            ).count()
            
            # Get total attendees across all coordinator's events
            total_attendees = EventParticipant.objects.filter(
                event__in=coordinator_events
            ).count()
            
            # Calculate completion rate (% of events that were completed as planned)
            completed_events = coordinator_events.filter(status='completed').count()
            completion_rate = 0
            if managed_events_count > 0:
                completion_rate = round((completed_events / managed_events_count) * 100)
            
            # Calculate average rating from feedback
            avg_rating = EventFeedback.objects.filter(
                event__in=coordinator_events
            ).aggregate(avg=Avg('rating'))
            average_rating = round(avg_rating['avg'], 1) if avg_rating['avg'] else 0
            
            # Calculate total revenue from payments
            try:
                revenue_data = Payment.objects.filter(
                    event__in=coordinator_events, 
                    payment_status='completed'
                ).aggregate(total=Sum('amount'))
                revenue = revenue_data['total'] if revenue_data['total'] else 0
            except Exception as e:
                logger.warning(f"Could not fetch payment data: {str(e)}")
                revenue = 0
            
            # Check if we have real data or no events yet
            has_real_data = managed_events_count > 0
            
            return Response({
                'managed_events': managed_events_count,
                'upcoming_events': upcoming_events_count,
                'total_attendees': total_attendees,
                'completion_rate': completion_rate,
                'average_rating': average_rating,
                'revenue': float(revenue),
                'has_real_data': has_real_data
            })
            
        except Exception as e:
            logger.error(f"Error fetching coordinator stats: {str(e)}")
            return Response({
                "error": str(e),
                "has_real_data": False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def coordinator_events(self, request):
        """Get all events managed by the logged-in coordinator"""
        try:
            events = Event.objects.filter(
                created_by=request.user
            ).order_by('event_time')
            
            # Enhance with attendee counts
            for event in events:
                event.attendee_count = EventParticipant.objects.filter(event=event).count()
            
            serializer = self.get_serializer(events, many=True)
            return Response({
                'events': serializer.data,
                'has_real_data': events.exists()
            })
        except Exception as e:
            logger.error(f"Error fetching coordinator events: {str(e)}")
            return Response({
                'events': [],
                'has_real_data': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def coordinator_event_types(self, request):
        """Get event types distribution for coordinator's events"""
        try:
            events_by_type = Event.objects.filter(
                created_by=request.user
            ).values('event_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Transform to expected format
            formatted_data = []
            for item in events_by_type:
                formatted_data.append({
                    'name': item['event_type'] or 'Other',
                    'value': item['count']
                })
                
            has_real_data = len(formatted_data) > 0
            
            if has_real_data:
                return Response({
                    'data': formatted_data,
                    'has_real_data': True
                })
            
            # Real data not available - use empty response
            return Response({
                'data': [],
                'has_real_data': False
            })
            
        except Exception as e:
            logger.error(f"Error fetching event types: {str(e)}")
            return Response({
                'data': [],
                'has_real_data': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def coordinator_attendance(self, request):
        """Get attendance data over time for coordinator's events"""
        try:
            # Get data for last 6 months
            end_date = timezone.now()
            start_date = end_date - timedelta(days=180)
            
            # Get events by this coordinator
            coordinator_events = Event.objects.filter(created_by=request.user)
            
            # Check if we have any events
            if not coordinator_events.exists():
                return Response({
                    'data': [],
                    'has_real_data': False
                })
            
            # Get monthly attendance counts
            monthly_attendance = EventParticipant.objects.filter(
                event__in=coordinator_events,
                registered_at__gte=start_date,
                registered_at__lte=end_date
            ).annotate(
                month=TruncMonth('registered_at')
            ).values('month').annotate(
                value=Count('id')
            ).order_by('month')
            
            # Format data for chart
            attendance_data = []
            for item in monthly_attendance:
                if item['month']:
                    month_name = item['month'].strftime('%b')  # Short month name
                    attendance_data.append({
                        'name': month_name,
                        'value': item['value']
                    })
            
            # If we have data, return it
            if len(attendance_data) > 0:
                return Response({
                    'data': attendance_data,
                    'has_real_data': True
                })
            
            # No registration data, but events exist - return zeros for each month
            if coordinator_events.exists():
                months = []
                current_date = start_date
                while current_date <= end_date:
                    months.append(current_date.strftime('%b'))
                    current_date = (current_date.replace(day=1) + timedelta(days=32)).replace(day=1)
                
                attendance_data = [
                    {'name': month, 'value': 0} 
                    for month in months
                ]
                
                return Response({
                    'data': attendance_data,
                    'has_real_data': True,
                    'note': 'No attendance data yet'
                })
                
            # No events yet
            return Response({
                'data': [],
                'has_real_data': False
            })
            
        except Exception as e:
            logger.error(f"Error fetching attendance data: {str(e)}")
            return Response({
                'data': [],
                'has_real_data': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def coordinator_revenue(self, request):
        """Get revenue data over time for coordinator's events"""
        try:
            # Get data for last 6 months
            end_date = timezone.now()
            start_date = end_date - timedelta(days=180)
            
            # Get events by this coordinator
            coordinator_events = Event.objects.filter(created_by=request.user)
            
            # Check if we have any events
            if not coordinator_events.exists():
                return Response({
                    'data': [],
                    'has_real_data': False
                })
            
            # Get payment data if available
            try:
                # Get monthly revenue data
                monthly_revenue = Payment.objects.filter(
                    event__in=coordinator_events,
                    payment_status='completed',
                    created_at__gte=start_date,
                    created_at__lte=end_date
                ).annotate(
                    month=TruncMonth('created_at')
                ).values('month').annotate(
                    value=Sum('amount')
                ).order_by('month')
                
                # Format data for chart
                revenue_data = []
                for item in monthly_revenue:
                    if item['month']:
                        month_name = item['month'].strftime('%b')  # Short month name
                        revenue_data.append({
                            'name': month_name,
                            'value': float(item['value'])
                        })
                
                # If we have data, return it
                if len(revenue_data) > 0:
                    return Response({
                        'data': revenue_data,
                        'has_real_data': True
                    })
                
                # No payment data, but events exist - return zeros for each month
                months = []
                current_date = start_date
                while current_date <= end_date:
                    months.append(current_date.strftime('%b'))
                    current_date = (current_date.replace(day=1) + timedelta(days=32)).replace(day=1)
                
                revenue_data = [
                    {'name': month, 'value': 0} 
                    for month in months
                ]
                
                return Response({
                    'data': revenue_data,
                    'has_real_data': True,
                    'note': 'No revenue data yet'
                })
                
            except Exception as e:
                logger.warning(f"Payment data not available: {str(e)}")
                # Payment model may not be accessible, return zeros
                months = []
                current_date = start_date
                while current_date <= end_date:
                    months.append(current_date.strftime('%b'))
                    current_date = (current_date.replace(day=1) + timedelta(days=32)).replace(day=1)
                
                revenue_data = [
                    {'name': month, 'value': 0} 
                    for month in months
                ]
                
                return Response({
                    'data': revenue_data,
                    'has_real_data': True,
                    'note': 'Payment data not available'
                })
                
        except Exception as e:
            logger.error(f"Error fetching revenue data: {str(e)}")
            return Response({
                'data': [],
                'has_real_data': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def coordinator_participants(self, request):
        """Get demographic data about participants (if available)"""
        try:
            # Get events by this coordinator
            coordinator_events = Event.objects.filter(created_by=request.user)
            
            # No events yet
            if not coordinator_events.exists():
                return Response({
                    'data': [],
                    'has_real_data': False
                })
                
            # In a real implementation, this would pull demographic data
            # For now, return a message that real demographic data is not available
            return Response({
                'data': [],
                'has_real_data': False,
                'note': 'Demographic data not available in this version'
            })
            
        except Exception as e:
            logger.error(f"Error fetching participant data: {str(e)}")
            return Response({
                'data': [],
                'has_real_data': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def coordinator_activity(self, request):
        """Get recent activity for coordinator's events"""
        try:
            # Get events by this coordinator
            coordinator_events = Event.objects.filter(created_by=request.user)
            
            # No events yet
            if not coordinator_events.exists():
                return Response({
                    'data': [],
                    'has_real_data': False
                })
            
            # Initialize activity array
            activity = []
            
            # Get recent registrations
            recent_registrations = EventParticipant.objects.filter(
                event__in=coordinator_events
            ).order_by('-registered_at')[:5]
            
            for registration in recent_registrations:
                # Format time (e.g., "2 hours ago", "3 days ago")
                time_diff = timezone.now() - registration.registered_at
                if time_diff.days > 0:
                    time_str = f"{time_diff.days} days ago"
                else:
                    hours = time_diff.seconds // 3600
                    if hours > 0:
                        time_str = f"{hours} hours ago"
                    else:
                        minutes = (time_diff.seconds % 3600) // 60
                        time_str = f"{minutes} minutes ago"
                
                activity.append({
                    'type': 'registration',
                    'event': registration.event.event_name,
                    'time': time_str
                })
            
            # Get recent feedback
            recent_feedback = EventFeedback.objects.filter(
                event__in=coordinator_events
            ).order_by('-created_at')[:5]
            
            for feedback in recent_feedback:
                time_diff = timezone.now() - feedback.created_at
                if time_diff.days > 0:
                    time_str = f"{time_diff.days} days ago"
                else:
                    hours = time_diff.seconds // 3600
                    if hours > 0:
                        time_str = f"{hours} hours ago"
                    else:
                        minutes = (time_diff.seconds % 3600) // 60
                        time_str = f"{minutes} minutes ago"
                        
                activity.append({
                    'type': 'feedback',
                    'event': feedback.event.event_name,
                    'time': time_str
                })
                
            # Try to get recent payments
            try:
                recent_payments = Payment.objects.filter(
                    event__in=coordinator_events
                ).order_by('-created_at')[:5]
                
                for payment in recent_payments:
                    time_diff = timezone.now() - payment.created_at
                    if time_diff.days > 0:
                        time_str = f"{time_diff.days} days ago"
                    else:
                        hours = time_diff.seconds // 3600
                        if hours > 0:
                            time_str = f"{hours} hours ago"
                        else:
                            minutes = (time_diff.seconds % 3600) // 60
                            time_str = f"{minutes} minutes ago"
                            
                    activity.append({
                        'type': 'payment',
                        'event': payment.event.event_name,
                        'time': time_str
                    })
            except Exception as e:
                logger.warning(f"Payment data not available for activity: {str(e)}")
            
            # Get recent event updates
            recent_updates = EventUpdate.objects.filter(
                event__in=coordinator_events
            ).order_by('-created_at')[:5]
            
            for update in recent_updates:
                time_diff = timezone.now() - update.created_at
                if time_diff.days > 0:
                    time_str = f"{time_diff.days} days ago"
                else:
                    hours = time_diff.seconds // 3600
                    if hours > 0:
                        time_str = f"{hours} hours ago"
                    else:
                        minutes = (time_diff.seconds % 3600) // 60
                        time_str = f"{minutes} minutes ago"
                        
                activity.append({
                    'type': 'update',
                    'event': update.event.event_name,
                    'time': time_str
                })
            
            # Sort by most recent
            activity = sorted(activity, key=lambda x: x['time'])
            
            # If we have activity data, return it
            if activity:
                return Response({
                    'data': activity[:5],  # Limit to 5 most recent
                    'has_real_data': True
                })
            
            # No activity data yet
            return Response({
                'data': [],
                'has_real_data': True,
                'note': 'No activity yet'
            })
                
        except Exception as e:
            logger.error(f"Error fetching activity data: {str(e)}")
            return Response({
                'data': [],
                'has_real_data': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """
        Register for an event with capacity limit check.
        """
        # Get the event ID from the request data
        event_id = request.data.get('event')
        if not event_id:
            return Response(
                {"error": "Event ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Get the event
            event = Event.objects.get(id=event_id)
            
            # Check if the user is already registered
            if EventParticipant.objects.filter(event=event, user=request.user).exists():
                return Response(
                    {"error": "You are already registered for this event"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if the event has reached its capacity
            if event.max_participants and event.max_participants > 0:
                current_participants = EventParticipant.objects.filter(
                    event=event, 
                    status__in=['registered', 'attended']
                ).count()
                
                if current_participants >= event.max_participants:
                    return Response(
                        {"error": "This event has reached its maximum capacity"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create serializer with event ID and user
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            # Get updated participant count
            updated_count = EventParticipant.objects.filter(
                event=event, 
                status__in=['registered', 'attended']
            ).count()
            
            # Include capacity information in response
            response_data = serializer.data
            response_data.update({
                'event_capacity': {
                    'max_participants': event.max_participants,
                    'current_participants': updated_count,
                    'spots_remaining': event.max_participants - updated_count if event.max_participants else None,
                    'is_full': event.max_participants and updated_count >= event.max_participants
                }
            })
            
            headers = self.get_success_headers(serializer.data)
            return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Event.DoesNotExist:
            return Response(
                {"error": "Event not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def my_participations(self, request):
        participations = self.queryset.filter(user=request.user)
        serializer = self.get_serializer(participations, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=["get"])
    def event_capacity(self, request):
        """
        Get capacity information for an event.
        """
        event_id = request.query_params.get('event_id')
        if not event_id:
            return Response(
                {"error": "Event ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            event = Event.objects.get(id=event_id)
            current_participants = EventParticipant.objects.filter(
                event=event, 
                status__in=['registered', 'attended']
            ).count()
            
            return Response({
                'max_participants': event.max_participants,
                'current_participants': current_participants,
                'spots_remaining': event.max_participants - current_participants if event.max_participants else None,
                'is_full': event.max_participants and current_participants >= event.max_participants
            })
            
        except Event.DoesNotExist:
            return Response(
                {"error": "Event not found"},
                status=status.HTTP_404_NOT_FOUND
            )


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
        event = question.event
        
        serializer = EventAnswerSerializer(data={
            'question': question.id,
            'answer': request.data.get('answer')
        })
        
        if serializer.is_valid():
            # Save answer with the current user
            answer = serializer.save(user=request.user)
            
            # Mark the question as answered
            if not question.is_answered:
                question.is_answered = True
                question.save()
                
            # Include whether this is an official response in the response data
            # This should be true only if:
            # 1. The user is the event creator (organizer)
            # 2. The user is an admin
            # 3. The user is a coordinator assigned to this event
            is_admin = request.user.user_role == 'admin'
            is_event_creator = request.user == event.created_by
            is_event_coordinator = request.user.user_role == 'coordinator' and hasattr(event, 'coordinators') and request.user in event.coordinators.all()
            
            data = serializer.data
            data['is_official'] = is_admin or is_event_creator or is_event_coordinator
            
            return Response(data, status=201)
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


class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    
    def get_permissions(self):
        """
        Allow anyone to view venues, but only admin to modify them.
        """
        if self.action in ['list', 'retrieve']:
            return []
        return [IsAuthenticated()]
