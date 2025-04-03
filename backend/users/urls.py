from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, GoogleAuthView, CheckEmailView, 
    ResetPasswordView, ForgotPasswordView, CheckUsernameView, 
    UserStatsView, UserViewSet, ProfileView, ChangePasswordView,
    CoordinatorRequestView, CoordinatorRequestsListView,
    SendEmailView,
    CheckAuthView
)


router = DefaultRouter()
# Remove the user-stats registration since it's now an APIView
# router.register(r'user-stats',UserStatsView)  # This line causes the error


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
    
    path('coordinator-request/', CoordinatorRequestView.as_view(), name='coordinator-request'),
    
    path('coordinator-requests/', CoordinatorRequestsListView.as_view(), name='list-coordinator-requests'),
    path('coordinator-requests/<int:user_id>/', CoordinatorRequestsListView.as_view(), name='process-coordinator-request'),
    
    # Add the new email endpoint
    path('send-email/', SendEmailView.as_view(), name='send-email'),
    
    # Keep this regular path for the UserStatsView 
    path('stats/', UserStatsView.as_view(), name='user-stats'),
    
    path('check-auth/', CheckAuthView.as_view(), name='check-auth'),
    
    path('', include(router.urls)),
]
