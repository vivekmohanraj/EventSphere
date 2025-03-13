from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import CoordinatorRequest, Event, EventParticipant, EventPhoto, EventUpdate
from .serializers import (
    CoordinatorRequestSerializer,
    EventParticipantSerializer,
    EventPhotoSerializer,
    EventSerializer,
    EventUpdateSerializer,
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
        """Filter events based on user role"""
        queryset = Event.objects.all().order_by("-created_at")  # Add ordering
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


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
