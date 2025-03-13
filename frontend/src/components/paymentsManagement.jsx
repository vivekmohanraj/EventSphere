import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaDownload, FaEye, FaSearch, FaFilter } from "react-icons/fa";
import api from "../utils/api";
import styles from "../assets/css/paymentsManagement.module.css";

const PaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchPayments();
  }, [filter, dateRange]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get("payments/", {
        params: {
          status: filter !== "all" ? filter : undefined,
          start_date: dateRange.start,
          end_date: dateRange.end,
        },
      });
      setPayments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to fetch payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await api.get("payments/report/", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `payments-report-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Failed to download report");
    }
  };

  const filteredPayments = payments.filter((payment) => {
    return (
      payment.transaction_id
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Payments Management</h2>
        <button
          onClick={handleDownloadReport}
          className={styles.downloadButton}
        >
          <FaDownload /> Export Report
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <FaSearch />
          <input
            type="text"
            placeholder="Search by Transaction ID or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <FaFilter />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="all">All Status</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className={styles.dateFilters}>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className={styles.dateInput}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className={styles.dateInput}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Event</th>
                <th>User</th>
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
                    <td>{payment.event_name}</td>
                    <td>{payment.user_email}</td>
                    <td>₹{payment.amount}</td>
                    <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`${styles.statusChip} ${
                          styles[payment.status]
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          window.open(`payments/${payment.id}`, "_blank")
                        }
                        className={styles.viewButton}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
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
    </div>
  );
};

export default PaymentsManagement;
