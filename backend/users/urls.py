from django.urls import path
from .views import RegisterView, LoginView,GoogleAuthView,CheckEmailView,ResetPasswordView,ForgotPasswordView,CheckUsernameView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("google-login/", GoogleAuthView.as_view(), name="google-auth"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("forgot-password/", ForgotPasswordView.as_view(),name="forgot-password"),
    path('check-username/', CheckUsernameView.as_view(), name='check-username'),
    path('check-email/', CheckEmailView.as_view(), name='check-email'),
]
