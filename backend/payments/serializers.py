from rest_framework import serializers
from .models import Payment
from events.models import Venue
from events.serializers import VenueSerializer

class PaymentSerializer(serializers.ModelSerializer):
    venue_details = VenueSerializer(source='venue', read_only=True)
    event_name = serializers.SerializerMethodField()
    coordinator_name = serializers.SerializerMethodField()
    razorpay_order_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'event', 'event_name', 'coordinator', 'coordinator_name',
            'venue', 'venue_details', 'amount', 'payment_method', 'payment_status',
            'payment_type', 'transaction_id', 'created_at', 'updated_at',
            'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
            'payment_details', 'booking_hours', 'razorpay_order_details'
        ]
        read_only_fields = [
            'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
            'transaction_id', 'payment_details', 'razorpay_order_details',
            'coordinator_name', 'event_name', 'venue_details'
        ]
    
    def get_event_name(self, obj):
        return obj.event.event_name if obj.event else None
    
    def get_coordinator_name(self, obj):
        if obj.coordinator:
            return f"{obj.coordinator.first_name} {obj.coordinator.last_name}"
        return None
    
    def get_razorpay_order_details(self, obj):
        """Return payment details in format needed by frontend"""
        if not obj.razorpay_order_id:
            return None
            
        return {
            'key': getattr(obj.payment_details, 'key_id', None),
            'amount': obj.amount,
            'currency': getattr(obj.payment_details, 'currency', 'INR'),
            'name': 'EventSphere',
            'description': f'Payment for event: {obj.event.event_name}',
            'order_id': obj.razorpay_order_id,
            'prefill': {
                'name': f"{obj.coordinator.first_name} {obj.coordinator.last_name}",
                'email': obj.coordinator.email,
                'contact': obj.coordinator.phone or ''
            }
        }