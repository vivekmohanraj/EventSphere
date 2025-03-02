from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Payment
from .serializers import PaymentSerializer
from events.models import Event

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return Payment.objects.all()
        return Payment.objects.filter(coordinator=self.request.user)

    def perform_create(self, serializer):
        event = get_object_or_404(Event, id=self.request.data.get('event'))
        if event.created_by != self.request.user:
            raise serializers.ValidationError(
                {"error": "You can only make payments for events you created"}
            )
        serializer.save(coordinator=self.request.user)

    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        payment = self.get_object()
        
        # Here you would integrate with a payment gateway
        # This is a placeholder for the actual payment processing
        try:
            # Simulate payment processing
            payment.payment_status = 'completed'
            payment.transaction_id = f"TRANS_{payment.id}_{payment.created_at.timestamp()}"
            payment.save()
            
            return Response({
                "message": "Payment processed successfully",
                "transaction_id": payment.transaction_id
            })
        except Exception as e:
            payment.payment_status = 'failed'
            payment.save()
            return Response(
                {"error": "Payment processing failed"},
                status=status.HTTP_400_BAD_REQUEST
            )
