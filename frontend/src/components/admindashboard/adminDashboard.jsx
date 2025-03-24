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
import api, { getMediaUrl, tryMultipleEndpoints } from "../../utils/api";
import styles from "../../assets/css/adminDashboard.module.css";
import UsersManagement from "./userManagement";
import EventsManagement from "./eventsManagement";
import PaymentsManagement from "./paymentsManagement";
import CoordinatorRequests from "./coordinatorRequest";
import ProfileUpdate from "./profileUpdate";
import CalendarView from "./CalendarView";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../utils/constants";
import { Chart, registerables } from 'chart.js';
import DashboardOverview from './dashboardOverview';
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
      await fetchDashboardStats();
    } catch (error) {
      console.error("Token verification failed:", error);
      // Token might be invalid or expired
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
      localStorage.removeItem("user");
      navigate("/login_reg");
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Try multiple possible endpoints for dashboard stats
      const statEndpoints = [
        "dashboard/stats/",
        "admin/stats/",
        "users/stats/",
        "api/stats/",
        "stats/"
      ];
      
      let statsData = null;
      let responseData = null;
      
      // Try each endpoint until we get successful data
      for (const endpoint of statEndpoints) {
        try {
          console.log(`Trying to fetch stats from ${endpoint}`);
          const response = await api.get(endpoint);
          
          if (response.data) {
            console.log(`Successfully fetched stats from ${endpoint}:`, response.data);
            responseData = response.data;
            
            // Check if we got a valid stats object with at least one stat
            if (responseData && typeof responseData === 'object') {
              const hasUserCount = 'total_users' in responseData || 'totalUsers' in responseData || 'users_count' in responseData;
              const hasEventCount = 'total_events' in responseData || 'totalEvents' in responseData || 'events_count' in responseData;
              
              if (hasUserCount || hasEventCount) {
                statsData = responseData;
            break;
              }
            }
          }
        } catch (error) {
          console.warn(`Could not fetch stats from ${endpoint}`, error);
        }
      }
      
      // If we still don't have stats, try to count users/events directly from their endpoints
      if (!statsData) {
        console.log("No stats endpoint found, trying to fetch counts directly");
        await fetchCountsDirectly();
      } else {
        // Extract stats from the response and normalize field names
        const normalizedStats = {
          totalUsers: statsData.total_users || statsData.totalUsers || statsData.users_count || 0,
          totalEvents: statsData.total_events || statsData.totalEvents || statsData.events_count || 0,
          totalRevenue: statsData.total_revenue || statsData.totalRevenue || statsData.revenue || 0,
          activeEvents: statsData.active_events || statsData.activeEvents || 0,
          pendingRequests: statsData.pending_requests || statsData.pendingRequests || 0,
        };
        
        console.log("Setting stats:", normalizedStats);
        setStats(normalizedStats);
        
        // Set upcoming events if available
        if (statsData.upcoming_events || statsData.upcomingEvents) {
          setUpcomingEvents(statsData.upcoming_events || statsData.upcomingEvents);
        } else {
          // Otherwise fetch them separately
          fetchUpcomingEvents();
        }
        
        // Set recent activity if available
        if (statsData.recent_activity || statsData.recentActivity) {
          setRecentActivity(statsData.recent_activity || statsData.recentActivity);
        } else {
          // Otherwise fetch it separately
          fetchRecentActivity();
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchCountsDirectly = async () => {
    try {
      // Try to count users
      const userEndpoints = ["users/", "api/users/", "users/users/"];
      let userCount = 0;
      
      for (const endpoint of userEndpoints) {
        try {
          const response = await api.get(endpoint);
          if (response.data) {
            if (Array.isArray(response.data)) {
              userCount = response.data.length;
              break;
            } else if (response.data.results && Array.isArray(response.data.results)) {
              userCount = response.data.results.length;
              break;
            } else if (response.data.count) {
              userCount = response.data.count;
              break;
            }
          }
        } catch (error) {
          console.warn(`Could not fetch user count from ${endpoint}`, error);
        }
      }
      
      // Try to count events
      const eventEndpoints = ["events/", "api/events/", "events/events/"];
      let eventCount = 0;
      let activeCount = 0;
      
      for (const endpoint of eventEndpoints) {
        try {
          const response = await api.get(endpoint);
          if (response.data) {
            let events = [];
            if (Array.isArray(response.data)) {
              events = response.data;
            } else if (response.data.results && Array.isArray(response.data.results)) {
              events = response.data.results;
            }
            
            if (events.length > 0) {
              eventCount = events.length;
              
              // Count active events (events that haven't ended yet)
              const now = new Date();
              activeCount = events.filter(event => {
                const endDate = new Date(event.end_date || event.end_time || event.event_date);
                return endDate >= now;
              }).length;
              
              break;
            } else if (response.data.count) {
              eventCount = response.data.count;
              break;
            }
          }
        } catch (error) {
          console.warn(`Could not fetch event count from ${endpoint}`, error);
        }
      }
      
      // Try to count coordinator requests
      const requestEndpoints = ["coordinator/requests/", "api/coordinator/requests/", "requests/"];
      let requestCount = 0;
      
      for (const endpoint of requestEndpoints) {
        try {
          const response = await api.get(endpoint);
          if (response.data) {
            if (Array.isArray(response.data)) {
              requestCount = response.data.filter(req => req.status === 'pending').length;
              break;
            } else if (response.data.results && Array.isArray(response.data.results)) {
              requestCount = response.data.results.filter(req => req.status === 'pending').length;
              break;
            } else if (response.data.pending_count) {
              requestCount = response.data.pending_count;
              break;
            }
          }
        } catch (error) {
          console.warn(`Could not fetch request count from ${endpoint}`, error);
        }
      }
      
      // Update the stats
      setStats({
        totalUsers: userCount,
        totalEvents: eventCount,
        totalRevenue: 0, // We can't easily get this from separate endpoints
        activeEvents: activeCount,
        pendingRequests: requestCount
      });
      
      // Try to fetch upcoming events
      fetchUpcomingEvents();
      
      // Try to fetch recent activity
      fetchRecentActivity();
      
    } catch (error) {
      console.error("Error fetching counts directly:", error);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const endpoints = [
        "events/?upcoming=true",
        "api/events/?upcoming=true",
        "events/upcoming/",
        "events/"
      ];
      
      let events = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          if (response.data) {
            if (Array.isArray(response.data)) {
              events = response.data;
              break;
            } else if (response.data.results && Array.isArray(response.data.results)) {
              events = response.data.results;
              break;
            }
          }
        } catch (error) {
          console.warn(`Could not fetch upcoming events from ${endpoint}`, error);
        }
      }
      
      // If we got events from a generic endpoint, filter for upcoming ones
      if (events.length > 0 && endpoints.includes("events/")) {
        const now = new Date();
        events = events.filter(event => {
          const eventDate = new Date(event.event_date || event.start_date || event.date);
          return eventDate >= now;
        });
      }
      
      // Sort by date and take the first 5
      events.sort((a, b) => {
        const dateA = new Date(a.event_date || a.start_date || a.date);
        const dateB = new Date(b.event_date || b.start_date || b.date);
        return dateA - dateB;
      });
      
      setUpcomingEvents(events.slice(0, 5));
      
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const endpoints = [
        "activity/",
        "api/activity/",
        "dashboard/activity/"
      ];
      
      let activities = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          if (response.data) {
            if (Array.isArray(response.data)) {
              activities = response.data;
              break;
            } else if (response.data.results && Array.isArray(response.data.results)) {
              activities = response.data.results;
              break;
            }
          }
        } catch (error) {
          console.warn(`Could not fetch activity from ${endpoint}`, error);
        }
      }
      
      // If no activity data, create some generic ones based on users and events
      if (activities.length === 0) {
        console.log("No activity data found, generating placeholder activities");
        const placeholderActivities = generatePlaceholderActivities();
        setRecentActivity(placeholderActivities);
      } else {
        setRecentActivity(activities);
      }
      
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  const generatePlaceholderActivities = () => {
    const activities = [];
    
    // Add placeholder activities based on users and events
    if (stats.totalUsers > 0) {
      activities.push({
        type: 'user',
        message: `${stats.totalUsers} total users on the platform`,
        time: new Date().toLocaleString()
      });
    }
    
    if (stats.totalEvents > 0) {
      activities.push({
        type: 'event',
        message: `${stats.totalEvents} events have been created`,
        time: new Date().toLocaleString()
      });
    }
    
    if (stats.activeEvents > 0) {
      activities.push({
        type: 'event',
        message: `${stats.activeEvents} events are currently active`,
        time: new Date().toLocaleString()
      });
    }
    
    if (stats.pendingRequests > 0) {
      activities.push({
        type: 'user',
        message: `${stats.pendingRequests} coordinator requests pending approval`,
        time: new Date().toLocaleString()
      });
    }
    
    return activities;
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
      <DashboardOverview 
        stats={stats} 
        upcomingEvents={upcomingEvents} 
        recentActivity={recentActivity}
      />
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
      case "calendar":
        return <CalendarView />;
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
            { id: "calendar", icon: <FaCalendarAlt />, label: "Calendar" },
            { id: "profile", icon: <FaUserCog />, label: "My Profile" },
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
