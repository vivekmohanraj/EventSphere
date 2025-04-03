import logging

import requests
from django.conf import settings

# Create your views here.
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail, EmailMessage
from django.db.models import Q, Count, Sum
from django.db.models.functions import TruncMonth
from rest_framework.decorators import action
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, status, viewsets, permissions
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import LoginSerializer, UserSerializer, UserProfileSerializer
from events.models import Event
from payments.models import Payment
from datetime import datetime, timedelta

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

class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get(self, request):
        # Get basic counts
        total_users = User.objects.count()
        total_events = Event.objects.count()
        active_events = Event.objects.filter(status='upcoming').count()
        pending_requests = User.objects.filter(coordinator_request=True).count()
        
        # Get total revenue
        total_revenue = Payment.objects.filter(payment_status='completed').aggregate(Sum('amount'))
        total_revenue = total_revenue['amount__sum'] or 0
        
        # Get monthly revenue data
        current_year = datetime.now().year
        monthly_revenue = Payment.objects.filter(
            payment_status='completed',
            created_at__year=current_year
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            revenue=Sum('amount')
        ).order_by('month')
        
        # Process monthly data into format dashboard expects
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        revenue_data = [0] * 12
        
        for item in monthly_revenue:
            if item['month']:
                month_index = item['month'].month - 1  # 0-based index
                revenue_data[month_index] = int(item['revenue'] or 0)
        
        # Get monthly events data
        monthly_events = Event.objects.filter(
            created_at__year=current_year
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        events_data = [0] * 12
        for item in monthly_events:
            if item['month']:
                month_index = item['month'].month - 1  # 0-based index
                events_data[month_index] = item['count']
        
        # Get monthly user signups
        monthly_users = User.objects.filter(
            created_at__year=current_year
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        users_data = [0] * 12
        for item in monthly_users:
            if item['month']:
                month_index = item['month'].month - 1  # 0-based index
                users_data[month_index] = item['count']
        
        # Calculate growth rates
        # Current month vs. previous month
        now = datetime.now()
        current_month_start = datetime(now.year, now.month, 1)
        prev_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        
        current_month_users = User.objects.filter(created_at__gte=current_month_start).count()
        prev_month_users = User.objects.filter(
            created_at__gte=prev_month_start,
            created_at__lt=current_month_start
        ).count()
        
        current_month_events = Event.objects.filter(created_at__gte=current_month_start).count()
        prev_month_events = Event.objects.filter(
            created_at__gte=prev_month_start,
            created_at__lt=current_month_start
        ).count()
        
        current_month_revenue = Payment.objects.filter(
            created_at__gte=current_month_start,
            payment_status='completed'
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        prev_month_revenue = Payment.objects.filter(
            created_at__gte=prev_month_start,
            created_at__lt=current_month_start,
            payment_status='completed'
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Calculate growth percentages with safe division
        user_growth = calculate_growth(prev_month_users, current_month_users)
        event_growth = calculate_growth(prev_month_events, current_month_events)
        revenue_growth = calculate_growth(prev_month_revenue, current_month_revenue)
        
        # Get event types distribution
        event_types = Event.objects.values('event_type').annotate(
            count=Count('id')
        ).order_by('-count')[:5]  # Top 5 event types
        
        # Get popular venues
        popular_venues = []
        try:
            # First try to get from Venue model if it exists
            from events.models import Venue
            venue_events = Event.objects.filter(venue__isnull=False).values('venue').annotate(
                count=Count('id')
            ).order_by('-count')[:6]
            
            popular_venues = list(venue_events)
            
            # Add venue model details if available
            for venue_data in popular_venues:
                if venue_data.get('venue'):
                    try:
                        venue_obj = Venue.objects.filter(name=venue_data['venue']).first()
                        if venue_obj:
                            venue_data['name'] = venue_obj.name
                            venue_data['address'] = venue_obj.address
                    except:
                        # If can't get detailed venue info, just use the name
                        venue_data['name'] = venue_data['venue']
        except ImportError:
            # If Venue model not available, just count by venue string
            venue_events = Event.objects.exclude(venue__isnull=True).exclude(venue='').values('venue').annotate(
                count=Count('id')
            ).order_by('-count')[:6]
            
            popular_venues = [
                {'name': item['venue'], 'venue': item['venue'], 'count': item['count']}
                for item in venue_events
            ]
            
        # If still no data, provide sample data matching event creation page
        if not popular_venues:
            # Sample venues that match the ones in event creation
            sample_venues = [
                {'name': 'Corporate Executive Center', 'count': 5},
                {'name': 'Workshop Studio', 'count': 4},
                {'name': 'Grand Ballroom', 'count': 4},
                {'name': 'Rooftop Concert Space', 'count': 3},
                {'name': 'Kids Party Palace', 'count': 2},
                {'name': 'Garden Terrace', 'count': 2}
            ]
            
            # Only use sample data if we have events
            if total_events > 0:
                popular_venues = sample_venues
        
        return Response({
            'total_users': total_users,
            'total_events': total_events,
            'total_revenue': total_revenue,
            'active_events': active_events,
            'pending_requests': pending_requests,
            'monthly_revenue': revenue_data,
            'monthly_events': events_data,
            'monthly_users': users_data,
            'growth_rates': {
                'users': user_growth,
                'events': event_growth,
                'revenue': revenue_growth,
                'active': 0  # Need a way to calculate this
            },
            'event_types': [
                {'type': item['event_type'] or 'Undefined', 'count': item['count']}
                for item in event_types
            ],
            'popular_venues': popular_venues
        })

def calculate_growth(previous, current):
    """Calculate growth percentage safely"""
    if previous == 0:
        return 100 if current > 0 else 0
    return round(((current - previous) / previous) * 100)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # Temporarily remove permission restrictions for testing
    permission_classes = [permissions.AllowAny]  # <-- Change this temporarily
    
    def get_queryset(self):
        # Make sure this returns all users
        print("UserViewSet.get_queryset called")  # Add this for debugging
        return User.objects.all()

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
                
        # Explicitly set user to active
        data["is_active"] = True
        
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            # Double-check to ensure user is active
            if not user.is_active:
                user.is_active = True
                user.save()
                
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
                is_active=True  # Explicitly set user as active
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


class CoordinatorRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        user.coordinator_request = True
        user.save()
        return Response({"message": "Coordinator request submitted successfully"}, status=status.HTTP_200_OK)


class CoordinatorRequestsListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Only allow admins to view the requests
        if request.user.user_role != 'admin':
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all users with pending coordinator requests
        pending_requests = User.objects.filter(coordinator_request=True)
        serializer = UserSerializer(pending_requests, many=True)
        return Response(serializer.data)
    
    def post(self, request, user_id):
        """Approve or reject a coordinator request"""
        try:
            user = User.objects.get(id=user_id)
            
            # Only allow admins to update requests
            if request.user.user_role != 'admin':
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
            action = request.data.get('action')
            
            if action == 'approve':
                user.user_role = 'coordinator'
                user.coordinator_request = False
                user.save()
                return Response({"message": f"User {user.username} is now a coordinator"})
            elif action == 'reject':
                user.coordinator_request = False
                user.save()
                return Response({"message": f"Coordinator request for {user.username} was rejected"})
            else:
                return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class SendEmailView(APIView):
    """
    View to send emails with HTML content.
    Only admins can use this endpoint.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Ensure only admins can send emails
        if request.user.user_role != 'admin':
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        recipient_email = request.data.get('recipient_email')
        subject = request.data.get('subject')
        html_content = request.data.get('html_content')
        
        if not recipient_email or not subject or not html_content:
            return Response({
                "error": "Missing required fields: recipient_email, subject, and html_content are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create an EmailMessage object
            email = EmailMessage(
                subject=subject,
                body=html_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email],
            )
            email.content_subtype = "html"  # Set content type to HTML
            
            # Send the email
            email.send(fail_silently=False)
            
            return Response({
                "success": True,
                "message": f"Email sent successfully to {recipient_email}"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CheckAuthView(APIView):
    """
    Simple endpoint to verify that a user's authentication is valid.
    Returns basic user info if token is valid.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get(self, request):
        # If we reached this point, authentication was successful
        user = request.user
        return Response({
            "authenticated": True,
            "user_id": user.id,
            "username": user.username,
            "role": user.user_role,
            "email": user.email,
        })
