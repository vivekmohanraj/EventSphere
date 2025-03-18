import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  FaUsers,
  FaCalendarAlt,
  FaFileInvoice,
  FaSignOutAlt,
  FaUserCog
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import api from "../../utils/api";
import styles from "../../assets/css/Dashboard.module.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../utils/constants";

const CoordinatorDashboard = () => {
  const [stats, setStats] = useState({
    managedEvents: 0,
    upcomingEvents: 0,
    totalAttendees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    profile_photo: null
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchStats();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("users/profile/");
      if (response.data) {
        setUserProfile(response.data);
        if (response.data.profile_photo) {
          // Handle both relative and absolute URLs
          const photoUrl = response.data.profile_photo;
          if (photoUrl.startsWith('http')) {
            setProfilePhotoPreview(photoUrl);
          } else {
            // Join with API base URL for relative paths
            const baseUrl = process.env.REACT_APP_API_URL || '';
            setProfilePhotoPreview(`${baseUrl}${photoUrl}`);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const checkAuthAndFetchStats = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    
    if (!token) {
      navigate("/login_reg");
      return;
    }
    
    try {
      // Check token validity using JWT decode
      const decoded = jwtDecode(token);
      const tokenExpiration = decoded.exp;
      const now = Date.now() / 1000;
      
      // Check user role from token or localStorage
      let userRole;
      
      // Try to get role from token
      if (decoded.role) {
        userRole = decoded.role;
      } else if (decoded.user_role) {
        userRole = decoded.user_role;
      } else {
        // If not in token, try localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            userRole = parsedUserData.role || parsedUserData.user_role;
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
      }
      
      // Redirect if not a coordinator
      if (userRole !== "coordinator") {
        if (userRole === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/user-dashboard");
        }
        return;
      }
      
      if (tokenExpiration < now) {
        // Token expired, try to refresh
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        const response = await api.post("token/refresh/", {
          refresh: refreshToken,
        });
        
        if (response.status === 200) {
          localStorage.setItem(ACCESS_TOKEN, response.data.access);
        } else {
          throw new Error("Token refresh failed");
        }
      }
      
      // Fetch coordinator dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error("Authentication error:", error);
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
      localStorage.removeItem("user");
      navigate("/login_reg");
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch coordinator statistics
      try {
        const statsResponse = await api.get("events/coordinator-stats/");
        if (statsResponse.data) {
          setStats({
            managedEvents: statsResponse.data.managed_events || 0,
            upcomingEvents: statsResponse.data.upcoming_events || 0,
            totalAttendees: statsResponse.data.total_attendees || 0,
          });
        }
      } catch (error) {
        console.warn("Could not fetch coordinator stats:", error);
        // Use default values if stats fetch fails
      }
      
      // Fetch upcoming events managed by this coordinator
      try {
        const eventsResponse = await api.get("events/coordinator-events/");
        if (eventsResponse.data) {
          setUpcomingEvents(eventsResponse.data.slice(0, 5)); // Show the first 5 events
        }
      } catch (error) {
        console.warn("Could not fetch coordinator events:", error);
        setUpcomingEvents([]);
      }
      
    } catch (error) {
      toast.error("Error loading dashboard data");
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem("user");
    navigate("/login_reg");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "events":
        return <div>Events Management Component will go here</div>;
      case "profile":
        return <div>Profile Component will go here</div>;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => {
    return (
      <div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaCalendarAlt />
            </div>
            <div>
              <h3>Managed Events</h3>
              <p>{stats.managedEvents}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaCalendarAlt />
            </div>
            <div>
              <h3>Upcoming Events</h3>
              <p>{stats.upcomingEvents}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaUsers />
            </div>
            <div>
              <h3>Total Attendees</h3>
              <p>{stats.totalAttendees}</p>
            </div>
          </div>
        </div>

        <div className={styles.dashboardSections}>
          <div className={styles.upcomingEvents}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>My Events</h3>
              <a href="#" className={styles.viewAllLink} onClick={() => setActiveTab("events")}>
                View All
              </a>
            </div>
            
            {upcomingEvents.length > 0 ? (
              <ul className={styles.eventList}>
                {upcomingEvents.map((event, index) => (
                  <li key={index} className={styles.eventItem}>
                    <div className={styles.eventDate}>
                      <span className={styles.eventDay}>
                        {new Date(event.event_date).getDate()}
                      </span>
                      <span className={styles.eventMonth}>
                        {new Date(event.event_date).toLocaleString("default", {
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className={styles.eventContent}>
                      <h4 className={styles.eventTitle}>{event.title}</h4>
                      <p>{event.description?.substring(0, 100) || "No description"}...</p>
                      <div className={styles.eventInfo}>
                        <span>
                          <FaUsers /> {event.attendee_count || 0} Attendees
                        </span>
                        <span>
                          <FaMapMarkerAlt /> {event.venue || "TBD"}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No upcoming events found</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.dashboardContainer}>
      <ToastContainer />
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          {profilePhotoPreview ? (
            <img
              src={profilePhotoPreview}
              alt="Profile"
              className={styles.userAvatar}
            />
          ) : (
            <div className={styles.userAvatarPlaceholder}>
              <span>
                {userProfile.first_name ? userProfile.first_name.charAt(0).toUpperCase() : ''}
                {userProfile.last_name ? userProfile.last_name.charAt(0).toUpperCase() : ''}
              </span>
            </div>
          )}
          <h2>EventSphere</h2>
        </div>
        <div className={styles.nav}>
          <button
            className={`${styles.navButton} ${
              activeTab === "overview" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <FaCalendarAlt />
            <span>My Dashboard</span>
          </button>
          <button
            className={`${styles.navButton} ${
              activeTab === "events" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("events")}
          >
            <FaCalendarAlt />
            <span>Events</span>
          </button>
          <button
            className={`${styles.navButton} ${
              activeTab === "reports" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("reports")}
          >
            <FaFileInvoice />
            <span>Reports</span>
          </button>
          <button
            className={`${styles.navButton} ${
              activeTab === "profile" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <FaUserCog />
            <span>Profile</span>
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </div>
      <main className={styles.main}>
        <h1>Coordinator Dashboard</h1>
        {loading ? (
          <div className={styles.loader}>Loading dashboard data...</div>
        ) : (
          renderTab()
        )}
      </main>
    </div>
  );
};

export default CoordinatorDashboard; 