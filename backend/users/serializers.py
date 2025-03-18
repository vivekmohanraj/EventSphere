from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User

class UserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'username', 'email', 
            'phone', 'password', 'confirm_password', 'profile_photo', 
            'google_id', 'user_role', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'confirm_password': {'write_only': True},
            'user_role': {'read_only': True},  # Only admins can change roles
        }
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data['password'] = make_password(validated_data['password'])
        # Set default role as 'user'
        validated_data['user_role'] = 'user'
        return super().create(validated_data)

# New serializer for user profile updates - doesn't require password fields
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'username', 'email', 
            'phone', 'profile_photo', 'user_role', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'username', 'email', 'user_role', 'created_at', 'updated_at']

class LoginSerializer(serializers.Serializer):
    login = serializers.EmailField()
    password = serializers.CharField(write_only=True)
