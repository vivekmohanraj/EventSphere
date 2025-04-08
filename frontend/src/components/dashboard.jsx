import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaCalendar, FaMapMarkerAlt, FaEye, FaCreditCard } from 'react-icons/fa';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import styles from '../styles/Dashboard.module.css';

const Dashboard = () => {
  const [draftEvents, setDraftEvents] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  const fetchDraftEvents = async () => {
    try {
      const response = await api.get('/events/events/?status=draft');
      if (response.data) {
        setDraftEvents(response.data);
      }
    } catch (error) {
      console.error("Error fetching draft events:", error);
    }
  };
  
  const fetchPendingPayments = async () => {
    try {
      const response = await api.get('/payments/payments/?payment_status=pending');
      if (response.data) {
        setPendingPayments(response.data);
      }
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    }
  };
  
  useEffect(() => {
    fetchDraftEvents();
    fetchPendingPayments();
  }, []);
  
  const handleCompletePayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };
  
  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      
      script.onload = () => {
        resolve(true);
      };
      
      script.onerror = () => {
        resolve(false);
        toast.error("Razorpay SDK failed to load");
      };
      
      document.body.appendChild(script);
    });
  };
  
  const openRazorpayCheckout = async () => {
    if (!selectedPayment) return;
    
    const res = await initializeRazorpay();
    
    if (!res) {
      toast.error("Razorpay SDK failed to load");
      return;
    }
    
    const options = {
      key: selectedPayment.payment_details.key_id,
      amount: selectedPayment.amount * 100, // Amount in paise
      currency: selectedPayment.payment_details.currency || "INR",
      name: "EventSphere",
      description: `Payment for event: ${selectedPayment.event_name}`,
      order_id: selectedPayment.razorpay_order_id,
      handler: function (response) {
        handlePaymentSuccess(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );
      },
      prefill: {
        name: user.name || `${user.first_name} ${user.last_name}`,
        email: user.email,
        contact: user.phone || ""
      },
      theme: {
        color: "#6c5ce7"
      },
      modal: {
        ondismiss: function() {
          // Delete the temporary event when Razorpay modal is closed
          try {
            const tempEventId = selectedPayment?.event;
            if (tempEventId) {
              // Delete the temporary event if it's still in draft status
              api.delete(`/api/events/${tempEventId}/`)
                .then(() => {
                  console.log("Temporary event deleted on payment modal close");
                  // Remove the deleted event from draftEvents array
                  setDraftEvents(prev => prev.filter(event => event.id !== tempEventId));
                  // Also remove from pendingPayments
                  setPendingPayments(prev => prev.filter(payment => payment.event !== tempEventId));
                })
                .catch(deleteError => console.error("Failed to delete temp event:", deleteError));
            }
          } catch (cleanupError) {
            console.error("Error cleaning up after payment modal dismissed:", cleanupError);
          }
          
          toast.warning("Payment canceled. The draft event has been removed.");
          setShowPaymentModal(false);
        }
      }
    };
    
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };
  
  const handlePaymentSuccess = async (paymentId, orderId, signature) => {
    try {
      // Verify payment with backend
      await api.post(`/payments/verify/`, {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        payment_id: selectedPayment.id
      });
      
      toast.success("Payment successful! Event published.");
      setShowPaymentModal(false);
      
      // Refresh events
      fetchDraftEvents();
      fetchPendingPayments();
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Payment verification failed. Please contact support.");
    }
  };
  
  return (
    <div className={styles.dashboardPage}>
      {draftEvents.length > 0 && (
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            <FaEdit className={styles.sectionIcon} />
            Draft Events
          </h2>
          <div className={styles.eventsGrid}>
            {draftEvents.map((event) => (
              <div key={event.id} className={`${styles.eventCard} ${styles.draftEvent}`}>
                <div className={styles.eventImage}>
                  <img
                    src={event.photos[0]?.photo_url || "/default-event.jpg"}
                    alt={event.event_name}
                  />
                  <div className={styles.eventStatus}>
                    <span className={styles.draftBadge}>Draft</span>
                  </div>
                </div>
                <div className={styles.eventContent}>
                  <h3>{event.event_name}</h3>
                  <div className={styles.eventDetails}>
                    <p>
                      <FaCalendar className={styles.icon} />
                      {new Date(event.event_time).toLocaleDateString()}
                    </p>
                    <p>
                      <FaMapMarkerAlt className={styles.icon} />
                      {event.venue || "TBD"}
                    </p>
                  </div>
                  <div className={styles.eventActions}>
                    <Link to={`/events/${event.id}`} className={styles.viewButton}>
                      <FaEye /> View
                    </Link>
                    
                    {pendingPayments.find(p => p.event === event.id) && (
                      <button 
                        className={styles.paymentButton}
                        onClick={() => handleCompletePayment(
                          pendingPayments.find(p => p.event === event.id)
                        )}
                      >
                        <FaCreditCard /> Complete Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Modal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        centered
        className={styles.paymentModal}
      >
        <Modal.Header closeButton>
          <Modal.Title>Complete Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayment && (
            <div className={styles.paymentDetails}>
              <h4>Event Payment</h4>
              <p>To publish your event, please complete the payment:</p>
              
              <div className={styles.paymentSummary}>
                <div className={styles.paymentItem}>
                  <span>Event Name:</span>
                  <span>{selectedPayment.event_name}</span>
                </div>
                <div className={styles.paymentItem}>
                  <span>Amount:</span>
                  <span>₹{selectedPayment.amount}</span>
                </div>
              </div>
              
              <div className={styles.paymentActions}>
                <button 
                  className={styles.payNowButton}
                  onClick={openRazorpayCheckout}
                >
                  Pay Now
                </button>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Dashboard; 