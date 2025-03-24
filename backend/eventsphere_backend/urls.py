"""
URL configuration for eventsphere_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from events.views import EventViewSet
from payments.views import PaymentViewSet
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from users.views import UserViewSet, ProfileView, ChangePasswordView

# Create router for API endpoints
api_router = DefaultRouter()
api_router.register(r"users", UserViewSet, basename="users")
api_router.register(r"events", EventViewSet, basename="events")
api_router.register(r"payments", PaymentViewSet, basename="payments")

urlpatterns = [
    # App URLs
    path("users/", include("users.urls")),
    path("events/", include("events.urls")),
    path("payments/", include("payments.urls")),
    
    # Direct API endpoints at root level
    path("", include(api_router.urls)),  # This adds users/ at root level
    
    # Authentication endpoints
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/", include("rest_framework.urls")),
    
    # Additional compatibility endpoints for the profile feature
    path("api/", include(api_router.urls)),  # This adds api/users/
    path("api/profile/", ProfileView.as_view(), name="root-api-profile"),
    path("api/users/me/", ProfileView.as_view(), name="root-api-me"),
    path("auth/users/me/", ProfileView.as_view(), name="root-auth-me"),
    path("auth/password/change/", ChangePasswordView.as_view(), name="root-auth-password"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
