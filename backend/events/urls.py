from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CoordinatorRequestViewSet,
    EventViewSet,
    EventPhotoViewSet,
    EventParticipantViewSet,
    EventUpdateViewSet,
    EventFeedbackViewSet,
    EventQuestionViewSet,
    EventTagViewSet,
    VenueViewSet,
)

router = DefaultRouter()
router.register(r'coordinator-requests', CoordinatorRequestViewSet)
router.register(r'events', EventViewSet)
router.register(r'photos', EventPhotoViewSet)
router.register(r'participants', EventParticipantViewSet)
router.register(r'updates', EventUpdateViewSet)
router.register(r'questions', EventQuestionViewSet)
router.register(r'tags', EventTagViewSet)
router.register(r'venues', VenueViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('events/<int:event_id>/feedback/', EventFeedbackViewSet.as_view({'get': 'list', 'post': 'create'})),
    
    # Add explicit coordinator dashboard endpoints
    path('coordinator-stats/', EventViewSet.as_view({'get': 'coordinator_stats'})),
    path('coordinator-events/', EventViewSet.as_view({'get': 'coordinator_events'})),
    path('coordinator-event-types/', EventViewSet.as_view({'get': 'coordinator_event_types'})),
    path('coordinator-attendance/', EventViewSet.as_view({'get': 'coordinator_attendance'})),
    path('coordinator-revenue/', EventViewSet.as_view({'get': 'coordinator_revenue'})),
    path('coordinator-activity/', EventViewSet.as_view({'get': 'coordinator_activity'})),
]