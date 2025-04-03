import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaEye, FaUserCog, FaUser, FaEnvelope, FaPhone, FaIdCard, FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import api, { getMediaUrl } from "../../utils/api";
import styles from "../../assets/css/adminDashboard.module.css";

const CoordinatorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/coordinator-requests/');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching coordinator requests:', error);
      toast.error('Failed to load coordinator requests');
    } finally {
      setLoading(false);
    }
  };

  // Function to send an email notification
  const sendApprovalEmail = async (user) => {
    try {
      setSendingEmail(true);
      const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Create a professional HTML email template
      const emailTemplate = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Coordinator Request Approved</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
              
              body {
                font-family: 'Roboto', Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              
              .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
              }
              
              .email-header {
                background-color: #ff4a17;
                padding: 30px;
                text-align: center;
              }
              
              .email-header h1 {
                color: white;
                margin: 0;
                font-size: 24px;
                font-weight: 700;
              }
              
              .email-body {
                padding: 30px;
              }
              
              .greeting {
                font-size: 18px;
                font-weight: 500;
                margin-bottom: 20px;
              }
              
              .message {
                font-size: 16px;
                margin-bottom: 30px;
              }
              
              .details-box {
                background-color: #f9f9f9;
                border-left: 4px solid #ff4a17;
                padding: 20px;
                margin-bottom: 30px;
                border-radius: 4px;
              }
              
              .details-title {
                font-weight: 700;
                font-size: 16px;
                color: #555555;
                margin-bottom: 10px;
              }
              
              .details-item {
                font-size: 15px;
                margin-bottom: 8px;
              }
              
              .details-label {
                font-weight: 500;
                color: #666666;
              }
              
              .cta-button {
                display: block;
                text-align: center;
                background-color: #ff4a17;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 4px;
                font-weight: 500;
                margin: 30px auto;
                width: 200px;
              }
              
              .email-footer {
                padding: 20px 30px;
                text-align: center;
                color: #666666;
                font-size: 14px;
                background-color: #f9f9f9;
                border-top: 1px solid #eeeeee;
              }
              
              .company-name {
                font-weight: 700;
                color: #ff4a17;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="email-header">
                <h1>Congratulations!</h1>
              </div>
              
              <div class="email-body">
                <div class="greeting">Hello ${user.first_name},</div>
                
                <div class="message">
                  We're pleased to inform you that your request to become an Event Coordinator at EventSphere has been approved. You now have access to create and manage events on our platform.
                </div>
                
                <div class="details-box">
                  <div class="details-title">Account Details:</div>
                  <div class="details-item">
                    <span class="details-label">Name:</span> ${user.first_name} ${user.last_name}
                  </div>
                  <div class="details-item">
                    <span class="details-label">Email:</span> ${user.email}
                  </div>
                  <div class="details-item">
                    <span class="details-label">Username:</span> ${user.username}
                  </div>
                  <div class="details-item">
                    <span class="details-label">New Role:</span> Event Coordinator
                  </div>
                  <div class="details-item">
                    <span class="details-label">Approval Date:</span> ${currentDate}
                  </div>
                </div>
                
                <div class="message">
                  You can now access the coordinator dashboard to start creating and managing events. We look forward to seeing the amazing events you'll bring to our community!
                </div>
                
                <a href="https://eventsphere.com/coordinator-dashboard" class="cta-button">Go to Dashboard</a>
              </div>
              
              <div class="email-footer">
                <p>Thank you for being a part of <span class="company-name">EventSphere</span>.</p>
                <p>If you have any questions, please contact our support team at support@eventsphere.com</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      // Send email via backend API
      const response = await api.post('/users/send-email/', {
        recipient_email: user.email,
        subject: 'EventSphere: Your Coordinator Request Has Been Approved!',
        html_content: emailTemplate
      });
      
      if (response.status === 200) {
        toast.success('Approval email sent successfully');
      }
    } catch (error) {
      console.error('Error sending approval email:', error);
      toast.warn('Request approved, but notification email could not be sent');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleRequest = async (userId, action) => {
    try {
      const user = requests.find(req => req.id === userId);
      const response = await api.post(`/users/coordinator-requests/${userId}/`, { action });
      
      toast.success(response.data.message);
      
      // Update the local state to remove the processed request
      setRequests(requests.filter(req => req.id !== userId));
      
      // Send email notification if the request is approved
      if (action === 'approve' && user) {
        await sendApprovalEmail(user);
      }
      
      if (isModalOpen) {
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      toast.error(`Failed to ${action} request`);
    }
  };

  const openRequestDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className={styles.loader}>Loading coordinator requests...</div>;
  }

  return (
    <div className={styles.coordinatorRequestsContainer}>
      <h2>Coordinator Requests</h2>
      
      {requests.length === 0 ? (
        <div className={styles.noRequests}>
          <FaUserCog size={50} />
          <p>No pending coordinator requests</p>
        </div>
      ) : (
        <div className={styles.requestsList}>
          {requests.map(user => (
            <div key={user.id} className={styles.requestCard}>
              <div className={styles.userInfo}>
                {user.profile_photo ? (
                  <img 
                    src={getMediaUrl(user.profile_photo)} 
                    alt={`${user.username}'s avatar`} 
                    className={styles.userAvatar}
                  />
                ) : (
                  <div className={styles.userInitials}>
                    {user.first_name?.charAt(0) || ''}
                    {user.last_name?.charAt(0) || ''}
                  </div>
                )}
                <div>
                  <h3>{user.first_name} {user.last_name}</h3>
                  <p><FaEnvelope /> {user.email}</p>
                  <p><FaIdCard /> {user.username}</p>
                </div>
              </div>
              
              <div className={styles.actions}>
                <button 
                  className={`${styles.actionButton} ${styles.viewButton}`}
                  onClick={() => openRequestDetails(user)}
                >
                  <FaEye /> View Details
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.approveButton}`}
                  onClick={() => handleRequest(user.id, 'approve')}
                  disabled={sendingEmail}
                >
                  <FaCheck /> {sendingEmail ? 'Processing...' : 'Approve'}
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.rejectButton}`}
                  onClick={() => handleRequest(user.id, 'reject')}
                  disabled={sendingEmail}
                >
                  <FaTimes /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && selectedRequest && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Coordinator Request Details</h3>
            <div className={styles.requestDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}><FaUser /> Full Name</span>
                <span className={styles.detailValue}>
                  {`${selectedRequest.first_name} ${selectedRequest.last_name}`}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}><FaEnvelope /> Email Address</span>
                <span className={styles.detailValue}>{selectedRequest.email}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}><FaPhone /> Phone Number</span>
                <span className={styles.detailValue}>{selectedRequest.phone || 'Not provided'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}><FaIdCard /> Username</span>
                <span className={styles.detailValue}>{selectedRequest.username}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}><FaCalendarAlt /> Request Date</span>
                <span className={styles.detailValue}>
                  {new Date(selectedRequest.created_at || selectedRequest.date_joined).toLocaleString()}
                </span>
              </div>
              {selectedRequest.request_reason && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Request Reason</span>
                  <p className={styles.detailValue}>{selectedRequest.request_reason}</p>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
              <div className={styles.actionButtonsGroup}>
                <button 
                  className={`${styles.button} ${styles.dangerButton}`}
                  onClick={() => handleRequest(selectedRequest.id, 'reject')}
                  disabled={sendingEmail}
                >
                  <FaTimes /> Reject
                </button>
                <button 
                  className={`${styles.button} ${styles.successButton}`}
                  onClick={() => handleRequest(selectedRequest.id, 'approve')}
                  disabled={sendingEmail}
                >
                  <FaCheck /> {sendingEmail ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorRequests;
