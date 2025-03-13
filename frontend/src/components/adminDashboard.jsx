import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaChartLine,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import api from "../utils/api";
import styles from "../assets/css/Dashboard.module.css";
import UsersManagement from "./userManagement";
import EventsManagement from "./eventsManagement";
import PaymentsManagement from "./paymentsManagement";
import CoordinatorRequests from "./coordinatorRequest";
import Settings from "./settings";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRevenue: 0,
    activeEvents: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchStats();
  }, []);

  const checkAuthAndFetchStats = async () => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (!token) {
      navigate("/login_reg");
      return;
    }
    await fetchDashboardStats();
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("dashboard-stats/");
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to fetch dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ACCESS_TOKEN");
    navigate("/login_reg");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <FaUsers className={styles.statIcon} />
              <div>
                <h3>Total Users</h3>
                <p>{stats.totalUsers}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <FaCalendarAlt className={styles.statIcon} />
              <div>
                <h3>Total Events</h3>
                <p>{stats.totalEvents}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <FaMoneyBillWave className={styles.statIcon} />
              <div>
                <h3>Revenue</h3>
                <p>₹{stats.totalRevenue}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <FaChartLine className={styles.statIcon} />
              <div>
                <h3>Active Events</h3>
                <p>{stats.activeEvents}</p>
              </div>
            </div>
          </div>
        );
      case "users":
        return <UsersManagement />;
      case "events":
        return <EventsManagement />;
      case "payments":
        return <PaymentsManagement />;
      case "requests":
        return <CoordinatorRequests />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <img src="/logo.png" alt="EventSphere" className={styles.logo} />
          <h2>Admin Panel</h2>
        </div>

        <nav className={styles.nav}>
          {[
            { id: "overview", icon: <FaChartLine />, label: "Overview" },
            { id: "users", icon: <FaUsers />, label: "Users" },
            { id: "events", icon: <FaCalendarAlt />, label: "Events" },
            { id: "payments", icon: <FaMoneyBillWave />, label: "Payments" },
            {
              id: "requests",
              icon: <FaBell />,
              label: "Requests",
              badge: stats.pendingRequests,
            },
            { id: "settings", icon: <FaCog />, label: "Settings" },
          ].map((item) => (
            <button
              key={item.id}
              className={`${styles.navButton} ${
                activeTab === item.id ? styles.active : ""
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className={styles.badge}>{item.badge}</span>
              )}
            </button>
          ))}

          <button className={styles.logoutButton} onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.loader}>Loading...</div>
        ) : (
          renderContent()
        )}
      </main>
      <ToastContainer position="top-right" />
    </div>
  );
};

export default Dashboard;
