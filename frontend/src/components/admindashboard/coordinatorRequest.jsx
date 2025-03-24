import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaEye, FaUser } from "react-icons/fa";
import { toast } from "react-toastify";
import api, { tryMultipleEndpoints, directFetch } from "../../utils/api";
import { ACCESS_TOKEN } from "../../utils/constants";
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
      // Add more possible endpoints for coordinator requests
      const endpoints = [
        "coordinator-requests/",
        "users/coordinator-requests/",
        "api/coordinator-requests/",
        "admin/coordinator-requests/",
        "requests/coordinator/"
      ];
      
      let requestsData = [];
      let successfulFetch = false;
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          if (response.data && Array.isArray(response.data)) {
            requestsData = response.data;
            successfulFetch = true;
            break;
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint}`);
        }
      }
      
      // If we couldn't get data from specific endpoints, try to filter users
      if (!successfulFetch) {
        const usersResponse = await api.get("users/");
        if (usersResponse.data && Array.isArray(usersResponse.data)) {
          requestsData = usersResponse.data.filter(user => user.coordinator_request === true);
        }
      }
      
      // Add function to handle different data structures
      const normalizedRequests = requestsData.map(normalizeRequestData);
      
      setRequests(normalizedRequests);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching coordinator requests:", error);
      toast.error("Failed to load coordinator requests");
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userId) => {
    try {
      // First try to use coordinator-requests endpoint
      try {
        await api.post(`coordinator-requests/${requestId}/approve/`);
      } catch (error) {
        // If that fails, try updating the user directly
        await api.patch(`users/${userId}/`, {
          user_role: "coordinator",
          coordinator_request: false
        });
      }
      
      toast.success("Request approved successfully");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleReject = async (requestId, userId) => {
    try {
      // Try multiple possible endpoints and payloads
      const methods = [
        {
          endpoint: `coordinator-requests/${requestId}/reject/`,
          method: 'post',
          payload: {}
        },
        {
          endpoint: `users/${userId}/`,
          method: 'patch',
          payload: { coordinator_request: false }
        }
      ];
      
      let success = false;
      
      for (const { endpoint, method, payload } of methods) {
        try {
          if (method === 'post') {
            await api.post(endpoint, payload);
          } else if (method === 'patch') {
            await api.patch(endpoint, payload);
          } else if (method === 'put') {
            await api.put(endpoint, payload);
          }
          success = true;
          break;
        } catch (error) {
          console.warn(`Failed to use ${method} on ${endpoint}`);
        }
      }
      
      if (!success) {
        throw new Error("All rejection attempts failed");
      }
      
      toast.success("Request rejected");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  const openRequestDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // Add function to handle different data structures
  const normalizeRequestData = (request) => {
    // If this is a user object with coordinator_request flag
    if (request.coordinator_request === true) {
      return {
        id: request.id,
        user_id: request.id,
        first_name: request.first_name || '',
        last_name: request.last_name || '',
        email: request.email || '',
        phone: request.phone || request.phone_number || '',
        username: request.username || '',
        created_at: request.created_at || request.date_joined || new Date().toISOString(),
        status: 'pending',
        request_reason: request.request_reason || request.coordinator_request_reason || ''
      };
    }
    
    // If this is a CoordinatorRequest model object
    return {
      id: request.id,
      user_id: request.user?.id || request.user_id,
      first_name: request.user?.first_name || request.first_name || '',
      last_name: request.user?.last_name || request.last_name || '',
      email: request.user?.email || request.email || '',
      phone: request.user?.phone || request.phone || '',
      username: request.user?.username || request.username || '',
      created_at: request.requested_at || request.created_at || new Date().toISOString(),
      status: request.status || 'pending',
      request_reason: request.reason || request.request_reason || ''
    };
  };

  return (
    <div className={styles.contentContainer}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Coordinator Requests</h2>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyState}>
          <FaUser size={48} className={styles.emptyStateIcon} />
          <h3>No pending requests</h3>
          <p>There are currently no pending coordinator requests to review.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Requested On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{`${request.first_name} ${request.last_name}`}</td>
                  <td>{request.email}</td>
                  <td>{request.phone || 'N/A'}</td>
                  <td>{new Date(request.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button 
                        className={`${styles.actionButton} ${styles.viewButton}`}
                        onClick={() => openRequestDetails(request)}
                      >
                        <FaEye />
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.approveButton}`}
                        onClick={() => handleApprove(request.id, request.id)}
                      >
                        <FaCheck />
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.rejectButton}`}
                        onClick={() => handleReject(request.id, request.id)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && selectedRequest && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Coordinator Request Details</h3>
            <div className={styles.requestDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Name:</span>
                <span className={styles.detailValue}>
                  {`${selectedRequest.first_name} ${selectedRequest.last_name}`}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{selectedRequest.email}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Phone:</span>
                <span className={styles.detailValue}>{selectedRequest.phone || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Username:</span>
                <span className={styles.detailValue}>{selectedRequest.username}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Request Date:</span>
                <span className={styles.detailValue}>
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </span>
              </div>
              {selectedRequest.request_reason && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Request Reason:</span>
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
                  onClick={() => {
                    handleReject(selectedRequest.id, selectedRequest.id);
                    setIsModalOpen(false);
                  }}
                >
                  <FaTimes /> Reject
                </button>
                <button 
                  className={`${styles.button} ${styles.successButton}`}
                  onClick={() => {
                    handleApprove(selectedRequest.id, selectedRequest.id);
                    setIsModalOpen(false);
                  }}
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
