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
)

router = DefaultRouter()
router.register(r'coordinator-requests', CoordinatorRequestViewSet)
router.register(r'events', EventViewSet)
router.register(r'photos', EventPhotoViewSet)
router.register(r'participants', EventParticipantViewSet)
router.register(r'updates', EventUpdateViewSet)
router.register(r'questions', EventQuestionViewSet)
router.register(r'tags', EventTagViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('events/<int:event_id>/feedback/', EventFeedbackViewSet.as_view({'get': 'list', 'post': 'create'})),
]