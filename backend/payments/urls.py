from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    
    # Add specific payment endpoints
    path('payments/verify/', PaymentViewSet.as_view({'post': 'verify_payment'}), name='verify-payment'),
    path('payments/config/', PaymentViewSet.as_view({'get': 'payment_config'}), name='payment-config'),
    path('webhook/razorpay/', PaymentViewSet.as_view({'post': 'razorpay_webhook'}), name='razorpay-webhook'),
]