from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, LoginView,GoogleAuthView,CheckEmailView,ResetPasswordView,ForgotPasswordView,CheckUsernameView,UserStatsView, UserViewSet


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
    path('users/<int:pk>/update-role/', UserViewSet.as_view({'post': 'update_role'}), name='update-role'),
    path('', include(router.urls)),
]
