from django.db import models
from django.db.models import Q
from django.contrib.auth.models import AbstractUser, Group, Permission

# Create your models here.
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, first_name, last_name, username, email, phone, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        if not username:
            raise ValueError("Username is required")
        
        email = self.normalize_email(email)
        user = self.model(
            first_name=first_name,
            last_name=last_name,
            username=username.lower(),
            email=email,
            phone=phone,
            **extra_fields
        )
        
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, first_name, last_name, username, email, phone, password=None):
        user = self.create_user(
            first_name=first_name,
            last_name=last_name,
            username=username,
            email=email,
            phone=phone,
            password=password,
            user_role='admin'
        )
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

class User(AbstractBaseUser, PermissionsMixin):
    USER_ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('normal', 'Normal'),
        ('coordinator', 'Coordinator')
    )

    id = models.BigAutoField(primary_key=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=10, unique=True)
    password = models.CharField(max_length=255, null=True, blank=True)
    profile_photo = models.CharField(max_length=255, null=True, blank=True)
    google_id = models.CharField(max_length=255, null=True, blank=True)
    user_role = models.CharField(max_length=15, choices=USER_ROLE_CHOICES, default='normal')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    objects = UserManager()
    groups = models.ManyToManyField(Group, related_name="custom_user_groups")
    user_permissions = models.ManyToManyField(Permission, related_name="custom_user_permissions")
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'username', 'phone']
    
    def __str__(self):
        return self.username