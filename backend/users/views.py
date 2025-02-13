from twilio.rest import Client
from django.shortcuts import render

# Create your views here.
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, LoginSerializer
import random
import requests

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()
        if data.get("password") != data.get("confirm_password"):
            return Response({"error": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()  # Save the user

            # Generate tokens for the newly registered user
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "User registered successfully",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,  # Include user data in the response
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        login = request.data.get("login")
        password = request.data.get("password")
        try:
            user = User.objects.filter(email=login).first() or \
                User.objects.filter(username=login).first()
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not check_password(password, user.password):
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        # TODO: Implement password reset logic
        return Response({"message": "Password reset link sent"}, status=status.HTTP_200_OK)


class OTPLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get("phone")
        user = User.objects.filter(phone=phone).first()
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        otp = random.randint(100000, 999999)
        user.otp = otp
        user.save()

        # Send OTP using Twilio
        account_sid = "your_account_sid"
        auth_token = "your_auth_token"
        client = Client(account_sid, auth_token)

        message = client.messages.create(
            body=f"Your OTP is {otp}",
            from_="+1234567890",  # Your Twilio phone number
            to=phone,
        )

        return Response({"message": f"OTP sent to {phone}"}, status=status.HTTP_200_OK)

class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        google_token = request.data.get("token")
        google_url = "https://oauth2.googleapis.com/tokeninfo"
        response = requests.get(google_url, params={"id_token": google_token})
        
        if response.status_code != 200:
            return Response({"error": "Invalid token"}, status=400)
        
        google_data = response.json()
        if google_data.get("aud") != "your_google_client_id":  # Replace with your Google Client ID
            return Response({"error": "Invalid token audience"}, status=400)
        
        email = google_data.get("email")
        google_id = google_data.get("sub")
        first_name = google_data.get("given_name", "")
        last_name = google_data.get("family_name", "")

        user, created = User.objects.get_or_create(email=email, defaults={
            "username": email.split("@")[0],
            "first_name": first_name,
            "last_name": last_name,
            "google_id": google_id,
            "user_type": "normal"
        })

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,  # Include user data in the response
        })