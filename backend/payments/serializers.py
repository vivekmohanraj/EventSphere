from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    event_name = serializers.CharField(source='event.event_name', read_only=True)
    coordinator_name = serializers.CharField(source='coordinator.username', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'event', 'event_name', 'coordinator', 'coordinator_name',
            'amount', 'payment_method', 'payment_status', 'transaction_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['payment_status', 'transaction_id', 'created_at', 'updated_at']