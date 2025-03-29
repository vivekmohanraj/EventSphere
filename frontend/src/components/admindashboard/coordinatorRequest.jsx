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

  const handleRequest = async (userId, action) => {
    try {
      const response = await api.post(`/users/coordinator-requests/${userId}/`, { action });
      
      toast.success(response.data.message);
      
      // Update the local state to remove the processed request
      setRequests(requests.filter(req => req.id !== userId));
      
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
                >
                  <FaCheck /> Approve
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.rejectButton}`}
                  onClick={() => handleRequest(user.id, 'reject')}
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
                >
                  <FaTimes /> Reject
                </button>
                <button 
                  className={`${styles.button} ${styles.successButton}`}
                  onClick={() => handleRequest(selectedRequest.id, 'approve')}
                >
                  <FaCheck /> Approve
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
