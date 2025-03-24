import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaDownload, FaEye, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import api, { tryMultipleEndpoints, directFetch } from "../../utils/api";
import { ACCESS_TOKEN } from "../../utils/constants";
import styles from "../../assets/css/adminDashboard.module.css";
import { normalizePaymentData, formatDate, formatCurrency } from "../../utils/dataFormatters";

const PaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [viewDetails, setViewDetails] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    completedPayments: 0,
    failedPayments: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Log current configuration
      console.log("Fetching payments from base URL:", api.defaults.baseURL);
      
      // Fetch payments data from backend
      const response = await api.get("payments/");
      
      // Log detailed response info for debugging
      console.log("Payments response:", response);
      console.log("Response data type:", typeof response.data);
      console.log("Response data preview:", 
        typeof response.data === 'object' 
          ? JSON.stringify(response.data).substring(0, 200) 
          : response.data
      );
      
      // Handle different possible response formats
      if (response.data) {
        let paymentsData = [];
        
        if (Array.isArray(response.data)) {
          // Direct array of payments
          console.log("Direct array format detected");
          paymentsData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Paginated response (Django REST Framework default)
          console.log("Paginated format detected");
          paymentsData = response.data.results;
        } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Check for different property names
          console.log("Object format detected, checking for payments property");
          if (response.data.payments && Array.isArray(response.data.payments)) {
            paymentsData = response.data.payments;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            paymentsData = response.data.data;
          } else if (Object.keys(response.data).length > 0 && response.data.id) {
            // Single payment object
            paymentsData = [response.data];
          } else {
            // Try to find an array in the response
            for (const key in response.data) {
              if (Array.isArray(response.data[key])) {
                console.log(`Found payments array in property: ${key}`);
                paymentsData = response.data[key];
                break;
              }
            }
          }
        }
        
        if (paymentsData.length > 0) {
          console.log(`Found ${paymentsData.length} payments, normalizing`);
          const normalizedPayments = paymentsData.map(normalizePaymentData);
          setPayments(normalizedPayments);
          calculateStats(normalizedPayments);
        } else {
          console.log("No payments found in the response");
          setPayments([]);
          toast.info("No payment records found");
        }
      } else {
        console.log("Empty response from backend");
        setPayments([]);
        toast.warning("Received empty response from payment service");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      if (error.response) {
        console.log("Error status:", error.response.status);
        console.log("Error data:", error.response.data);
        
        if (error.response.status === 403) {
          toast.error("You don't have permission to access payment records");
        } else if (error.response.status === 401) {
          toast.error("Authentication required to view payments");
        } else {
          toast.error(`Error loading payments: ${error.response.status}`);
        }
      } else if (error.request) {
        toast.error("No response from payment service. Check your connection.");
      } else {
        toast.error(`Payment fetch error: ${error.message}`);
      }
      
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData) => {
    const totalRevenue = paymentsData.reduce(
      (sum, payment) => (payment.status === "completed" ? sum + payment.amount : sum),
      0
    );
    
    const pendingAmount = paymentsData.reduce(
      (sum, payment) => (payment.status === "pending" ? sum + payment.amount : sum),
      0
    );
    
    const completedPayments = paymentsData.filter(
      (payment) => payment.status === "completed"
    ).length;
    
    const failedPayments = paymentsData.filter(
      (payment) => payment.status === "failed"
    ).length;

    setStats({
      totalRevenue,
      pendingAmount,
      completedPayments,
      failedPayments,
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({ ...dateRange, [name]: value });
  };

  const filteredPayments = payments.filter((payment) => {
    // Filter by search term (transaction ID, user, or event)
    const matchesSearch =
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.event_name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by status
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

    // Filter by date range
    let matchesDateRange = true;
    if (dateRange.from) {
      matchesDateRange = matchesDateRange && new Date(payment.date) >= new Date(dateRange.from);
    }
    if (dateRange.to) {
      matchesDateRange = matchesDateRange && new Date(payment.date) <= new Date(dateRange.to);
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const handleViewDetails = (payment) => {
    setViewDetails(payment);
  };

  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      // Map frontend status to backend field name (payment_status in model)
      const statusData = {
        payment_status: newStatus // Match Django model field
      };
      
      // Log the update request
      console.log(`Updating payment ${paymentId} status to ${newStatus}`);
      console.log("Update data:", statusData);
      
      // Send update to backend
      const response = await api.patch(`payments/${paymentId}/`, statusData);
      console.log("Update response:", response);
      
      // Success! Update local state
      toast.success(`Payment marked as ${newStatus}`);
      
      setPayments(
        payments.map((payment) =>
          payment.id === paymentId ? { ...payment, status: newStatus } : payment
        )
      );
      
      // Update view details if open
      if (viewDetails && viewDetails.id === paymentId) {
        setViewDetails({...viewDetails, status: newStatus});
      }
      
      // Recalculate stats
      calculateStats(payments.map(p => p.id === paymentId ? {...p, status: newStatus} : p));
    } catch (error) {
      console.error("Error updating payment status:", error);
      
      if (error.response) {
        console.log("Error status:", error.response.status);
        console.log("Error data:", error.response.data);
        
        if (error.response.status === 400) {
          // Validation error
          const errorMsg = typeof error.response.data === 'object' 
            ? Object.values(error.response.data).flat().join(', ')
            : error.response.data;
          toast.error(`Validation error: ${errorMsg}`);
        } else if (error.response.status === 403) {
          toast.error("You don't have permission to update this payment");
        } else {
          toast.error(`Update failed: ${error.response.status}`);
        }
      } else {
        toast.error("Failed to update payment status - connection error");
      }
    }
  };

  const handleExportCSV = () => {
    // Create CSV header
    let csv = "Transaction ID,User,Event,Amount,Date,Status\n";
    
    // Add rows
    filteredPayments.forEach((payment) => {
      csv += `${payment.transaction_id},${payment.user_name},${payment.event_name},${payment.amount},${new Date(payment.date).toLocaleDateString()},${payment.status}\n`;
    });
    
    // Create and download the file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.contentContainer}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Payments Management</h2>
        <button 
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={handleExportCSV}
        >
          <FaDownload /> Export Payments
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>₹</div>
          <div>
            <h3>Total Revenue</h3>
            <p>{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>₹</div>
          <div>
            <h3>Pending Amount</h3>
            <p>{formatCurrency(stats.pendingAmount)}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaCheckCircle />
          </div>
          <div>
            <h3>Completed Payments</h3>
            <p>{stats.completedPayments}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaTimesCircle />
          </div>
          <div>
            <h3>Failed Payments</h3>
            <p>{stats.failedPayments}</p>
          </div>
        </div>
      </div>

      <div className={styles.filterContainer}>
        <div className={styles.searchBar}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search payments..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <div className={styles.filterDropdown}>
          <FaFilter className={styles.filterIcon} />
          <select 
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className={styles.filterSelect}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Filters and Export */}
      <div className={styles.toolbarContainer}>
        <div className={styles.filters}>
          <div className={styles.dateRangeFilter}>
            <input
              type="date"
              name="from"
              value={dateRange.from}
              onChange={handleDateRangeChange}
              className={styles.dateInput}
              placeholder="From"
            />
            <span className={styles.dateRangeSeparator}>to</span>
            <input
              type="date"
              name="to"
              value={dateRange.to}
              onChange={handleDateRangeChange}
              className={styles.dateInput}
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className={styles.loader}>Loading payments...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>User</th>
                <th>Event</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.transaction_id}</td>
                    <td>{payment.user_name}</td>
                    <td>{payment.event_name}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{formatDate(payment.date)}</td>
                    <td>
                      <span
                        className={`${styles.statusChip} ${
                          payment.status === "completed"
                            ? styles.approved
                            : payment.status === "pending"
                            ? styles.pending
                            : styles.rejected
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          onClick={() => handleViewDetails(payment)}
                        >
                          <FaEye />
                        </button>
                        {payment.status === "pending" && (
                          <>
                            <button
                              className={`${styles.actionButton} ${styles.approveButton}`}
                              onClick={() => handleUpdateStatus(payment.id, "completed")}
                            >
                              <FaCheckCircle />
                            </button>
                            <button
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              onClick={() => handleUpdateStatus(payment.id, "failed")}
                            >
                              <FaTimesCircle />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={styles.noData}>
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Details Modal */}
      {viewDetails && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2>Payment Details</h2>
            <div className={styles.eventDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Transaction ID:</span>
                <span className={styles.detailValue}>{viewDetails.transaction_id}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>User:</span>
                <span className={styles.detailValue}>{viewDetails.user_name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{viewDetails.user_email}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Event:</span>
                <span className={styles.detailValue}>{viewDetails.event_name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Amount:</span>
                <span className={styles.detailValue}>{formatCurrency(viewDetails.amount)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Date:</span>
                <span className={styles.detailValue}>{formatDate(viewDetails.date)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Payment Method:</span>
                <span className={styles.detailValue}>{viewDetails.payment_method}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status:</span>
                <span
                  className={`${styles.statusChip} ${
                    viewDetails.status === "completed"
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

export default PaymentsManagement;
