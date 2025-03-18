import logging

import requests
from django.conf import settings

# Create your views here.
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Q
from rest_framework.decorators import action
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import LoginSerializer, UserSerializer, UserProfileSerializer

# Get an instance of a logger
logger = logging.getLogger(__name__)

# Combined user profile view for GET, PATCH, and PUT methods
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        """Get current user's profile data"""
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
        
    def patch(self, request):
        """Update current user's profile data with PATCH"""
        return self._update_profile(request)
        
    def put(self, request):
        """Update current user's profile data with PUT"""
        return self._update_profile(request)
    
    def _update_profile(self, request):
        """Common method for profile update logic"""
        user = request.user
        
        # Handle both form data and JSON
        data = request.data.copy()
        
        # For multipart form data with file upload
        if request.FILES.get('profile_photo'):
            data['profile_photo'] = request.FILES['profile_photo']
        # For compatibility with frontend using different field names
        elif request.FILES.get('profilePhoto'):
            data['profile_photo'] = request.FILES['profilePhoto']
        elif request.FILES.get('avatar'):
            data['profile_photo'] = request.FILES['avatar']
        elif request.FILES.get('photo'):
            data['profile_photo'] = request.FILES['photo']
            
        # Map camelCase field names to snake_case if present
        if 'firstName' in data and 'first_name' not in data:
            data['first_name'] = data['firstName']
        if 'lastName' in data and 'last_name' not in data:
            data['last_name'] = data['lastName']
        if 'phoneNumber' in data and 'phone' not in data:
            data['phone'] = data['phoneNumber']
            
        serializer = UserProfileSerializer(user, data=data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# New view for changing password
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        """Change user password"""
        user = request.user
        data = request.data
        
        # Try multiple field name formats for current password
        current_password = (
            data.get("current_password") or 
            data.get("old_password") or 
            data.get("currentPassword") or
            data.get("oldPassword")
        )
        
        # Try multiple field name formats for new password
        new_password = (
            data.get("new_password") or 
            data.get("password") or 
            data.get("newPassword") or
            data.get("password1")
        )
        
        # Check required fields
        if not current_password or not new_password:
            return Response(
                {"error": "Current password and new password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify current password
        if not check_password(current_password, user.password):
            return Response(
                {"error": "Current password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password
        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update password
        user.password = make_password(new_password)
        user.save()
        
        return Response({"message": "Password updated successfully"})
        
    def put(self, request):
        """Support for PUT method for password changes"""
        return self.post(request)

class UserStatsView(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        """Filter users based on user role"""
        queryset = User.objects.all()  # Add ordering
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def update_role(self, request, pk=None):
        try:
            user = self.get_object()
            user.role = request.data.get("role")
            user.save()
            return Response({"message": "Role updated successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    def retrieve(self, request, pk=None):
        """Get detailed information for a single user"""
        try:
            user = self.get_object()
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    def list(self, request):
        """List all users with detailed information"""
        queryset = self.get_queryset()
        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()
        if data.get("password") != data.get("confirm_password"):
            return Response(
                {"error": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully"},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        login = request.data.get("login")
        password = request.data.get("password")

        if not login or not password:
            logger.warning("Login attempt with missing credentials")
            return Response(
                {"error": "Email/Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(Q(email=login) | Q(username__iexact=login))
            logger.debug(f"User lookup successful: {login}")
        except User.DoesNotExist:
            logger.error(f"User not found: {login}")
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )

        if not check_password(password, user.password):
            logger.error(f"Incorrect password for user: {login}")
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        logger.info(f"Login successful for user: {login}")

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "username": str(user.username),
                "role": str(user.user_role),
            }
        )


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("login")  # Use "login" field as per your serializer
        user = User.objects.filter(email=email).first()

        if not user:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Generate a secure reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Generate the reset URL
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

        # Send the reset password email
        subject = "Password Reset Request"
        message = f"Click the link below to reset your password:\n\n{reset_url}\n\nIf you did not request this, please ignore this email."
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]

        try:
            send_mail(subject, message, from_email, recipient_list, fail_silently=False)
            return Response(
                {"message": "Password reset link sent to your email"},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return Response(
                {"error": "Failed to send email"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uidb64 or not token or not new_password:
            return Response(
                {"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Decode the uidb64 to get the user's primary key
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        # Validate the token
        if user and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response(
                {"message": "Password reset successful"}, status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        google_token = request.data.get("token")
        selected_role = request.data.get(
            "role"
        )  # Get the selected role from the frontend

        # Validate the selected role
        valid_roles = [
            role[0] for role in User.USER_ROLE_CHOICES
        ]  # Fetch valid roles from the User model
        if selected_role not in valid_roles:
            return Response(
                {"error": "Invalid role", "role": selected_role}, status=400
            )

        # Verify the Google token
        google_url = "https://oauth2.googleapis.com/tokeninfo"
        response = requests.get(google_url, params={"id_token": google_token})

        if response.status_code != 200:
            return Response({"error": "Invalid Google token"}, status=400)

        google_data = response.json()
        email = google_data.get("email")
        google_id = google_data.get("sub")
        first_name = google_data.get("given_name", "")
        last_name = google_data.get("family_name", "")

        # First check if user exists with email
        existing_user = User.objects.filter(
            Q(email=email) | Q(username=email.split("@")[0])
        ).first()
        if existing_user:
            # Use existing user's role
            user = existing_user
        else:
            # Create new user with selected role
            user = User.objects.create(
                email=email,
                username=email.split("@")[0],
                first_name=first_name,
                last_name=last_name,
                google_id=google_id,
                user_role=selected_role,
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "username": str(user.username),
                "role": str(user.user_role),
            }
        )


class CheckUsernameView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        if User.objects.filter(username__iexact=username).exists():
            return Response({"available": False}, status=status.HTTP_200_OK)
        return Response({"available": True}, status=status.HTTP_200_OK)


class CheckEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if User.objects.filter(email__iexact=email).exists():
            return Response({"available": False}, status=status.HTTP_200_OK)
        return Response({"available": True}, status=status.HTTP_200_OK)
