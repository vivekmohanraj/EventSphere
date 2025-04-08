from django.shortcuts import get_object_or_404
from events.models import Event, Venue
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.http import HttpResponse
from django.db import transaction
from rest_framework.permissions import IsAuthenticated

from .models import Payment
from .serializers import PaymentSerializer
from .services import RazorpayService

import logging
import json
from decimal import Decimal

logger = logging.getLogger(__name__)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    razorpay_service = RazorpayService()

    def get_queryset(self):
        """Filter payments based on user role"""
        user = self.request.user
        if user.user_role == "admin":
            return Payment.objects.all()
        # Coordinators can only see their own payments
        return Payment.objects.filter(coordinator=user)

    def create(self, request, *args, **kwargs):
        """
        Create a payment for event creation if user is a coordinator.
        For admins, the payment is automatically marked as completed.
        """
        # Extract data from request
        event_id = request.data.get("event")
        venue_id = request.data.get("venue")
        booking_hours = int(request.data.get("booking_hours", 3))
        amount = request.data.get("amount")
        
        logger.info(f"Payment creation request - Amount: {amount}, Event: {event_id}, Venue: {venue_id}, Hours: {booking_hours}")
        
        # Validate input data
        if not event_id:
            return Response(
                {"error": "Event ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get related objects
            event = Event.objects.get(pk=event_id)
            venue = None
            if venue_id:
                venue = Venue.objects.get(pk=venue_id)
                
            # Calculate amount based on venue and booking hours
            calculated_amount = Decimal('0.00')
            if venue:
                calculated_amount = self.razorpay_service.calculate_venue_price(venue, booking_hours)
                
            logger.info(f"Amount comparison - Requested: {amount}, Calculated: {calculated_amount}")
            
            # Use the amount from the request if provided, otherwise use calculated amount
            final_amount = Decimal(str(amount)) if amount else calculated_amount
            
            logger.info(f"Final amount for payment: {final_amount}")
            
            # Check if user is admin or coordinator
            if request.user.user_role == 'admin':
                # Admins don't need to pay
                payment = Payment.objects.create(
                    event=event,
                    coordinator=request.user,
                    venue=venue,
                    amount=final_amount,
                    payment_status='completed',
                    payment_type='event_creation',
                    booking_hours=booking_hours,
                    transaction_id=f"ADMIN_FREE_{event.id}"
                )
                serializer = self.get_serializer(payment)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            # For coordinators, create Razorpay order
            # Create a pending payment first
            payment = Payment.objects.create(
                event=event,
                coordinator=request.user,
                venue=venue,
                amount=final_amount,
                payment_status='pending',
                payment_type='event_creation',
                booking_hours=booking_hours
            )
            
            # Create Razorpay order
            notes = {
                'event_id': str(event.id),
                'payment_id': str(payment.id),
                'coordinator_id': str(request.user.id),
                'venue_id': str(venue.id) if venue else '',
                'payment_type': 'event_creation'
            }
            
            order = self.razorpay_service.create_order(
                amount=final_amount,
                receipt=f"payment_{payment.id}",
                notes=notes
            )
            
            if not order:
                payment.payment_status = 'failed'
                payment.save()
                return Response(
                    {"error": "Failed to create payment order"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Update payment with order details
            payment.razorpay_order_id = order['id']
            payment.payment_details = {
                'key_id': settings.RAZORPAY_KEY_ID,
                'currency': settings.RAZORPAY_CURRENCY,
                'order': order
            }
            payment.save()
            
            # Return payment details including Razorpay order info
            serializer = self.get_serializer(payment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Event.DoesNotExist:
            return Response(
                {"error": "Event not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Venue.DoesNotExist:
            return Response(
                {"error": "Venue not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error creating payment: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=["post"])
    def verify_payment(self, request, pk=None):
        """
        Verify a Razorpay payment and update payment status
        """
        payment = self.get_object()
        
        # Extract payment verification data
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id') 
        razorpay_signature = request.data.get('razorpay_signature')
        
        if not razorpay_payment_id or not razorpay_order_id or not razorpay_signature:
            return Response(
                {"error": "Missing payment verification details"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify payment signature
        is_valid = self.razorpay_service.verify_payment_signature(
            payment_id=razorpay_payment_id,
            order_id=razorpay_order_id,
            signature=razorpay_signature
        )
        
        if not is_valid:
            payment.payment_status = 'failed'
            payment.save()
            return Response(
                {"error": "Payment verification failed"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Update payment with verification details
                payment.razorpay_payment_id = razorpay_payment_id
                payment.razorpay_signature = razorpay_signature
                payment.payment_status = 'completed'
                payment.transaction_id = razorpay_payment_id
                payment.save()
                
                # Get payment details from Razorpay
                payment_details = self.razorpay_service.get_payment_details(razorpay_payment_id)
                if payment_details:
                    # Update payment details
                    payment.payment_details.update({'payment': payment_details})
                    payment.save(update_fields=['payment_details'])
                
                # Update event status as appropriate
                event = payment.event
                if event.status == 'draft':
                    event.status = 'upcoming'
                    event.save()
                
                return Response({
                    "success": True,
                    "message": "Payment verified successfully",
                    "payment": self.get_serializer(payment).data
                })
                
        except Exception as e:
            logger.error(f"Error verifying payment: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=["post"])
    def razorpay_webhook(self, request):
        """
        Handle Razorpay webhook events
        """
        try:
            webhook_data = json.loads(request.body)
            event = webhook_data.get('event')
            
            if not event:
                return HttpResponse(status=400)
                
            logger.info(f"Received Razorpay webhook: {event}")
            
            # Handle payment authorized event
            if event == 'payment.authorized':
                payment_id = webhook_data.get('payload', {}).get('payment', {}).get('entity', {}).get('order_id')
                if payment_id:
                    try:
                        payment = Payment.objects.get(razorpay_order_id=payment_id)
                        payment.payment_status = 'completed'
                        payment.payment_details.update({'webhook_data': webhook_data})
                        payment.save()
                        
                        # Update event status if needed
                        event = payment.event
                        if event.status == 'draft':
                            event.status = 'upcoming'
                            event.save()
                            
                    except Payment.DoesNotExist:
                        logger.error(f"Payment not found for order: {payment_id}")
            
            # Handle payment failed event
            elif event == 'payment.failed':
                payment_id = webhook_data.get('payload', {}).get('payment', {}).get('entity', {}).get('order_id')
                if payment_id:
                    try:
                        payment = Payment.objects.get(razorpay_order_id=payment_id)
                        payment.payment_status = 'failed'
                        payment.payment_details.update({'webhook_data': webhook_data})
                        payment.save()
                    except Payment.DoesNotExist:
                        logger.error(f"Payment not found for order: {payment_id}")
            
            return HttpResponse(status=200)
            
        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            return HttpResponse(status=500)

    @action(detail=False, methods=["get"])
    def payment_config(self, request):
        """
        Get Razorpay configuration for the frontend
        """
        return Response({
            'key_id': settings.RAZORPAY_KEY_ID,
            'currency': settings.RAZORPAY_CURRENCY,
            'payment_required': settings.COORDINATOR_EVENT_PAYMENT_REQUIRED
        })
