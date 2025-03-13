import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaCheck, FaTimes, FaSearch } from "react-icons/fa";
import api from "../utils/api";
import styles from "../assets/css/coordinatorRequest.module.css";

const CoordinatorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("coordinator-requests/", {
        params: { status: filter },
      });
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to fetch coordinator requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await api.patch(`coordinator-requests/${requestId}/`, { status });
      toast.success(
        `Request ${status === "approved" ? "approved" : "rejected"}`
      );
      fetchRequests();
    } catch (error) {
      toast.error(`Failed to ${status} request`);
    }
  };

  const filteredRequests = requests.filter(
    (request) =>
      request.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Coordinator Requests</h2>
        <div className={styles.filters}>
          <div className={styles.searchBar}>
            <FaSearch />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Requests</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading...</div>
      ) : (
        <div className={styles.requestsGrid}>
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <div key={request.id} className={styles.requestCard}>
                <div className={styles.userInfo}>
                  <img
                    src={request.user_photo || "/default-avatar.png"}
                    alt={request.user_name}
                    className={styles.userPhoto}
                  />
                  <div>
                    <h3>{request.user_name}</h3>
                    <p>{request.user_email}</p>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[request.status]
                    }`}
                  >
                    {request.status}
                  </span>
                </div>

                <div className={styles.requestDetails}>
                  <div className={styles.detail}>
                    <label>Experience:</label>
                    <span>{request.experience} years</span>
                  </div>
                  <div className={styles.detail}>
                    <label>Skills:</label>
                    <span>{request.skills}</span>
                  </div>
                  <div className={styles.message}>
                    <label>Message:</label>
                    <p>{request.message}</p>
                  </div>
                </div>

                {request.status === "pending" && (
                  <div className={styles.actions}>
                    <button
                      onClick={() => handleStatusUpdate(request.id, "approved")}
                      className={`${styles.actionButton} ${styles.approveButton}`}
                    >
                      <FaCheck /> Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(request.id, "rejected")}
                      className={`${styles.actionButton} ${styles.rejectButton}`}
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.noData}>No requests found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoordinatorRequests;
