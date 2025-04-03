import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  FaUsers,
  FaCalendarAlt,
  FaFileInvoice,
  FaSignOutAlt,
  FaUserCog,
  FaChartLine,
  FaDollarSign,
  FaMapMarkerAlt,
  FaClock,
  FaBell,
  FaTicketAlt,
  FaCheckCircle,
  FaPercentage,
  FaUserCheck,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCalendarPlus,
  FaEye,
  FaEdit
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';
import api from "../../utils/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../utils/constants";
import "react-toastify/dist/ReactToastify.css";
import ProfileComponent from "./ProfileComponent";

// Import individual CSS modules
import sidebarStyles from "../../assets/css/coordinator/sidebarStyles.module.css";
import overviewStyles from "../../assets/css/coordinator/overviewTab.module.css";
import eventsStyles from "../../assets/css/coordinator/eventsTab.module.css";
import reportsStyles from "../../assets/css/coordinator/reportsTab.module.css";

const CoordinatorDashboard = () => {
  const [stats, setStats] = useState({
    managedEvents: 0,
    upcomingEvents: 0,
    totalAttendees: 0,
    completionRate: 0,
    averageRating: 0,
    revenue: 0,
    hasRealData: false
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [hasActivityData, setHasActivityData] = useState(false);
  const [eventTypeData, setEventTypeData] = useState([]);
  const [hasEventTypeData, setHasEventTypeData] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [hasAttendanceData, setHasAttendanceData] = useState(false);
  const [revenueData, setRevenueData] = useState([]);
  const [hasRevenueData, setHasRevenueData] = useState(false);
  const [hasEventsData, setHasEventsData] = useState(false);
  const [dashboardMessages, setDashboardMessages] = useState({
    events: '',
    eventTypes: '',
    attendance: '',
    revenue: '',
    activity: ''
  });
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

  // Handle token refresh for API requests
  const handleTokenRefresh = async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      
      const response = await api.post("token/refresh/", {
        refresh: refreshToken,
      });
      
      if (response.status === 200) {
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        return response.data.access;
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      // Force logout on token refresh failure
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
      localStorage.removeItem("user");
      navigate("/login_reg");
      throw error;
    }
  };

  const fetchUserProfile = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      navigate("/login_reg");
      return;
    }
    
    try {
      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Try multiple possible profile endpoints
      let response;
      let endpoints = [
        "users/profile/",
        "api/profile/",
        "api/users/me/",
        "auth/users/me/",
        "users/me/"
      ];
      
      // Try each endpoint until we get a successful response
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch profile from ${endpoint}`);
          response = await api.get(endpoint);
          if (response.data) {
            console.log(`Profile data fetched from ${endpoint}`);
            break;
          }
        } catch (error) {
          console.log(`Failed to fetch profile from ${endpoint}`, error.response?.status);
        }
      }
      
      if (!response || !response.data) {
        throw new Error("Failed to fetch profile from all known endpoints");
      }
      
      console.log("Profile data received:", response.data);
      
      // Extract user data from response
      const userData = response.data;
      
      // Create a complete user profile object with all possible fields
      const fullUserProfile = {
        id: userData.id,
        username: userData.username || "",
        email: userData.email || "",
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        phone: userData.phone || "",
        profile_photo: userData.profile_photo || null,
        user_role: userData.user_role || userData.role || "", // Try both field names
        created_at: userData.created_at || "",
        updated_at: userData.updated_at || ""
      };
      
      // Set the user profile with all fields
      setUserProfile(fullUserProfile);
      
      // Try to determine user role if not in profile data
      if (!fullUserProfile.user_role) {
        try {
          const decoded = jwtDecode(token);
          fullUserProfile.user_role = decoded.user_role || decoded.role || "coordinator";
          setUserProfile(prev => ({...prev, user_role: fullUserProfile.user_role}));
        } catch (e) {
          console.warn("Could not extract role from token", e);
        }
      }
      
      // Handle profile photo
      if (userData.profile_photo) {
        // Handle both relative and absolute URLs
        const photoUrl = userData.profile_photo;
        if (photoUrl.startsWith('http')) {
          setProfilePhotoPreview(photoUrl);
        } else {
          // Join with API base URL for relative paths
          const baseUrl = process.env.REACT_APP_API_URL || api.defaults.baseURL || '';
          setProfilePhotoPreview(`${baseUrl}${photoUrl}`);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error.message);
      
      // Handle authentication errors
      if (error.response) {
        if (error.response.status === 401) {
          // Token expired, try to refresh
          try {
            const newToken = await handleTokenRefresh();
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            
            // Create a fallback profile from JWT token
            const decoded = jwtDecode(newToken);
            const fallbackProfile = {
              username: decoded.username || "",
              email: decoded.email || "",
              first_name: decoded.first_name || "",
              last_name: decoded.last_name || "",
              user_role: decoded.user_role || decoded.role || "coordinator"
            };
            
            setUserProfile(fallbackProfile);
            
          } catch (refreshError) {
            // Refresh token failed, redirect to login
            toast.error("Session expired. Please log in again.");
            navigate("/login_reg");
          }
        } else if (error.response.status === 403) {
          toast.error("You don't have permission to access this resource");
        } else if (error.response.status === 400) {
          toast.error("Bad request when fetching profile data");
          console.error("Bad request details:", error.response.data);
        } else {
          toast.error("Error loading profile data");
        }
      } else {
        toast.error("Error connecting to the server");
      }
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
    // Update the profile photo preview if it changed
    if (updatedProfile.profile_photo) {
      const photoUrl = updatedProfile.profile_photo;
      if (photoUrl.startsWith('http')) {
        setProfilePhotoPreview(photoUrl);
      } else {
        const baseUrl = process.env.REACT_APP_API_URL || '';
        setProfilePhotoPreview(`${baseUrl}${photoUrl}`);
      }
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
      
      // Set authorization header for all subsequent requests
      api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`;
      
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
      const messages = { ...dashboardMessages };
      
      // Ensure auth header is set for all requests
      const token = localStorage.getItem(ACCESS_TOKEN);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Try to fetch coordinator statistics
      try {
        console.log("Fetching coordinator stats...");
        const statsResponse = await api.get("events/coordinator-stats");
        console.log("Stats response:", statsResponse.status, statsResponse.data);
        
        if (statsResponse.data) {
          setStats({
            managedEvents: statsResponse.data.managed_events || 0,
            upcomingEvents: statsResponse.data.upcoming_events || 0,
            totalAttendees: statsResponse.data.total_attendees || 0,
            completionRate: statsResponse.data.completion_rate || 0,
            averageRating: statsResponse.data.average_rating || 0,
            revenue: statsResponse.data.revenue || 0,
            hasRealData: statsResponse.data.has_real_data || false
          });
          
          // Set flag for if we have any events data at all
          setHasEventsData(statsResponse.data.has_real_data || false);
          
          if (!statsResponse.data.has_real_data) {
            messages.events = "No events have been created yet. Start by creating your first event.";
          }
        }
      } catch (error) {
        console.warn("Could not fetch coordinator stats:", error);
        console.warn("Error details:", error.response?.data || error.message);
        setStats({
          managedEvents: 0,
          upcomingEvents: 0,
          totalAttendees: 0,
          completionRate: 0,
          averageRating: 0,
          revenue: 0,
          hasRealData: false
        });
        messages.events = "Unable to fetch event statistics at this time.";
      }
      
      // Fetch upcoming events managed by this coordinator
      try {
        console.log("Fetching coordinator events...");
        const eventsResponse = await api.get("events/coordinator-events");
        console.log("Events response:", eventsResponse.status, eventsResponse.data);
        
        if (eventsResponse.data) {
          if (eventsResponse.data.has_real_data && eventsResponse.data.events) {
            setUpcomingEvents(eventsResponse.data.events.slice(0, 5)); // Show the first 5 events
          } else {
            setUpcomingEvents([]);
            if (!messages.events) {
              messages.events = "No upcoming events found. Create an event to get started.";
            }
          }
        }
      } catch (error) {
        console.warn("Could not fetch coordinator events:", error);
        console.warn("Error details:", error.response?.data || error.message);
        setUpcomingEvents([]);
        messages.events = "Unable to fetch event data at this time.";
      }

      // Fetch event types data
      try {
        console.log("Fetching event types...");
        const typesResponse = await api.get("events/coordinator-event-types");
        console.log("Event types response:", typesResponse.status, typesResponse.data);
        
        if (typesResponse.data) {
          if (typesResponse.data.has_real_data && typesResponse.data.data && typesResponse.data.data.length > 0) {
            setEventTypeData(typesResponse.data.data);
            setHasEventTypeData(true);
          } else {
            setEventTypeData([]);
            setHasEventTypeData(false);
            messages.eventTypes = typesResponse.data.note || "No event type data available yet.";
          }
        }
      } catch (error) {
        console.warn("Could not fetch event types:", error);
        console.warn("Error details:", error.response?.data || error.message);
        setEventTypeData([]);
        setHasEventTypeData(false);
        messages.eventTypes = "Unable to fetch event type data at this time.";
      }

      // Fetch attendance data
      try {
        console.log("Fetching attendance data...");
        const attendanceResponse = await api.get("events/coordinator-attendance");
        console.log("Attendance response:", attendanceResponse.status, attendanceResponse.data);
        
        if (attendanceResponse.data) {
          if (attendanceResponse.data.has_real_data && attendanceResponse.data.data) {
            setAttendanceData(attendanceResponse.data.data);
            setHasAttendanceData(true);
            if (attendanceResponse.data.note) {
              messages.attendance = attendanceResponse.data.note;
            }
          } else {
            setAttendanceData([]);
            setHasAttendanceData(false);
            messages.attendance = attendanceResponse.data.note || "No attendance data available yet.";
          }
        }
      } catch (error) {
        console.warn("Could not fetch attendance data:", error);
        console.warn("Error details:", error.response?.data || error.message);
        setAttendanceData([]);
        setHasAttendanceData(false);
        messages.attendance = "Unable to fetch attendance data at this time.";
      }

      // Fetch revenue data
      try {
        console.log("Fetching revenue data...");
        const revenueResponse = await api.get("events/coordinator-revenue");
        console.log("Revenue response:", revenueResponse.status, revenueResponse.data);
        
        if (revenueResponse.data) {
          if (revenueResponse.data.has_real_data && revenueResponse.data.data) {
            setRevenueData(revenueResponse.data.data);
            setHasRevenueData(true);
            if (revenueResponse.data.note) {
              messages.revenue = revenueResponse.data.note;
            }
          } else {
            setRevenueData([]);
            setHasRevenueData(false);
            messages.revenue = revenueResponse.data.note || "No revenue data available yet.";
          }
        }
      } catch (error) {
        console.warn("Could not fetch revenue data:", error);
        console.warn("Error details:", error.response?.data || error.message);
        setRevenueData([]);
        setHasRevenueData(false);
        messages.revenue = "Unable to fetch revenue data at this time.";
      }

      // Fetch recent activity
      try {
        console.log("Fetching activity data...");
        const activityResponse = await api.get("events/coordinator-activity");
        console.log("Activity response:", activityResponse.status, activityResponse.data);
        
        if (activityResponse.data) {
          if (activityResponse.data.has_real_data && activityResponse.data.data) {
            setRecentActivity(activityResponse.data.data);
            setHasActivityData(activityResponse.data.data.length > 0);
            if (activityResponse.data.note) {
              messages.activity = activityResponse.data.note;
            }
          } else {
            setRecentActivity([]);
            setHasActivityData(false);
            messages.activity = activityResponse.data.note || "No recent activity found.";
          }
        }
      } catch (error) {
        console.warn("Could not fetch recent activity:", error);
        console.warn("Error details:", error.response?.data || error.message);
        setRecentActivity([]);
        setHasActivityData(false);
        messages.activity = "Unable to fetch activity data at this time.";
      }
      
      // Update all dashboard messages
      setDashboardMessages(messages);
      console.log("Dashboard data fetched successfully");
      
    } catch (error) {
      toast.error("Error loading dashboard data");
      console.error("Dashboard data fetch error:", error);
      console.error("Error details:", error.response?.data || error.message);
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

  // Helper function to get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'registration':
        return <FaUserCheck />;
      case 'feedback':
        return <FaCheckCircle />;
      case 'payment':
        return <FaDollarSign />;
      case 'update':
        return <FaBell />;
      default:
        return <FaCalendarAlt />;
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "events":
        return renderEventsTab();
      case "reports":
        return renderReportsTab();
      case "profile":
        return <ProfileComponent 
                userProfile={userProfile} 
                onProfileUpdate={handleProfileUpdate} 
              />;
      default:
        return renderOverview();
    }
  };

  // Render message with appropriate styling
  const renderMessage = (message) => {
    if (!message) return null;
    
    return (
      <div className={overviewStyles.messageBox}>
        <div className={overviewStyles.messageIcon}><FaInfoCircle /></div>
        <p>{message}</p>
      </div>
    );
  };

  // Render empty state component when no data is available
  const renderEmptyState = (message) => {
    return (
      <div className={overviewStyles.emptyState}>
        <div className={overviewStyles.emptyIcon}><FaExclamationTriangle /></div>
        <p>{message || "No data available"}</p>
      </div>
    );
  };

  // Format currency to Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderOverview = () => {
    const COLORS = ['#ff4a17', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
      <div>
        <div className={overviewStyles.welcomeMessage}>
          <h2>Welcome to your Coordinator Dashboard</h2>
          <p>Get started by creating your first event. Once you have events, you'll see statistics and analytics here.</p>
          {loading ? (
            <div className={overviewStyles.loadingMessage}>
              <p>Loading your dashboard data...</p>
            </div>
          ) : !stats.hasRealData ? (
            <div className={overviewStyles.noDataMessage}>
              <p>No event data found. You can start by creating your first event.</p>
              <button 
                className={overviewStyles.createEventButton}
                onClick={() => setActiveTab("events")}
              >
                Create Your First Event
              </button>
            </div>
          ) : null}
        </div>
      
        <div className={overviewStyles.statsGrid}>
          <div className={overviewStyles.statCard}>
            <div className={overviewStyles.statIcon}>
              <FaCalendarAlt />
            </div>
            <div>
              <h3>Managed Events</h3>
              <p>{stats.managedEvents}</p>
            </div>
          </div>
          <div className={overviewStyles.statCard}>
            <div className={overviewStyles.statIcon}>
              <FaCalendarAlt />
            </div>
            <div>
              <h3>Upcoming Events</h3>
              <p>{stats.upcomingEvents}</p>
            </div>
          </div>
          <div className={overviewStyles.statCard}>
            <div className={overviewStyles.statIcon}>
              <FaUsers />
            </div>
            <div>
              <h3>Total Attendees</h3>
              <p>{stats.totalAttendees}</p>
            </div>
          </div>
          <div className={overviewStyles.statCard}>
            <div className={overviewStyles.statIcon}>
              <FaDollarSign />
            </div>
            <div>
              <h3>Total Revenue</h3>
              <p>{formatCurrency(stats.revenue)}</p>
            </div>
          </div>
        </div>

        <div className={overviewStyles.dashboardSections}>
          <div className={overviewStyles.analyticsSection}>
            <div className={overviewStyles.sectionHeader}>
              <h3 className={overviewStyles.sectionTitle}>Performance Analytics</h3>
            </div>
            
            {stats.hasRealData ? (
              <>
                <div className={overviewStyles.metricsGrid}>
                  <div className={overviewStyles.metricItem}>
                    <h4>Completion Rate</h4>
                    <p>{stats.completionRate}%</p>
                  </div>
                  <div className={overviewStyles.metricItem}>
                    <h4>Average Rating</h4>
                    <p>{stats.averageRating > 0 ? `${stats.averageRating}/5` : 'N/A'}</p>
                  </div>
                </div>
                
                <div className={overviewStyles.chartContainer}>
                  <h4 className={overviewStyles.chartTitle}>Attendance Growth</h4>
                  {renderMessage(dashboardMessages.attendance)}
                  {hasAttendanceData && attendanceData.length > 0 ? (
                    <div className={overviewStyles.analyticsChart}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={attendanceData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="value" stroke="#ff4a17" name="Attendance" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    renderEmptyState("No attendance data available yet")
                  )}
                </div>
                
                <div className={overviewStyles.chartContainer}>
                  <h4 className={overviewStyles.chartTitle}>Revenue Over Time</h4>
                  {renderMessage(dashboardMessages.revenue)}
                  {hasRevenueData && revenueData.length > 0 ? (
                    <div className={overviewStyles.analyticsChart}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={revenueData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="value" name="Revenue (₹)" fill="#ff4a17" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    renderEmptyState("No revenue data available yet")
                  )}
                </div>
              </>
            ) : (
              renderEmptyState(dashboardMessages.events || "No event data available yet")
            )}
          </div>
          
          <div className={overviewStyles.recentActivity}>
            <div className={overviewStyles.sectionHeader}>
              <h3 className={overviewStyles.sectionTitle}>Recent Activity</h3>
            </div>
            
            {renderMessage(dashboardMessages.activity)}
            
            {hasActivityData && recentActivity.length > 0 ? (
              <ul className={overviewStyles.activityList}>
                {recentActivity.map((activity, index) => (
                  <li key={index} className={overviewStyles.activityItem}>
                    <div className={overviewStyles.activityIcon}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className={overviewStyles.activityContent}>
                      <p className={overviewStyles.activityText}>{activity.event}</p>
                      <span className={overviewStyles.activityTime}>{activity.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent activity</p>
            )}
            
            <div className={overviewStyles.chartContainer} style={{ marginTop: '30px' }}>
              <h4 className={overviewStyles.chartTitle}>Event Types</h4>
              {renderMessage(dashboardMessages.eventTypes)}
              {hasEventTypeData && eventTypeData.length > 0 ? (
                <div className={overviewStyles.analyticsChart}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={eventTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {eventTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                renderEmptyState("No event type data available yet")
              )}
            </div>
          </div>

          <div className={overviewStyles.upcomingEvents}>
            <div className={overviewStyles.sectionHeader}>
              <h3 className={overviewStyles.sectionTitle}>Upcoming Events</h3>
              <a href="#" className={overviewStyles.viewAllLink} onClick={(e) => {
                e.preventDefault();
                setActiveTab("events");
              }}>
                View All
              </a>
            </div>
            
            {renderMessage(dashboardMessages.events)}
            
            {upcomingEvents.length > 0 ? (
              <ul className={overviewStyles.eventList}>
                {upcomingEvents.map((event, index) => (
                  <li key={index} className={overviewStyles.eventItem}>
                    <div className={overviewStyles.eventDate}>
                      <span className={overviewStyles.eventDay}>
                        {new Date(event.event_date || event.event_time).getDate()}
                      </span>
                      <span className={overviewStyles.eventMonth}>
                        {new Date(event.event_date || event.event_time).toLocaleString("default", {
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className={overviewStyles.eventContent}>
                      <h4 className={overviewStyles.eventTitle}>{event.title || event.event_name}</h4>
                      <p>{event.description?.substring(0, 100) || "No description"}...</p>
                      <div className={overviewStyles.eventInfo}>
                        <span>
                          <FaUsers /> {event.attendee_count || 0} Attendees
                        </span>
                        <span>
                          <FaMapMarkerAlt /> {event.venue || "TBD"}
                        </span>
                        <span>
                          <FaClock /> {new Date(event.event_date || event.event_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={overviewStyles.noEvents}>
                <div className={overviewStyles.noEventsIcon}><FaCalendarAlt /></div>
                <p>No upcoming events found</p>
                {!stats.hasRealData && (
                  <button 
                    className={overviewStyles.createEventButton}
                    onClick={() => setActiveTab("events")}
                  >
                    Create Your First Event
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEventsTab = () => {
    return (
      <div className={eventsStyles.eventsTabContainer}>
        <div className={eventsStyles.sectionHeader}>
          <h3 className={eventsStyles.sectionTitle}>Your Events</h3>
          <button 
            className={eventsStyles.createEventButton}
            onClick={() => navigate('/create-event')}
          >
            <FaCalendarPlus /> Create New Event
          </button>
        </div>

        {loading ? (
          <div className={eventsStyles.loadingEvents}>
            <div className={eventsStyles.loaderSpinner}></div>
            <p>Loading events...</p>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className={eventsStyles.eventsList}>
            <div className={eventsStyles.eventsListHeader}>
              <div className={eventsStyles.eventHeaderCell} style={{width: '40%'}}>Event Name</div>
              <div className={eventsStyles.eventHeaderCell} style={{width: '20%'}}>Date</div>
              <div className={eventsStyles.eventHeaderCell} style={{width: '15%'}}>Attendees</div>
              <div className={eventsStyles.eventHeaderCell} style={{width: '15%'}}>Status</div>
              <div className={eventsStyles.eventHeaderCell} style={{width: '10%'}}>Actions</div>
            </div>
            
            {upcomingEvents.map((event, index) => (
              <div key={event.id || index} className={eventsStyles.eventRow}>
                <div className={eventsStyles.eventCell} style={{width: '40%'}}>
                  <div className={eventsStyles.eventName}>{event.event_name}</div>
                  <div className={eventsStyles.eventVenue}>{event.venue || 'No venue specified'}</div>
                </div>
                <div className={eventsStyles.eventCell} style={{width: '20%'}}>
                  {new Date(event.event_time).toLocaleDateString('en-IN', {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className={eventsStyles.eventCell} style={{width: '15%'}}>
                  {event.attendee_count || 0} / {event.max_participants || '∞'}
                </div>
                <div className={eventsStyles.eventCell} style={{width: '15%'}}>
                  <span className={`${eventsStyles.statusBadge} ${eventsStyles[event.status]}`}>
                    {event.status}
                  </span>
                </div>
                <div className={eventsStyles.eventCell} style={{width: '10%'}}>
                  <div className={eventsStyles.actionButtons}>
                    <button 
                      className={eventsStyles.actionButton} 
                      title="View Details"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <FaEye />
                    </button>
                    <button 
                      className={eventsStyles.actionButton} 
                      title="Edit Event"
                      onClick={() => navigate(`/edit-event/${event.id}`)}
                    >
                      <FaEdit />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={eventsStyles.noEvents}>
            <div className={eventsStyles.noEventsIcon}>
              <FaCalendarAlt />
            </div>
            <p>You haven't created any events yet.</p>
            <button 
              className={eventsStyles.createEventButton}
              onClick={() => navigate('/create-event')}
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderReportsTab = () => {
    return (
      <div className={reportsStyles.reportsTabContainer}>
        <div className={reportsStyles.sectionHeader}>
          <h3 className={reportsStyles.sectionTitle}>Reports & Analytics</h3>
          <button 
            className={reportsStyles.generateReportButton}
            onClick={() => generateReport()}
          >
            <FaFileInvoice /> Generate Report
          </button>
        </div>

        {loading ? (
          <div className={reportsStyles.loadingReports}>
            <div className={reportsStyles.loaderSpinner}></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <div className={reportsStyles.reportsGrid}>
            {/* Attendance Chart Section */}
            <div className={reportsStyles.reportCard}>
              <h4 className={reportsStyles.reportTitle}>Attendance Trends</h4>
              {hasAttendanceData ? (
                <div className={reportsStyles.reportChart}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={attendanceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" name="Participants" stroke="#ff4a17" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={reportsStyles.noReportData}>
                  <p>No attendance data available yet</p>
                </div>
              )}
            </div>

            {/* Revenue Chart Section */}
            <div className={reportsStyles.reportCard}>
              <h4 className={reportsStyles.reportTitle}>Revenue Analysis</h4>
              {hasRevenueData ? (
                <div className={reportsStyles.reportChart}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={revenueData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="value" name="Revenue (₹)" fill="#ff4a17" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={reportsStyles.noReportData}>
                  <p>No revenue data available yet</p>
                </div>
              )}
            </div>

            {/* Event Types Section */}
            <div className={reportsStyles.reportCard}>
              <h4 className={reportsStyles.reportTitle}>Event Type Distribution</h4>
              {hasEventTypeData ? (
                <div className={reportsStyles.reportChart}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={eventTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {eventTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={reportsStyles.noReportData}>
                  <p>No event type data available yet</p>
                </div>
              )}
            </div>

            {/* Performance Metrics Section */}
            <div className={reportsStyles.reportCard}>
              <h4 className={reportsStyles.reportTitle}>Performance Metrics</h4>
              <div className={reportsStyles.metricsGrid}>
                <div className={reportsStyles.metricItem}>
                  <div className={reportsStyles.metricIcon}><FaUserCheck /></div>
                  <div className={reportsStyles.metricContent}>
                    <h5>Total Attendees</h5>
                    <p>{stats.totalAttendees}</p>
                  </div>
                </div>
                <div className={reportsStyles.metricItem}>
                  <div className={reportsStyles.metricIcon}><FaPercentage /></div>
                  <div className={reportsStyles.metricContent}>
                    <h5>Completion Rate</h5>
                    <p>{stats.completionRate}%</p>
                  </div>
                </div>
                <div className={reportsStyles.metricItem}>
                  <div className={reportsStyles.metricIcon}><FaCheckCircle /></div>
                  <div className={reportsStyles.metricContent}>
                    <h5>Average Rating</h5>
                    <p>{stats.averageRating > 0 ? `${stats.averageRating}/5` : 'N/A'}</p>
                  </div>
                </div>
                <div className={reportsStyles.metricItem}>
                  <div className={reportsStyles.metricIcon}><FaDollarSign /></div>
                  <div className={reportsStyles.metricContent}>
                    <h5>Total Revenue</h5>
                    <p>{formatCurrency(stats.revenue)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Function to generate a detailed report
  const generateReport = () => {
    toast.info("Generating report. This feature will be available soon!");
  };

  return (
    <div className={sidebarStyles.dashboardContainer}>
      <ToastContainer />
      <div className={sidebarStyles.sidebar}>
        <div className={sidebarStyles.sidebarHeader}>
          {profilePhotoPreview ? (
            <img
              src={profilePhotoPreview}
              alt="Profile"
              className={sidebarStyles.userAvatar}
            />
          ) : (
            <div className={sidebarStyles.userAvatarPlaceholder}>
              <span>
                {userProfile.first_name ? userProfile.first_name.charAt(0).toUpperCase() : ''}
                {userProfile.last_name ? userProfile.last_name.charAt(0).toUpperCase() : ''}
              </span>
            </div>
          )}
          <h2>EventSphere</h2>
        </div>
        <div className={sidebarStyles.nav}>
          <button
            className={`${sidebarStyles.navButton} ${
              activeTab === "overview" ? sidebarStyles.active : ""
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <FaChartLine />
            <span>Dashboard</span>
          </button>
          <button
            className={`${sidebarStyles.navButton} ${
              activeTab === "events" ? sidebarStyles.active : ""
            }`}
            onClick={() => setActiveTab("events")}
          >
            <FaCalendarAlt />
            <span>Events</span>
          </button>
          <button
            className={`${sidebarStyles.navButton} ${
              activeTab === "reports" ? sidebarStyles.active : ""
            }`}
            onClick={() => setActiveTab("reports")}
          >
            <FaFileInvoice />
            <span>Reports</span>
          </button>
          <button
            className={`${sidebarStyles.navButton} ${
              activeTab === "profile" ? sidebarStyles.active : ""
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <FaUserCog />
            <span>Profile</span>
          </button>
          <button className={sidebarStyles.logoutButton} onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </div>
      <main className={sidebarStyles.main}>
        <h1>Coordinator Dashboard</h1>
        {loading ? (
          <div className={sidebarStyles.loader}>
            <div className={sidebarStyles.loaderSpinner}></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          renderTab()
        )}
      </main>
    </div>
  );
};

export default CoordinatorDashboard; 