from django.urls import path
from .views import RegisterView, LoginView,GoogleAuthView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("google-login/", GoogleAuthView.as_view(), name="google-auth"),
]
