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
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';
import api from "../../utils/api";
import styles from "../../assets/css/coordinator/coordinatorDashboard.module.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../utils/constants";
import "react-toastify/dist/ReactToastify.css";
import ProfileComponent from "./ProfileComponent";

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
      
      // Handle authentication errors
      if (error.response) {
        if (error.response.status === 401) {
          // Token expired, try to refresh
          try {
            const newToken = await handleTokenRefresh();
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            // Retry the request
            const retryResponse = await api.get("users/profile/");
            if (retryResponse.data) {
              setUserProfile(retryResponse.data);
              if (retryResponse.data.profile_photo) {
                const photoUrl = retryResponse.data.profile_photo;
                if (photoUrl.startsWith('http')) {
                  setProfilePhotoPreview(photoUrl);
                } else {
                  const baseUrl = process.env.REACT_APP_API_URL || '';
                  setProfilePhotoPreview(`${baseUrl}${photoUrl}`);
                }
              }
            }
          } catch (refreshError) {
            // Refresh token failed, redirect to login
            toast.error("Session expired. Please log in again.");
            navigate("/login_reg");
          }
        } else if (error.response.status === 403) {
          toast.error("You don't have permission to access this resource");
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
        const statsResponse = await api.get("events/coordinator-stats/");
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
        const eventsResponse = await api.get("events/coordinator-events/");
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
        setUpcomingEvents([]);
        messages.events = "Unable to fetch event data at this time.";
      }

      // Fetch event types data
      try {
        const typesResponse = await api.get("events/coordinator-event-types/");
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
        setEventTypeData([]);
        setHasEventTypeData(false);
        messages.eventTypes = "Unable to fetch event type data at this time.";
      }

      // Fetch attendance data
      try {
        const attendanceResponse = await api.get("events/coordinator-attendance/");
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
        setAttendanceData([]);
        setHasAttendanceData(false);
        messages.attendance = "Unable to fetch attendance data at this time.";
      }

      // Fetch revenue data
      try {
        const revenueResponse = await api.get("events/coordinator-revenue/");
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
        setRevenueData([]);
        setHasRevenueData(false);
        messages.revenue = "Unable to fetch revenue data at this time.";
      }

      // Fetch recent activity
      try {
        const activityResponse = await api.get("events/coordinator-activity/");
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
        setRecentActivity([]);
        setHasActivityData(false);
        messages.activity = "Unable to fetch activity data at this time.";
      }
      
      // Update all dashboard messages
      setDashboardMessages(messages);
      
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
        return <div>Events Management Component will go here</div>;
      case "reports":
        return <div>Reports Component will go here</div>;
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
      <div className={styles.messageBox}>
        <div className={styles.messageIcon}><FaInfoCircle /></div>
        <p>{message}</p>
      </div>
    );
  };

  // Render empty state component when no data is available
  const renderEmptyState = (message) => {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><FaExclamationTriangle /></div>
        <p>{message || "No data available"}</p>
      </div>
    );
  };

  const renderOverview = () => {
    const COLORS = ['#ff4a17', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
      <div>
        {!stats.hasRealData && (
          <div className={styles.welcomeMessage}>
            <h2>Welcome to your Coordinator Dashboard</h2>
            <p>Get started by creating your first event. Once you have events, you'll see statistics and analytics here.</p>
          </div>
        )}
      
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
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaDollarSign />
            </div>
            <div>
              <h3>Total Revenue</h3>
              <p>${stats.revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={styles.dashboardSections}>
          <div className={styles.analyticsSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Performance Analytics</h3>
            </div>
            
            {stats.hasRealData ? (
              <>
                <div className={styles.metricsGrid}>
                  <div className={styles.metricItem}>
                    <h4>Completion Rate</h4>
                    <p>{stats.completionRate}%</p>
                  </div>
                  <div className={styles.metricItem}>
                    <h4>Average Rating</h4>
                    <p>{stats.averageRating > 0 ? `${stats.averageRating}/5` : 'N/A'}</p>
                  </div>
                </div>
                
                <div className={styles.chartContainer}>
                  <h4 className={styles.chartTitle}>Attendance Growth</h4>
                  {renderMessage(dashboardMessages.attendance)}
                  {hasAttendanceData && attendanceData.length > 0 ? (
                    <div className={styles.analyticsChart}>
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
                
                <div className={styles.chartContainer}>
                  <h4 className={styles.chartTitle}>Revenue Over Time</h4>
                  {renderMessage(dashboardMessages.revenue)}
                  {hasRevenueData && revenueData.length > 0 ? (
                    <div className={styles.analyticsChart}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={revenueData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" name="Revenue ($)" fill="#ff4a17" />
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
          
          <div className={styles.recentActivity}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Recent Activity</h3>
            </div>
            
            {renderMessage(dashboardMessages.activity)}
            
            {hasActivityData && recentActivity.length > 0 ? (
              <ul className={styles.activityList}>
                {recentActivity.map((activity, index) => (
                  <li key={index} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>{activity.event}</p>
                      <span className={styles.activityTime}>{activity.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent activity</p>
            )}
            
            <div className={styles.chartContainer} style={{ marginTop: '30px' }}>
              <h4 className={styles.chartTitle}>Event Types</h4>
              {renderMessage(dashboardMessages.eventTypes)}
              {hasEventTypeData && eventTypeData.length > 0 ? (
                <div className={styles.analyticsChart}>
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

          <div className={styles.upcomingEvents}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Upcoming Events</h3>
              <a href="#" className={styles.viewAllLink} onClick={(e) => {
                e.preventDefault();
                setActiveTab("events");
              }}>
                View All
              </a>
            </div>
            
            {renderMessage(dashboardMessages.events)}
            
            {upcomingEvents.length > 0 ? (
              <ul className={styles.eventList}>
                {upcomingEvents.map((event, index) => (
                  <li key={index} className={styles.eventItem}>
                    <div className={styles.eventDate}>
                      <span className={styles.eventDay}>
                        {new Date(event.event_date || event.event_time).getDate()}
                      </span>
                      <span className={styles.eventMonth}>
                        {new Date(event.event_date || event.event_time).toLocaleString("default", {
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className={styles.eventContent}>
                      <h4 className={styles.eventTitle}>{event.title || event.event_name}</h4>
                      <p>{event.description?.substring(0, 100) || "No description"}...</p>
                      <div className={styles.eventInfo}>
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
              <div className={styles.noEvents}>
                <div className={styles.noEventsIcon}><FaCalendarAlt /></div>
                <p>No upcoming events found</p>
                {!stats.hasRealData && (
                  <button 
                    className={styles.createEventButton}
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
            <FaChartLine />
            <span>Dashboard</span>
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
          <div className={styles.loader}>
            <div className={styles.loaderSpinner}></div>
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