import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  FaUsers,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaChartLine,
  FaMapMarkerAlt,
  FaUserPlus,
  FaCalendarPlus,
  FaChartBar,
  FaFileInvoice,
  FaDownload,
  FaBullhorn,
  FaUserShield,
  FaUser,
  FaClock,
  FaCheck,
  FaTimes,
  FaUserCog
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import api, { getMediaUrl } from "../../utils/api";
import styles from "../../assets/css/Dashboard.module.css";
import UsersManagement from "./userManagement";
import EventsManagement from "./eventsManagement";
import PaymentsManagement from "./paymentsManagement";
import CoordinatorRequests from "./coordinatorRequest";
import Settings from "./settings";
import ProfileUpdate from "./profileUpdate";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../utils/constants";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

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
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
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
  
  // Chart reference
  const chartRef = React.useRef(null);
  const chart = React.useRef(null);

  useEffect(() => {
    console.log("Dashboard mounting, checking authentication...");
    checkAuthAndFetchStats();
    fetchUserProfile();
  }, []);
  
  useEffect(() => {
    // Initialize chart when stats are loaded and overview tab is active
    if (!loading && activeTab === "overview" && chartRef.current) {
      createRevenueChart();
    }
    
    return () => {
      // Destroy chart when component unmounts
      if (chart.current) {
        chart.current.destroy();
      }
    };
  }, [loading, activeTab, stats]);

  const checkAuthAndFetchStats = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    console.log("Token found:", token ? "Yes" : "No");
    
    if (!token) {
      console.log("No token found, redirecting to login");
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
      
      console.log("User role:", userRole);
      
      // Redirect based on role if not admin
      if (userRole && userRole !== "admin") {
        console.log(`Redirecting ${userRole} to appropriate dashboard`);
        
        if (userRole === "coordinator") {
          navigate("/coordinator-dashboard");
          return;
        } else if (userRole === "normal") {
          navigate("/user-dashboard");
          return;
        } else {
          // For any other role, redirect to homepage
          navigate("/");
          return;
        }
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
      
      // If we got here, token is valid or was refreshed successfully
      await fetchDashboardData();
    } catch (error) {
      console.error("Token verification failed:", error);
      // Token might be invalid or expired
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
      localStorage.removeItem("user");
      navigate("/login_reg");
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try multiple endpoints for dashboard stats
      const statsEndpoints = [
        "dashboard-stats/",
        "admin/dashboard-stats/",
        "api/dashboard-stats/",
        "dashboard/stats/"
      ];
      
      let statsData = null;
      let pendingRequests = 0;
      
      // Try each endpoint until one works
      for (const endpoint of statsEndpoints) {
        try {
          console.log(`Trying to fetch stats from ${endpoint}`);
          const statsResponse = await api.get(endpoint);
          if (statsResponse.data) {
            statsData = statsResponse.data;
            console.log("Stats data fetched successfully:", statsData);
            break;
          }
        } catch (error) {
          console.warn(`Could not fetch stats from ${endpoint}:`, error);
        }
      }
      
      // If we couldn't get stats from any endpoint, try to build them from separate calls
      if (!statsData) {
        console.log("Attempting to build stats from separate API calls...");
        
        // Get users count
        try {
          const usersResponse = await api.get("users/");
          if (Array.isArray(usersResponse.data)) {
            statsData = { ...statsData, totalUsers: usersResponse.data.length };
          }
        } catch (error) {
          console.warn("Could not fetch users count:", error);
        }
        
        // Get events count
        try {
          const eventsResponse = await api.get("events/");
          if (Array.isArray(eventsResponse.data)) {
            statsData = { 
              ...statsData, 
              totalEvents: eventsResponse.data.length,
              activeEvents: eventsResponse.data.filter(e => e.status === 'upcoming').length
            };
          }
        } catch (error) {
          console.warn("Could not fetch events count:", error);
        }
        
        // Get payment/revenue data
        try {
          const paymentsResponse = await api.get("payments/");
          if (Array.isArray(paymentsResponse.data)) {
            const totalRevenue = paymentsResponse.data
              .filter(p => p.payment_status === 'completed')
              .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
            statsData = { ...statsData, totalRevenue };
          }
        } catch (error) {
          console.warn("Could not fetch payments data:", error);
        }
        
        // Get coordinator requests
        try {
          const requestsResponse = await api.get("coordinator-requests/");
          if (Array.isArray(requestsResponse.data)) {
            pendingRequests = requestsResponse.data.filter(r => r.status === 'pending').length;
            statsData = { ...statsData, pendingRequests };
          }
        } catch (error) {
          console.warn("Could not fetch coordinator requests:", error);
        }
      }
      
      // Set stats with defaults for missing values
      setStats({
        totalUsers: statsData?.totalUsers || 0,
        totalEvents: statsData?.totalEvents || 0,
        totalRevenue: statsData?.totalRevenue || 0,
        activeEvents: statsData?.activeEvents || 0,
        pendingRequests: statsData?.pendingRequests || pendingRequests || 0,
      });
      
      // Try to fetch upcoming events from multiple possible endpoints
      const eventsEndpoints = [
        "events/upcoming/", 
        "events/?status=upcoming", 
        "api/events/upcoming/",
        "events/"
      ];
      
      for (const endpoint of eventsEndpoints) {
        try {
          console.log(`Trying to fetch upcoming events from ${endpoint}`);
          const eventsResponse = await api.get(endpoint);
          if (eventsResponse.data) {
            let eventsData = eventsResponse.data;
            // If we got all events, filter the upcoming ones
            if (endpoint === "events/") {
              eventsData = eventsData.filter(event => 
                event.status === 'upcoming' || 
                new Date(event.event_time) > new Date()
              );
            }
            setUpcomingEvents(Array.isArray(eventsData) ? eventsData.slice(0, 5) : []);
            break;
          }
        } catch (error) {
          console.warn(`Could not fetch upcoming events from ${endpoint}:`, error);
        }
      }
      
      // Try to fetch recent activity from multiple possible endpoints
      const activityEndpoints = [
        "activity-logs/", 
        "admin/activity-logs/", 
        "dashboard/activity/",
        "api/activity/"
      ];
      
      for (const endpoint of activityEndpoints) {
        try {
          console.log(`Trying to fetch activity logs from ${endpoint}`);
          const activityResponse = await api.get(endpoint);
          if (activityResponse.data) {
            setRecentActivity(Array.isArray(activityResponse.data) ? 
              activityResponse.data.slice(0, 10) : []);
            break;
          }
        } catch (error) {
          console.warn(`Could not fetch activity logs from ${endpoint}:`, error);
          // If we can't get activity logs, create some from recent events and users
          try {
            const mockActivity = [];
            // Try to get recent users
            const usersResponse = await api.get("users/");
            if (Array.isArray(usersResponse.data)) {
              const recentUsers = usersResponse.data
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);
                
              recentUsers.forEach(user => {
                mockActivity.push({
                  id: `user-${user.id}`,
                  activity_type: 'user_registered',
                  description: `New user ${user.username} registered`,
                  created_at: user.created_at
                });
              });
            }
            
            // Try to get recent events
            const eventsResponse = await api.get("events/");
            if (Array.isArray(eventsResponse.data)) {
              const recentEvents = eventsResponse.data
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);
                
              recentEvents.forEach(event => {
                mockActivity.push({
                  id: `event-${event.id}`,
                  activity_type: 'event_created',
                  description: `New event "${event.event_name}" created`,
                  created_at: event.created_at
                });
              });
            }
            
            // Sort combined activity by date
            mockActivity.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setRecentActivity(mockActivity.slice(0, 10));
          } catch (mockError) {
            console.warn("Could not create mock activity data:", mockError);
            setRecentActivity([]);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      // Try multiple endpoints to find the one that works
      const endpoints = [
        "users/profile/",
        "api/users/me/",
        "api/profile/",
        "auth/users/me/",
        "users/me/"
      ];
      
      let userData = null;
      let succeeded = false;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch profile from ${endpoint}`);
          const response = await api.get(endpoint);
          
          if (response.data) {
            userData = response.data;
            console.log(`Successfully fetched profile from ${endpoint}`);
            succeeded = true;
            break;
          }
        } catch (error) {
          console.warn(`Failed to fetch profile from ${endpoint}:`, error);
        }
      }
      
      if (!succeeded) {
        // Last attempt with direct fetch and explicit headers
        try {
          const token = localStorage.getItem(ACCESS_TOKEN);
          const response = await fetch(`${api.defaults.baseURL}users/profile/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            userData = await response.json();
            succeeded = true;
          }
        } catch (error) {
          console.error("Final profile fetch attempt failed:", error);
        }
      }
      
      if (succeeded && userData) {
        setUserProfile(userData);
        
        // Handle profile photo URL
        if (userData.profile_photo) {
          // Use the getMediaUrl utility function
          setProfilePhotoPreview(getMediaUrl(userData.profile_photo));
        }
      } else {
        throw new Error("Could not fetch profile from any endpoint");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Create a fallback profile from JWT token if possible
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
          const decoded = jwtDecode(token);
          const fallbackProfile = {
            username: decoded.username || "User",
            email: decoded.email || "",
            first_name: decoded.first_name || "",
            last_name: decoded.last_name || "",
          };
          setUserProfile(fallbackProfile);
        }
      } catch (tokenError) {
        console.error("Could not extract profile from token:", tokenError);
      }
    }
  };

  const createRevenueChart = () => {
    const ctx = chartRef.current.getContext('2d');
    
    // Sample data - replace with actual API data when available
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueData = [5000, 7500, 8000, 7800, 9500, 10200, 11000, 10500, 11700, 12500, 14000, 15000];
    const eventsData = [5, 7, 8, 6, 9, 10, 12, 10, 11, 13, 15, 18];
    
    // Destroy existing chart if it exists
    if (chart.current) {
      chart.current.destroy();
    }
    
    // Create new chart
    chart.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Revenue (₹)',
            data: revenueData,
            backgroundColor: 'rgba(255, 74, 23, 0.7)',
            borderColor: '#ff4a17',
            borderWidth: 1,
            yAxisID: 'y',
          },
          {
            label: 'Events',
            data: eventsData,
            type: 'line',
            backgroundColor: 'rgba(46, 204, 113, 0.2)',
            borderColor: '#2ecc71',
            borderWidth: 2,
            pointBackgroundColor: '#2ecc71',
            pointRadius: 4,
            tension: 0.3,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: {
              display: true,
              text: 'Revenue (₹)'
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: 'Number of Events'
            }
          }
        }
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem("user");
    navigate("/login_reg");
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getDayAndMonth = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' })
    };
  };
  
  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'user_registered':
        return <FaUserPlus />;
      case 'event_created':
        return <FaCalendarPlus />;
      case 'payment_received':
        return <FaMoneyBillWave />;
      case 'event_approved':
        return <FaCheck />;
      case 'event_rejected':
        return <FaTimes />;
      default:
        return <FaClock />;
    }
  };
  
  const getTimeSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval} years ago`;
    if (interval === 1) return `1 year ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval} months ago`;
    if (interval === 1) return `1 month ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `${interval} days ago`;
    if (interval === 1) return `1 day ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `${interval} hours ago`;
    if (interval === 1) return `1 hour ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return `${interval} minutes ago`;
    if (interval === 1) return `1 minute ago`;
    
    return 'Just now';
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'users':
        setActiveTab('users');
        break;
      case 'events':
        setActiveTab('events');
        break;
      case 'payments':
        setActiveTab('payments');
        break;
      case 'requests':
        setActiveTab('requests');
        break;
      case 'report':
        // Download monthly report
        toast.info('Downloading monthly report...');
        break;
      case 'announcement':
        toast.info('Create announcement feature coming soon');
        break;
      default:
        break;
    }
  };

  const renderOverview = () => {
    return (
      <>
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
        
        {/* Quick Action Buttons */}
        <div className={styles.quickActions}>
          <button
            className={styles.quickActionButton}
            onClick={() => handleQuickAction('users')}
          >
            <FaUserShield className={styles.quickActionIcon} />
            <h3 className={styles.quickActionTitle}>Manage Users</h3>
          </button>
          <button
            className={styles.quickActionButton}
            onClick={() => handleQuickAction('events')}
          >
            <FaCalendarPlus className={styles.quickActionIcon} />
            <h3 className={styles.quickActionTitle}>Manage Events</h3>
          </button>
          <button
            className={styles.quickActionButton}
            onClick={() => handleQuickAction('payments')}
          >
            <FaMoneyBillWave className={styles.quickActionIcon} />
            <h3 className={styles.quickActionTitle}>View Payments</h3>
          </button>
          <button
            className={styles.quickActionButton}
            onClick={() => handleQuickAction('requests')}
          >
            <FaBell className={styles.quickActionIcon} />
            <h3 className={styles.quickActionTitle}>Coordinator Requests</h3>
          </button>
          <button
            className={styles.quickActionButton}
            onClick={() => handleQuickAction('report')}
          >
            <FaFileInvoice className={styles.quickActionIcon} />
            <h3 className={styles.quickActionTitle}>Monthly Report</h3>
          </button>
          <button
            className={styles.quickActionButton}
            onClick={() => handleQuickAction('announcement')}
          >
            <FaBullhorn className={styles.quickActionIcon} />
            <h3 className={styles.quickActionTitle}>Make Announcement</h3>
          </button>
        </div>

        {/* Dashboard Sections */}
        <div className={styles.dashboardSections}>
          {/* Upcoming Events */}
          <div className={styles.card}>
            <h3>Upcoming Events</h3>
            <div className={styles.eventList}>
              {upcomingEvents.map(event => (
                <div key={event.id} className={styles.eventItem}>
                  <div className={styles.eventInfo}>
                    <h4>{event.event_name}</h4>
                    <p>{event.description}</p>
                    <div className={styles.eventMeta}>
                      <span>{new Date(event.event_time || event.start_date || event.created_at).toLocaleDateString()}</span>
                      <span>{event.event_type}</span>
                      <span className={styles[event.status.toLowerCase()]}>{event.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className={styles.card}>
            <h3>Recent Activity</h3>
            <div className={styles.activityList}>
              {recentActivity.map(activity => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    {activity.type === 'event' && <FaCalendarAlt />}
                  </div>
                  <div className={styles.activityInfo}>
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                    <span className={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Analytics Section */}
        <div className={styles.analyticsSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Revenue & Events Analytics</h3>
          </div>
          <div className={styles.chartContainer}>
            <canvas ref={chartRef}></canvas>
          </div>
        </div>
      </>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
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
      case "profile":
        return <ProfileUpdate />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
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
            { id: "profile", icon: <FaUserCog />, label: "My Profile" },
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
