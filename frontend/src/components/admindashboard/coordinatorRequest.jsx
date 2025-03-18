import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaCheck, FaTimes, FaSearch, FaEye } from "react-icons/fa";
import api from "../../utils/api";
import styles from "../../assets/css/Dashboard.module.css";

const CoordinatorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewDetails, setViewDetails] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Try multiple endpoints that could exist
      try {
        const response = await api.get("coordinator-requests/");
        setRequests(response.data);
      } catch (firstError) {
        console.warn("Could not fetch from coordinator-requests/, trying users/coordinator-requests/");
        try {
          const fallbackResponse = await api.get("users/coordinator-requests/");
          setRequests(Array.isArray(fallbackResponse.data) ? fallbackResponse.data : []);
        } catch (secondError) {
          console.warn("Could not fetch from users/coordinator-requests/, trying requests/");
          const lastFallbackResponse = await api.get("requests/");
          setRequests(Array.isArray(lastFallbackResponse.data) ? lastFallbackResponse.data : []);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch coordinator requests");
      console.error("Error fetching coordinator requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && request.status === statusFilter;
  });

  const handleApproveRequest = async (requestId, approve) => {
    try {
      // Try multiple endpoints that could exist
      try {
        await api.patch(`coordinator-requests/${requestId}/approve/`, { approved: approve });
      } catch (firstError) {
        if (firstError.response && firstError.response.status === 404) {
          console.warn(`Could not patch coordinator-requests/${requestId}/approve/, trying users/coordinator-requests/${requestId}/`);
          await api.patch(`users/coordinator-requests/${requestId}/`, { 
            status: approve ? "approved" : "rejected" 
          });
        } else {
          throw firstError;
        }
      }
      toast.success(approve ? "Coordinator request approved" : "Coordinator request rejected");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to update request status");
      console.error("Error updating request status:", error);
    }
  };

  const handleViewDetails = (request) => {
    setViewDetails(request);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={styles.requestsManagement}>
      <div className={styles.toolbarContainer}>
        <div className={styles.filters}>
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or email..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className={styles.statusFilter}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading requests...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.user_name}</td>
                    <td>{request.email}</td>
                    <td>{formatDate(request.created_at)}</td>
                    <td>
                      <span
                        className={`${styles.statusChip} ${
                          request.status === "approved"
                            ? styles.approved
                            : request.status === "pending"
                            ? styles.pending
                            : styles.rejected
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          onClick={() => handleViewDetails(request)}
                        >
                          <FaEye />
                        </button>
                        {request.status === "pending" && (
                          <>
                            <button
                              className={`${styles.actionButton} ${styles.approveButton}`}
                              onClick={() => handleApproveRequest(request.id, true)}
                            >
                              <FaCheck />
                            </button>
                            <button
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              onClick={() => handleApproveRequest(request.id, false)}
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No coordinator requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewDetails && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2>Coordinator Request Details</h2>
            <div className={styles.eventDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Name:</span>
                <span className={styles.detailValue}>{viewDetails.user_name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{viewDetails.email}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Date Submitted:</span>
                <span className={styles.detailValue}>{formatDate(viewDetails.created_at)}</span>
              </div>
              {viewDetails.reason && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Reason:</span>
                  <span className={styles.detailValue}>{viewDetails.reason}</span>
                </div>
              )}
              {viewDetails.experience && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Experience:</span>
                  <span className={styles.detailValue}>{viewDetails.experience}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status:</span>
                <span
                  className={`${styles.statusChip} ${
                    viewDetails.status === "approved"
                      ? styles.approved
                      : viewDetails.status === "pending"
                      ? styles.pending
                      : styles.rejected
                  }`}
                >
                  {viewDetails.status}
                </span>
              </div>
            </div>
            <div className={styles.modalActions}>
              {viewDetails.status === "pending" && (
                <>
                  <button
                    className={`${styles.saveButton}`}
                    onClick={() => {
                      handleApproveRequest(viewDetails.id, true);
                      setViewDetails(null);
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className={`${styles.deleteButton}`}
                    onClick={() => {
                      handleApproveRequest(viewDetails.id, false);
                      setViewDetails(null);
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                className={styles.cancelButton}
                onClick={() => setViewDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorRequests;
