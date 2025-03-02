from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CoordinatorRequestViewSet,
    EventViewSet,
    EventPhotoViewSet,
    EventParticipantViewSet,
    EventUpdateViewSet
)

router = DefaultRouter()
router.register(r'coordinator-requests', CoordinatorRequestViewSet)
router.register(r'events', EventViewSet)
router.register(r'event-photos', EventPhotoViewSet)
router.register(r'event-participants', EventParticipantViewSet)
router.register(r'event-updates', EventUpdateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]