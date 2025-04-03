import razorpay
import json
import logging
from django.conf import settings
from decimal import Decimal

logger = logging.getLogger(__name__)

class RazorpayService:
    """Service to interact with Razorpay payment gateway"""
    
    def __init__(self):
        """Initialize Razorpay client with credentials from settings"""
        self.client = None
        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            self.client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
        else:
            logger.warning("Razorpay credentials not configured.")
    
    def create_order(self, amount, currency=None, receipt=None, notes=None):
        """
        Create a new payment order in Razorpay
        
        Args:
            amount: Amount in paise (1 INR = 100 paise)
            currency: Currency code (defaults to INR)
            receipt: Receipt ID (optional)
            notes: Additional notes for the order (optional)
            
        Returns:
            dict: Order details including order_id and payment info
        """
        if not self.client:
            logger.error("Razorpay client not initialized")
            return None
            
        try:
            # Convert Decimal to int if needed (Razorpay expects amount in paise)
            if isinstance(amount, Decimal):
                amount = int(amount * 100)  # Convert rupees to paise
            elif isinstance(amount, float):
                amount = int(amount * 100)
                
            # Ensure amount is at least 100 paise (1 INR) which is Razorpay's minimum
            amount = max(amount, 100)
            
            # Prepare order data
            data = {
                'amount': amount,
                'currency': currency or settings.RAZORPAY_CURRENCY,
                'receipt': receipt,
                'notes': notes or {}
            }
            
            # Create order
            order = self.client.order.create(data=data)
            logger.info(f"Created Razorpay order: {order['id']}")
            
            return order
            
        except Exception as e:
            logger.error(f"Error creating Razorpay order: {e}")
            return None
    
    def verify_payment_signature(self, payment_id, order_id, signature):
        """
        Verify the payment signature to confirm payment is authentic
        
        Args:
            payment_id: Razorpay payment ID
            order_id: Razorpay order ID
            signature: Signature from Razorpay callback
            
        Returns:
            bool: True if signature is valid, False otherwise
        """
        if not self.client:
            logger.error("Razorpay client not initialized")
            return False
            
        try:
            params_dict = {
                'razorpay_payment_id': payment_id,
                'razorpay_order_id': order_id,
                'razorpay_signature': signature
            }
            
            # Verify signature
            self.client.utility.verify_payment_signature(params_dict)
            logger.info(f"Verified payment signature for payment_id: {payment_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error verifying payment signature: {e}")
            return False
    
    def get_payment_details(self, payment_id):
        """
        Get details of a payment
        
        Args:
            payment_id: Razorpay payment ID
            
        Returns:
            dict: Payment details
        """
        if not self.client:
            logger.error("Razorpay client not initialized")
            return None
            
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception as e:
            logger.error(f"Error fetching payment details: {e}")
            return None
    
    def calculate_venue_price(self, venue, hours=3):
        """
        Calculate price for venue booking
        
        Args:
            venue: Venue object
            hours: Number of hours for booking (default 3)
            
        Returns:
            Decimal: Price in INR
        """
        if not venue or not venue.price_per_hour:
            return Decimal('0.00')
        
        base_price = venue.price_per_hour * hours
        
        # Add extra for large capacity venues
        if venue.capacity > 200:
            base_price += Decimal('500.00')
        
        return base_price 