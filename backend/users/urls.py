from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, GoogleAuthView, CheckEmailView, 
    ResetPasswordView, ForgotPasswordView, CheckUsernameView, 
    UserStatsView, UserViewSet, ProfileView, ChangePasswordView
)


router = DefaultRouter()
router.register(r'user-stats',UserStatsView)


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("google-login/", GoogleAuthView.as_view(), name="google-auth"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("forgot-password/", ForgotPasswordView.as_view(),name="forgot-password"),
    path('check-username/', CheckUsernameView.as_view(), name='check-username'),
    path('check-email/', CheckEmailView.as_view(), name='check-email'),
    path('users/', UserViewSet.as_view({'get': 'list'}), name='users'),
    path('users/<int:pk>/', UserViewSet.as_view({'get': 'retrieve'}), name='user-detail'),
    path('users/<int:pk>/update-role/', UserViewSet.as_view({'post': 'update_role'}), name='update-role'),
    
    # Profile view/update endpoints (supports GET, PATCH, PUT)
    path('users/profile/', ProfileView.as_view(), name='profile'),
    path('users/me/', ProfileView.as_view(), name='profile-me'),
    
    # Additional compatibility endpoints for ProfileView
    path('api/profile/', ProfileView.as_view(), name='api-profile'),
    path('api/users/me/', ProfileView.as_view(), name='api-me'),
    path('api/users/profile/', ProfileView.as_view(), name='api-users-profile'),
    path('auth/users/me/', ProfileView.as_view(), name='auth-me'),
    
    # Password change endpoints
    path('users/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('api/users/change-password/', ChangePasswordView.as_view(), name='api-change-password'),
    path('auth/password/change/', ChangePasswordView.as_view(), name='auth-password-change'),
    path('users/password/', ChangePasswordView.as_view(), name='users-password'),
    path('users/password-change/', ChangePasswordView.as_view(), name='users-password-change'),
    
    path('', include(router.urls)),
]
