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
from users.views import UserViewSet

# Create router for admin endpoints
admin_router = DefaultRouter()
admin_router.register(r"admin-users", UserViewSet, basename="admin-users")
admin_router.register(r"admin-events", EventViewSet, basename="admin-events")
admin_router.register(r"admin-payments", PaymentViewSet, basename="admin-payments")

urlpatterns = [
    path("users/", include("users.urls")),
    path("events/", include("events.urls")),
    path("payments/", include("payments.urls")),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/", include("rest_framework.urls"))
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
