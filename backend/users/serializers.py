from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User

class UserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'username', 'email', 
            'phone', 'password', 'confirm_password', 'profile_photo', 
            'google_id', 'user_role', 'created_at', 'updated_at', 'is_active'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'user_role': {'required': False},  # Allow changing roles, but not required
        }
    
    def validate(self, data):
        # Only validate passwords if both are provided
        if 'password' in data and 'confirm_password' in data:
            if data['password'] != data['confirm_password']:
                raise serializers.ValidationError({"password": "Passwords do not match."})
        
        # Validate user_role if provided
        if 'user_role' in data:
            valid_roles = [role[0] for role in User.USER_ROLE_CHOICES]
            if data['user_role'] not in valid_roles:
                # Handle legacy field names (user_type instead of user_role)
                if data['user_role'] == 'normal':
                    data['user_role'] = 'user'  # Convert normal to user
                else:
                    raise serializers.ValidationError({"user_role": f"Invalid role. Valid choices are: {', '.join(valid_roles)}"})
        
        return data

    def create(self, validated_data):
        # Remove confirm_password if it exists
        if 'confirm_password' in validated_data:
            validated_data.pop('confirm_password')
            
        # Hash password if it exists
        if 'password' in validated_data and validated_data['password']:
            validated_data['password'] = make_password(validated_data['password'])
        
        # Set default role as 'user'
        validated_data['user_role'] = validated_data.get('user_role', 'user')
        
        # Explicitly ensure is_active is set to True
        validated_data['is_active'] = True
        
        return super().create(validated_data)
        
    def update(self, instance, validated_data):
        # Remove confirm_password if it exists
        if 'confirm_password' in validated_data:
            validated_data.pop('confirm_password')
            
        # Only update password if it's provided and not empty
        if 'password' in validated_data and validated_data['password']:
            validated_data['password'] = make_password(validated_data['password'])
        elif 'password' in validated_data:
            # Remove empty password to avoid overwriting with empty string
            validated_data.pop('password')
        
        # Handle user_type field as alias for user_role if present
        if 'user_type' in validated_data and 'user_role' not in validated_data:
            validated_data['user_role'] = validated_data.pop('user_type')
            
        return super().update(instance, validated_data)

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
