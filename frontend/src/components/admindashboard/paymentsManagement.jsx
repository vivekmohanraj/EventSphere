import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaDownload, FaEye, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import api from "../../utils/api";
import styles from "../../assets/css/Dashboard.module.css";

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
      // Try multiple endpoints that could exist
      try {
        const response = await api.get("payments/all/");
        setPayments(response.data);
      } catch (firstError) {
        console.warn("Could not fetch from payments/all/, trying payments/");
        const fallbackResponse = await api.get("payments/");
        setPayments(Array.isArray(fallbackResponse.data) ? fallbackResponse.data : []);
      }
      calculateStats(payments);
    } catch (error) {
      toast.error("Failed to fetch payments");
      console.error("Error fetching payments:", error);
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
      // Try multiple endpoints that could exist
      try {
        await api.patch(`payments/${paymentId}/status/`, { status: newStatus });
      } catch (firstError) {
        if (firstError.response && firstError.response.status === 404) {
          console.warn(`Could not patch payments/${paymentId}/status/, trying payments/${paymentId}/`);
          await api.patch(`payments/${paymentId}/`, { status: newStatus });
        } else {
          throw firstError;
        }
      }
      toast.success(`Payment status updated to ${newStatus}`);
      fetchPayments();
    } catch (error) {
      toast.error("Failed to update payment status");
      console.error("Error updating payment status:", error);
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

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className={styles.paymentsManagement}>
      {/* Payment Stats */}
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

      {/* Filters and Export */}
      <div className={styles.toolbarContainer}>
        <div className={styles.filters}>
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by user, event, or transaction ID..."
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
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
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
        <button className={styles.exportButton} onClick={handleExportCSV}>
          <FaDownload /> Export CSV
        </button>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className={styles.loader}>Loading payments...</div>
      ) : (
        <div className={styles.tableContainer}>
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
                  <td colSpan="7" style={{ textAlign: "center" }}>
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
