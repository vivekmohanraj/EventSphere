import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  FaUserCircle,
  FaCalendarAlt,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaChartPie,
  FaUsers,
  FaUserCheck,
  FaFileAlt,
  FaEllipsisH,
  FaTimes,
  FaCalendarCheck,
  FaCalendarTimes,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCheck,
  FaClock,
  FaPen,
  FaTrashAlt,
  FaFilter,
  FaEye,
  FaPlus,
  FaSort,
  FaSearch,
  FaFileExport,
  FaTrash,
  FaFileInvoiceDollar,
  FaExchangeAlt,
  FaDollarSign,
  FaCheckCircle,
  FaTicketAlt,
  FaMoneyBill,
  FaChartLine,
  FaPercentage,
  FaEdit,
  FaExclamationTriangle,
  FaInfoCircle,
  FaBan,
  FaStar,
  FaCalendarDay,
  FaUserFriends,
  FaCalendarPlus,
  FaFileInvoice,
  FaUserCog,
  FaComment,
  FaUser,
  FaArrowUp,
  FaArrowDown,
  FaPhone,
  FaEnvelope
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import Modal from "react-bootstrap/Modal";
import api from "../../utils/api";
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../utils/constants";
import "react-toastify/dist/ReactToastify.css";
import ProfileComponent from "./ProfileComponent";

// Import individual CSS modules
import sidebarStyles from "../../assets/css/coordinator/sidebarStyles.module.css";
import overviewStyles from "../../assets/css/coordinator/overviewTab.module.css";
import eventsStyles from "../../assets/css/coordinator/eventsTab.module.css";
import reportsStyles from "../../assets/css/coordinator/reportsTab.module.css";
import paymentsStyles from "../../assets/css/coordinator/paymentsTab.module.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

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
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
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

  // States for Events Tab management
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [venueFilter, setVenueFilter] = useState('');
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventStats, setEventStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    canceled: 0,
    mostPopular: null
  });
  
  // States for Payments Tab - moved from renderPaymentsTab for React hooks compliance
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchPaymentTerm, setSearchPaymentTerm] = useState('');
  const [paymentDateFilter, setPaymentDateFilter] = useState({ from: '', to: '' });
  const [filteredPayments, setFilteredPayments] = useState([]);
  
  // Add this with the other state variables
  const [reportsFilter, setReportsFilter] = useState({
    dateRange: 'last30',
    eventType: 'all'
  });
  
  // Add state for credit card payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    eventId: '',
    amount: '',
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    email: '',
    phone: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchStats();
    fetchUserProfile();
  }, []);

  // Events Tab data fetching effect
  useEffect(() => {
    const fetchEvents = async () => {
      if (activeTab === "events") {
        setIsLoadingEvents(true);
        try {
          // Try different endpoints to get coordinator events
          let eventsData = [];
          try {
            const response = await api.get("events/coordinator-events");
            if (response.data?.events) {
              eventsData = response.data.events;
            }
          } catch (error) {
            console.warn("Could not fetch from coordinator-events endpoint:", error);
            
            // Try alternative endpoint
            try {
              const altResponse = await api.get("events/events/");
              eventsData = altResponse.data;
            } catch (altError) {
              console.error("Could not fetch events from alternate endpoint:", altError);
            }
          }
          
          // Process events data
          setEvents(eventsData);
          setFilteredEvents(eventsData);
          
          // Calculate event statistics
          if (eventsData.length > 0) {
            const stats = {
              total: eventsData.length,
              upcoming: eventsData.filter(e => e.status === 'upcoming').length,
              completed: eventsData.filter(e => e.status === 'completed').length,
              canceled: eventsData.filter(e => e.status === 'canceled' || e.status === 'cancelled').length,
              mostPopular: [...eventsData].sort((a, b) => (b.attendee_count || 0) - (a.attendee_count || 0))[0]
            };
            setEventStats(stats);
          }
          
        } catch (error) {
          console.error("Error fetching events:", error);
          toast.error("Failed to load events");
        } finally {
          setIsLoadingEvents(false);
        }
      }
    };
    
    fetchEvents();
  }, [activeTab]);
  
  // Apply filters and sorting whenever filter criteria change
  useEffect(() => {
    let filtered = [...events];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(event => event.status === filterStatus);
    }
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        (event.event_name && event.event_name.toLowerCase().includes(term)) || 
        (event.description && event.description.toLowerCase().includes(term)) ||
        (event.venue && event.venue.toLowerCase().includes(term))
      );
    }
    
    // Apply date range filter
    if (dateFilter.from) {
      const fromDate = new Date(dateFilter.from);
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.event_time);
        return eventDate >= fromDate;
      });
    }
    
    if (dateFilter.to) {
      const toDate = new Date(dateFilter.to);
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.event_time);
        return eventDate <= toDate;
      });
    }
    
    // Apply venue filter
    if (venueFilter) {
      filtered = filtered.filter(event => 
        event.venue && event.venue.toLowerCase().includes(venueFilter.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.event_name || '').localeCompare(b.event_name || '');
          break;
        case 'date':
          comparison = new Date(a.event_time) - new Date(b.event_time);
          break;
        case 'attendees':
          comparison = (a.attendee_count || 0) - (b.attendee_count || 0);
          break;
        case 'created':
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        default:
          comparison = new Date(a.event_time) - new Date(b.event_time);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredEvents(filtered);
  }, [events, filterStatus, searchTerm, sortBy, sortOrder, dateFilter, venueFilter]);

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

      // Fetch payments data
      try {
        console.log("Fetching payments data...");
        setPaymentsLoading(true);
        
        // First get the coordinator's events to ensure we only show payments for their events
        // This will help us filter payments more accurately
        const myEventsResponse = await api.get("events/events/?created_by=me");
        console.log("My events response:", myEventsResponse.status, myEventsResponse.data);
        
        const myEventIds = myEventsResponse.data.map(event => event.id);
        
        // Get all payments that are event_registration type (not event_creation)
        const paymentsResponse = await api.get("payments/payments/?payment_type=event_registration");
        console.log("Payments response:", paymentsResponse.status, paymentsResponse.data);
        
        if (paymentsResponse.data && Array.isArray(paymentsResponse.data)) {
          // Process the payment data - only keep payments for events created by this coordinator
          const paymentsWithDetails = await Promise.all(
            paymentsResponse.data
              .filter(payment => {
                // If payment has event ID as a number, check if it's in myEventIds
                if (payment.event && typeof payment.event === 'number') {
                  return myEventIds.includes(payment.event);
                }
                // If payment has event as an object, check the ID
                else if (payment.event && typeof payment.event === 'object' && payment.event.id) {
                  return myEventIds.includes(payment.event.id);
                }
                return false;
              })
              .map(async (payment) => {
                // Skip payments made by the coordinator themselves
                if (payment.payment_type === 'event_creation') {
                  return null;
                }
                
                // If we already have event details as an object, just return the payment
                if (payment.event && typeof payment.event === 'object') {
                  return payment;
                }
                
                // Otherwise fetch event details
                try {
                  if (payment.event && typeof payment.event === 'number') {
                    const eventResponse = await api.get(`events/events/${payment.event}/`);
                    if (eventResponse.data) {
                      return {
                        ...payment,
                        event: eventResponse.data
                      };
                    }
                  }
                  return payment;
                } catch (err) {
                  console.warn(`Could not fetch details for event ID ${payment.event}:`, err);
                  return payment;
                }
              })
          );
          
          // Filter out null values and undefined (payments made by coordinator themselves)
          const filteredPayments = paymentsWithDetails.filter(p => p !== null);
          setPayments(filteredPayments);
          setFilteredPayments(filteredPayments);
        }
      } catch (error) {
        console.warn("Could not fetch payments data:", error);
        console.warn("Error details:", error.response?.data || error.message);
        setPayments([]);
        setFilteredPayments([]);
      } finally {
        setPaymentsLoading(false);
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
      case "payments":
        return renderPaymentsTab();
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
                      {/* Recharts LineChart replaced with ChartJS Line component */}
                      <Line
                        data={{
                          labels: attendanceData.map(item => item.name),
                          datasets: [
                            {
                              label: "Attendance",
                              data: attendanceData.map(item => item.value),
                              backgroundColor: "#ff4a17",
                              borderColor: "#ff4a17",
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
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
                      {/* Recharts BarChart replaced with ChartJS Bar component */}
                      <Bar
                        data={{
                          labels: revenueData.map(item => item.name),
                          datasets: [
                            {
                              label: "Revenue (₹)",
                              data: revenueData.map(item => item.value),
                              backgroundColor: "#ff4a17",
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: (value) => `₹${value}`
                              }
                            }
                          }
                        }}
                      />
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
                  {/* Recharts PieChart replaced with ChartJS Pie component */}
                  <Pie
                    data={{
                      labels: eventTypeData.map(item => item.name),
                      datasets: [
                        {
                          data: eventTypeData.map(item => item.value),
                          backgroundColor: COLORS,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${percentage}%`;
                            }
                          }
                        },
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
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
    // Handle batch selection
    const handleSelectAll = (e) => {
      if (e.target.checked) {
        setSelectedEvents(filteredEvents.map(event => event.id));
        setShowBatchActions(true);
      } else {
        setSelectedEvents([]);
        setShowBatchActions(false);
      }
    };
    
    const handleSelectEvent = (eventId) => {
      setSelectedEvents(prev => {
        const isSelected = prev.includes(eventId);
        const newSelection = isSelected 
          ? prev.filter(id => id !== eventId) 
          : [...prev, eventId];
        
        // Show/hide batch actions based on selection
        setShowBatchActions(newSelection.length > 0);
        return newSelection;
      });
    };
    
    // Handle batch actions
    const handleBatchAction = async (action) => {
      if (selectedEvents.length === 0) {
        toast.warning("No events selected");
        return;
      }
      
      try {
        switch (action) {
          case 'cancel':
            // Confirm before canceling events
            if (window.confirm(`Are you sure you want to cancel ${selectedEvents.length} event(s)?`)) {
              // Process each selected event
              const cancelPromises = selectedEvents.map(eventId => 
                api.patch(`events/events/${eventId}/`, { status: 'canceled' })
              );
              
              try {
                await Promise.all(cancelPromises);
                toast.success(`${selectedEvents.length} event(s) marked as canceled`);
                
                // Update local state for immediate UI feedback
                setEvents(prev => prev.map(event => 
                  selectedEvents.includes(event.id) 
                    ? {...event, status: 'canceled'} 
                    : event
                ));
                
                // Clear selection after action
                setSelectedEvents([]);
                setShowBatchActions(false);
              } catch (error) {
                console.error("Error canceling events:", error);
                toast.error("Some events could not be canceled");
              }
            }
            break;
            
          case 'export':
            // Export selected events to CSV (simplified example)
            const selectedEventData = events.filter(event => selectedEvents.includes(event.id));
            const csvContent = "data:text/csv;charset=utf-8," 
              + "Event Name,Date,Venue,Attendees,Status\n"
              + selectedEventData.map(event => 
                  `"${event.event_name}",`
                  + `"${new Date(event.event_time).toLocaleString()}",`
                  + `"${event.venue || 'N/A'}",`
                  + `"${event.attendee_count || 0}",`
                  + `"${event.status}"`
                ).join("\n");
                
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "selected_events.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success(`Exported ${selectedEvents.length} event(s) to CSV`);
            break;
            
          case 'reminder':
            // In a real app, this would send reminders to event attendees
            toast.success(`Reminder emails will be sent to attendees of ${selectedEvents.length} event(s)`);
            break;
          
          default:
            toast.error("Action not implemented");
        }
      } catch (error) {
        console.error(`Error performing batch action '${action}':`, error);
        toast.error("Failed to perform action on selected events");
      }
    };
    
    // Helper to update status of a single event
    const updateEventStatus = async (eventId, newStatus) => {
      try {
        setIsLoadingEvents(true);
        
        // Make an actual API call to update the event in the backend
        await api.patch(`events/events/${eventId}/`, { 
          status: newStatus 
        });
        
        // Update local state for immediate UI feedback
        setEvents(prev => prev.map(event => 
          event.id === eventId ? {...event, status: newStatus} : event
        ));
        
        toast.success(`Event status updated to ${newStatus}`);
      } catch (error) {
        console.error("Error updating event status:", error);
        toast.error("Failed to update event status: " + (error.response?.data?.detail || error.message));
      } finally {
        setIsLoadingEvents(false);
      }
    };
    
    // Add delete event function - place this with other event handler functions
    const handleDeleteEvent = async (eventId, eventName) => {
      const confirmed = window.confirm(`Are you sure you want to delete the event "${eventName}"? This action cannot be undone.`);
      
      if (confirmed) {
        try {
          setIsLoadingEvents(true);
          
          // Make API call to delete the event
          await api.delete(`events/events/${eventId}/`);
          
          // Update local state by removing the deleted event
          setEvents(prev => prev.filter(event => event.id !== eventId));
          setFilteredEvents(prev => prev.filter(event => event.id !== eventId));
          
          // Show success message
          toast.success(`Event "${eventName}" was successfully deleted`);
          
          // Update event statistics
          setEventStats(prev => ({
            ...prev,
            total: prev.total - 1,
            upcoming: prev.upcoming - (events.find(e => e.id === eventId)?.status === 'upcoming' ? 1 : 0),
            completed: prev.completed - (events.find(e => e.id === eventId)?.status === 'completed' ? 1 : 0),
            canceled: prev.canceled - (events.find(e => e.id === eventId)?.status === 'canceled' ? 1 : 0)
          }));
          
        } catch (error) {
          console.error("Error deleting event:", error);
          toast.error("Failed to delete event: " + (error.response?.data?.detail || error.message));
        } finally {
          setIsLoadingEvents(false);
        }
      }
    };
    
    // Render Events Statistics section
    const renderEventStats = () => {
      return (
        <div className={eventsStyles.eventStatsContainer}>
          <div className={eventsStyles.statCards}>
            <div className={eventsStyles.statCard}>
              <div className={eventsStyles.statIcon} style={{ backgroundColor: 'rgba(25, 118, 210, 0.1)', color: '#1976d2' }}>
                <FaCalendarAlt />
              </div>
              <div className={eventsStyles.statInfo}>
                <h4>Total Events</h4>
                <p>{eventStats.total}</p>
              </div>
            </div>
            
            <div className={eventsStyles.statCard}>
              <div className={eventsStyles.statIcon} style={{ backgroundColor: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32' }}>
                <FaCalendarCheck />
              </div>
              <div className={eventsStyles.statInfo}>
                <h4>Upcoming</h4>
                <p>{eventStats.upcoming}</p>
              </div>
            </div>
            
            <div className={eventsStyles.statCard}>
              <div className={eventsStyles.statIcon} style={{ backgroundColor: 'rgba(198, 40, 40, 0.1)', color: '#c62828' }}>
                <FaCalendarTimes />
              </div>
              <div className={eventsStyles.statInfo}>
                <h4>Completed</h4>
                <p>{eventStats.completed}</p>
              </div>
            </div>
            
            <div className={eventsStyles.statCard}>
              <div className={eventsStyles.statIcon} style={{ backgroundColor: 'rgba(245, 127, 23, 0.1)', color: '#f57f17' }}>
                <FaBan />
              </div>
              <div className={eventsStyles.statInfo}>
                <h4>Canceled</h4>
                <p>{eventStats.canceled}</p>
              </div>
            </div>
          </div>
          
          {eventStats.mostPopular && (
            <div className={eventsStyles.popularEventCard}>
              <h4>Most Popular Event</h4>
              <div className={eventsStyles.popularEventContent}>
                <div className={eventsStyles.popularEventIcon}>
                  <FaStar />
                </div>
                <div className={eventsStyles.popularEventInfo}>
                  <h5>{eventStats.mostPopular.event_name}</h5>
                  <p>
                    <FaUsers /> {eventStats.mostPopular.attendee_count || 0} attendees
                    <span className={eventsStyles.eventDate}>
                      <FaCalendarDay /> {new Date(eventStats.mostPopular.event_time).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

  return (
      <div className={eventsStyles.eventsTabContainer}>
        <div className={eventsStyles.sectionHeader}>
          <h3 className={eventsStyles.sectionTitle}>Event Management</h3>
          <div className={eventsStyles.headerActions}>
            <button 
              className={eventsStyles.filterToggleButton}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          <button 
            className={eventsStyles.createEventButton}
            onClick={() => navigate('/create-event')}
          >
            <FaCalendarPlus /> Create New Event
          </button>
          </div>
        </div>

        {/* Event Statistics */}
        {!isLoadingEvents && renderEventStats()}

        {/* Filters Section */}
        {showFilters && (
          <div className={eventsStyles.filtersContainer}>
            <div className={eventsStyles.filterRow}>
              <div className={eventsStyles.filterGroup}>
                <label>Status:</label>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={eventsStyles.filterSelect}
                >
                  <option value="all">All Statuses</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                  <option value="postponed">Postponed</option>
                </select>
              </div>
              
              <div className={eventsStyles.filterGroup}>
                <label>Sort By:</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className={eventsStyles.filterSelect}
                >
                  <option value="date">Event Date</option>
                  <option value="name">Event Name</option>
                  <option value="attendees">Attendees</option>
                  <option value="created">Created Date</option>
                </select>
              </div>
              
              <div className={eventsStyles.filterGroup}>
                <label>Order:</label>
                <select 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={eventsStyles.filterSelect}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
            
            <div className={eventsStyles.filterRow}>
              <div className={eventsStyles.filterGroup}>
                <label>Venue:</label>
                <input 
                  type="text" 
                  placeholder="Filter by venue"
                  value={venueFilter}
                  onChange={(e) => setVenueFilter(e.target.value)}
                  className={eventsStyles.filterInput}
                />
              </div>
              
              <div className={eventsStyles.filterGroup}>
                <label>Date Range:</label>
                <div className={eventsStyles.dateRangeInputs}>
                  <input
                    type="date"
                    placeholder="From"
                    value={dateFilter.from}
                    onChange={(e) => setDateFilter(prev => ({...prev, from: e.target.value}))}
                    className={eventsStyles.filterInput}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    placeholder="To"
                    value={dateFilter.to}
                    onChange={(e) => setDateFilter(prev => ({...prev, to: e.target.value}))}
                    className={eventsStyles.filterInput}
                  />
                </div>
              </div>
            </div>
            
            <div className={eventsStyles.searchBox}>
              <input
                type="text"
                placeholder="Search events by name, description, or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={eventsStyles.searchInput}
              />
              <FaSearch className={eventsStyles.searchIcon} />
            </div>
            
            <div className={eventsStyles.activeFilters}>
              <span className={eventsStyles.resultsCount}>
                Showing {filteredEvents.length} of {events.length} events
              </span>
              <button 
                className={eventsStyles.clearFiltersBtn}
                onClick={() => {
                  setFilterStatus('all');
                  setSearchTerm('');
                  setSortBy('date');
                  setSortOrder('asc');
                  setDateFilter({ from: '', to: '' });
                  setVenueFilter('');
                }}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Batch Actions Bar */}
        {showBatchActions && (
          <div className={eventsStyles.batchActionsBar}>
            <span className={eventsStyles.selectedCount}>
              {selectedEvents.length} event(s) selected
            </span>
            <div className={eventsStyles.batchButtons}>
              <button 
                className={eventsStyles.batchActionBtn} 
                onClick={() => handleBatchAction('cancel')}
              >
                <FaBan /> Cancel Events
              </button>
              <button 
                className={eventsStyles.batchActionBtn} 
                onClick={() => handleBatchAction('export')}
              >
                <FaFileExport /> Export CSV
              </button>
              <button 
                className={eventsStyles.batchActionBtn} 
                onClick={() => handleBatchAction('reminder')}
              >
                <FaBell /> Send Reminders
              </button>
              <button 
                className={eventsStyles.batchActionBtn}
                onClick={() => {
                  setSelectedEvents([]);
                  setShowBatchActions(false);
                }}
              >
                <FaTimes /> Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingEvents ? (
          <div className={eventsStyles.loadingEvents}>
            <div className={eventsStyles.loaderSpinner}></div>
            <p>Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className={eventsStyles.eventsList}>
            <div className={eventsStyles.eventsListHeader}>
              <div className={eventsStyles.eventHeaderCell} style={{width: '5%'}}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0}
                />
              </div>
              <div className={eventsStyles.eventHeaderCell} style={{width: '30%'}}>Event Name</div>
              <div className={eventsStyles.eventHeaderCell} style={{width: '20%'}}>Date</div>
              <div className={eventsStyles.eventHeaderCell} style={{width: '15%'}}>Attendees</div>
              <div className={eventsStyles.eventHeaderCell} style={{width: '15%'}}>Status</div>
              <div className={eventsStyles.eventHeaderCell} style={{width: '15%'}}>Actions</div>
            </div>
            
            {filteredEvents.map((event, index) => (
              <div key={event.id || index} className={eventsStyles.eventRow}>
                <div className={eventsStyles.eventCell} style={{width: '5%'}}>
                  <input 
                    type="checkbox" 
                    checked={selectedEvents.includes(event.id)}
                    onChange={() => handleSelectEvent(event.id)}
                  />
                </div>
                <div className={eventsStyles.eventCell} style={{width: '30%'}}>
                  <div className={eventsStyles.eventName}>{event.event_name}</div>
                  <div className={eventsStyles.eventVenue}>
                    <FaMapMarkerAlt className={eventsStyles.venueIcon} /> 
                    {event.venue || 'No venue specified'}
                  </div>
                </div>
                <div className={eventsStyles.eventCell} style={{width: '20%'}}>
                  <div className={eventsStyles.eventDateTime}>
                    <FaCalendarDay className={eventsStyles.dateIcon} />
                    {new Date(event.event_time).toLocaleDateString('en-IN')}
                  </div>
                  <div className={eventsStyles.eventTime}>
                    <FaClock className={eventsStyles.timeIcon} />
                    {new Date(event.event_time).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  </div>
                </div>
                <div className={eventsStyles.eventCell} style={{width: '15%'}}>
                  <div className={eventsStyles.attendeeCount}>
                    <FaUsers className={eventsStyles.attendeeIcon} />
                    {event.attendee_count || 0} 
                    {event.max_participants ? ` / ${event.max_participants}` : ''}
                  </div>
                  <div className={eventsStyles.capacityBar}>
                    <div 
                      className={eventsStyles.capacityFill}
                      style={{
                        width: `${event.max_participants ? Math.min(100, (event.attendee_count || 0) / event.max_participants * 100) : 0}%`,
                        backgroundColor: event.max_participants && (event.attendee_count || 0) >= event.max_participants ? '#e74c3c' : '#2ecc71'
                      }}
                    ></div>
                  </div>
                </div>
                <div className={eventsStyles.eventCell} style={{width: '15%'}}>
                  <span className={`${eventsStyles.statusBadge} ${eventsStyles[event.status || 'upcoming']}`}>
                    {event.status || 'upcoming'}
                  </span>
                  <div className={eventsStyles.statusActions}>
                    <select
                      className={eventsStyles.statusSelect}
                      value={event.status || 'upcoming'}
                      onChange={(e) => updateEventStatus(event.id, e.target.value)}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                      <option value="canceled">Canceled</option>
                      <option value="postponed">Postponed</option>
                    </select>
                </div>
                </div>
                <div className={eventsStyles.eventCell} style={{width: '15%'}}>
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
                    <button 
                      className={eventsStyles.actionButton} 
                      title="View Participants"
                      onClick={() => toast.info(`Viewing participants for "${event.event_name}" (Coming soon!)`)}
                    >
                      <FaUserFriends />
                    </button>
                    <button 
                      className={eventsStyles.actionButton} 
                      title="Send Notifications"
                      onClick={() => toast.info(`Send notifications for "${event.event_name}" (Coming soon!)`)}
                    >
                      <FaBell />
                    </button>
                    <button 
                      className={`${eventsStyles.actionButton} ${eventsStyles.deleteButton}`}
                      title="Delete Event"
                      onClick={() => handleDeleteEvent(event.id, event.event_name)}
                    >
                      <FaTrash />
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
            <p>No events found matching your criteria</p>
            {searchTerm || filterStatus !== 'all' || dateFilter.from || dateFilter.to || venueFilter ? (
              <button 
                className={eventsStyles.clearFiltersBtn}
                onClick={() => {
                  setFilterStatus('all');
                  setSearchTerm('');
                  setDateFilter({ from: '', to: '' });
                  setVenueFilter('');
                }}
              >
                Clear Filters
              </button>
            ) : (
            <button 
              className={eventsStyles.createEventButton}
              onClick={() => navigate('/create-event')}
            >
                Create Your First Event
            </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderReportsTab = () => {
    return (
      <div className={reportsStyles.reportsContainer}>
        <div className={reportsStyles.reportsHeader}>
          <h2>Reports & Analytics</h2>
          <p>Access detailed reports and analytics about your events.</p>
        </div>

        <div className={reportsStyles.reportFilters}>
          <div className={reportsStyles.filterGroup}>
            <label>Date Range:</label>
            <select value={reportsFilter.dateRange} onChange={(e) => handleReportsFilter('dateRange', e.target.value)}>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
              <option value="lastYear">Last Year</option>
              <option value="allTime">All Time</option>
            </select>
          </div>
          <div className={reportsStyles.filterGroup}>
            <label>Event Type:</label>
            <select value={reportsFilter.eventType} onChange={(e) => handleReportsFilter('eventType', e.target.value)}>
              <option value="all">All Events</option>
              <option value="workshop">Workshops</option>
              <option value="conference">Conferences</option>
              <option value="seminar">Seminars</option>
              <option value="online">Online Events</option>
            </select>
          </div>
        </div>
        
          <div className={reportsStyles.reportsGrid}>
            <div className={reportsStyles.reportCard}>
            <h3>Attendance Overview</h3>
                <div className={reportsStyles.reportChart}>
              {hasAttendanceData && attendanceData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <Line
                    data={{
                      labels: attendanceData.map(item => item.name),
                      datasets: [
                        {
                          label: "Participants",
                          data: attendanceData.map(item => item.value),
                          borderColor: "#ff4a17",
                          backgroundColor: "rgba(255, 74, 23, 0.1)",
                          borderWidth: 2,
                          tension: 0.1
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className={reportsStyles.emptyState}>
                  <p>No attendance data available</p>
                </div>
              )}
            </div>
            <div className={reportsStyles.reportInsights}>
              <div className={reportsStyles.insight}>
                <h4>Total Attendees</h4>
                <p>{stats.totalAttendees || 0}</p>
              </div>
              <div className={reportsStyles.insight}>
                <h4>Average per Event</h4>
                <p>{stats.averageAttendees || 0}</p>
              </div>
              <div className={reportsStyles.insight}>
                <h4>Growth Rate</h4>
                <p>{stats.attendeeGrowth ? `${stats.attendeeGrowth}%` : 'N/A'}</p>
              </div>
            </div>
            </div>

            <div className={reportsStyles.reportCard}>
            <h3>Revenue Analysis</h3>
                <div className={reportsStyles.reportChart}>
              {hasRevenueData && revenueData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <Bar
                    data={{
                      labels: revenueData.map(item => item.name),
                      datasets: [
                        {
                          label: "Revenue (₹)",
                          data: revenueData.map(item => item.value),
                          backgroundColor: "#ff4a17",
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => `₹${value}`
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className={reportsStyles.emptyState}>
                  <p>No revenue data available</p>
                </div>
              )}
            </div>
            <div className={reportsStyles.reportInsights}>
              <div className={reportsStyles.insight}>
                <h4>Total Revenue</h4>
                <p>{formatCurrency(stats.revenue || 0)}</p>
              </div>
              <div className={reportsStyles.insight}>
                <h4>Average per Event</h4>
                <p>{formatCurrency(stats.averageRevenue || 0)}</p>
              </div>
              <div className={reportsStyles.insight}>
                <h4>Growth Rate</h4>
                <p>{stats.revenueGrowth ? `${stats.revenueGrowth}%` : 'N/A'}</p>
              </div>
            </div>
            </div>

            <div className={reportsStyles.reportCard}>
            <h3>Event Distribution</h3>
                <div className={reportsStyles.reportChart}>
              {hasEventTypeData && eventTypeData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <Pie
                    data={{
                      labels: eventTypeData.map(item => item.name),
                      datasets: [
                        {
                          data: eventTypeData.map(item => item.value),
                          backgroundColor: [
                            '#ff4a17', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'
                          ],
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${percentage}%`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className={reportsStyles.emptyState}>
                  <p>No event type data available</p>
                </div>
              )}
            </div>
            <div className={reportsStyles.reportInsights}>
              <div className={reportsStyles.insight}>
                <h4>Total Events</h4>
                <p>{stats.totalEvents || 0}</p>
              </div>
              <div className={reportsStyles.insight}>
                <h4>Most Popular</h4>
                <p>{stats.popularEventType || 'N/A'}</p>
              </div>
              <div className={reportsStyles.insight}>
                <h4>Completion Rate</h4>
                <p>{stats.completionRate ? `${stats.completionRate}%` : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className={reportsStyles.reportExport}>
          <h3>Export Reports</h3>
          <p>Download detailed reports for your records or presentations.</p>
          <div className={reportsStyles.exportButtons}>
            <button className={reportsStyles.exportButton} onClick={() => exportReport('pdf')}>
              <FaFileInvoice /> Export as PDF
            </button>
            <button className={reportsStyles.exportButton} onClick={() => exportReport('excel')}>
              <FaFileExport /> Export as Excel
            </button>
            <button className={reportsStyles.exportButton} onClick={() => exportReport('csv')}>
              <FaFileAlt /> Export as CSV
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add dedicated effect for payments tab data fetching
  useEffect(() => {
    const fetchPaymentsData = async () => {
      if (activeTab === "payments") {
        try {
          console.log("Fetching payments data for payments tab");
          setPaymentsLoading(true);
          
          // First get the coordinator's events to ensure we only show payments for their events
          const myEventsResponse = await api.get("events/events/?created_by=me");
          console.log("My events response:", myEventsResponse.data?.length || 0, "events");
          
          if (!Array.isArray(myEventsResponse.data)) {
            console.error("Events response is not an array:", myEventsResponse.data);
            setPayments([]);
            setFilteredPayments([]);
            setPaymentsLoading(false);
            return;
          }
          
          const myEventIds = myEventsResponse.data.map(event => event.id);
          console.log("My event IDs:", myEventIds);
          
          // Get all payments that are event_registration type (not event_creation)
          const paymentsResponse = await api.get("payments/payments/?payment_type=event_registration");
          
          if (!Array.isArray(paymentsResponse.data)) {
            console.error("Payments response is not an array:", paymentsResponse.data);
            setPayments([]);
            setFilteredPayments([]);
            setPaymentsLoading(false);
            return;
          }
          
          console.log("Payments response:", paymentsResponse.data?.length || 0, "payments");
          
          // Process the payment data - only keep payments for events created by this coordinator
          const paymentsWithDetails = await Promise.all(
            paymentsResponse.data
              .filter(payment => {
                // If payment has event ID as a number, check if it's in myEventIds
                if (payment?.event && typeof payment.event === 'number') {
                  return myEventIds.includes(payment.event);
                }
                // If payment has event as an object, check the ID
                else if (payment?.event && typeof payment.event === 'object' && payment.event.id) {
                  return myEventIds.includes(payment.event.id);
                }
                return false;
              })
              .map(async (payment) => {
                // Skip payments made by the coordinator themselves
                if (payment?.payment_type === 'event_creation') {
                  return null;
                }
                
                // If we already have event details as an object, just return the payment
                if (payment?.event && typeof payment.event === 'object') {
                  return payment;
                }
                
                // Otherwise fetch event details
                try {
                  if (payment?.event && typeof payment.event === 'number') {
                    const eventResponse = await api.get(`events/events/${payment.event}/`);
                    if (eventResponse.data) {
                      return {
                        ...payment,
                        event: eventResponse.data
                      };
                    }
                  }
                  return payment;
                } catch (err) {
                  console.warn(`Could not fetch details for event ID ${payment.event}:`, err);
                  return payment;
                }
              })
          );
          
          // Filter out null values and undefined (payments made by coordinator themselves)
          const filteredPayments = paymentsWithDetails.filter(p => p !== null);
          console.log("Filtered payments:", filteredPayments.length);
          
          setPayments(filteredPayments);
          setFilteredPayments(filteredPayments);
        } catch (error) {
          console.error("Error fetching payments data:", error);
          setPayments([]);
          setFilteredPayments([]);
        } finally {
          setPaymentsLoading(false);
        }
      }
    };
    
    fetchPaymentsData();
  }, [activeTab]);

  // Add useEffect for payments filtering
  useEffect(() => {
    // Filter payments when any payment-related filter changes
    if (payments && payments.length > 0) {
      const filtered = payments.filter(payment => {
        // Skip payments that the coordinator made (event creation payments)
        if (payment.payment_type === 'event_creation') {
          return false;
        }
        
        // Status filter
        const statusMatch = paymentFilter === 'all' || payment.payment_status === paymentFilter;
        
        // Search filter - check if search term is in event name or transaction ID
        const searchMatch = !searchPaymentTerm || 
          (payment.event && payment.event.event_name && 
            payment.event.event_name.toLowerCase().includes(searchPaymentTerm.toLowerCase())) ||
          (payment.transaction_id && 
            payment.transaction_id.toLowerCase().includes(searchPaymentTerm.toLowerCase()));
            
        // Date filter
        let dateMatch = true;
        if (paymentDateFilter.from) {
          const fromDate = new Date(paymentDateFilter.from);
          const paymentDate = new Date(payment.created_at);
          dateMatch = dateMatch && paymentDate >= fromDate;
        }
        if (paymentDateFilter.to) {
          const toDate = new Date(paymentDateFilter.to);
          toDate.setHours(23, 59, 59, 999); // End of the day
          const paymentDate = new Date(payment.created_at);
          dateMatch = dateMatch && paymentDate <= toDate;
        }
        
        return statusMatch && searchMatch && dateMatch;
      });
      
      setFilteredPayments(filtered);
    } else {
      setFilteredPayments([]);
    }
  }, [payments, paymentFilter, searchPaymentTerm, paymentDateFilter]);

  // Helper functions for payment analytics
  const calculateTotalRevenue = () => {
    if (!Array.isArray(payments)) return 0;
    
    return payments.reduce((sum, payment) => {
      const amount = parseFloat(payment?.amount || 0);
      return isNaN(amount) ? sum : sum + amount;
    }, 0);
  };
  
  const calculateAverageRevenue = () => {
    if (!Array.isArray(payments) || payments.length === 0) return 0;
    
    // Group payments by event
    const eventTotals = {};
    payments.forEach(payment => {
      if (payment?.event) {
        const eventId = typeof payment.event === 'object' ? payment.event.id : payment.event;
        if (!eventTotals[eventId]) {
          eventTotals[eventId] = 0;
        }
        const amount = parseFloat(payment?.amount || 0);
        if (!isNaN(amount)) {
          eventTotals[eventId] += amount;
        }
      }
    });
    
    // Calculate average revenue per event
    const eventCount = Object.keys(eventTotals).length;
    if (eventCount === 0) return 0;
    
    const totalRevenue = Object.values(eventTotals).reduce((sum, amount) => sum + amount, 0);
    return totalRevenue / eventCount;
  };
  
  const countUniqueCustomers = () => {
    if (!Array.isArray(payments)) return 0;
    
    const uniqueUserIds = new Set();
    
    payments.forEach(payment => {
      if (payment?.user?.id) {
        uniqueUserIds.add(payment.user.id);
      } else if (payment?.user_id) {
        uniqueUserIds.add(payment.user_id);
      } else if (payment?.payment_details?.customer?.email) {
        uniqueUserIds.add(payment.payment_details.customer.email);
      }
    });
    
    return uniqueUserIds.size;
  };
  
  const preparePaymentChartData = () => {
    // Ensure we have array data to work with
    const safePayments = Array.isArray(payments) ? payments : [];
    
    // Get event-wise revenue breakdown
    const eventRevenue = {};
    safePayments.forEach(payment => {
      if (payment?.event && payment?.payment_status === 'completed') {
        const eventId = typeof payment.event === 'object' ? payment.event.id : payment.event;
        const eventName = typeof payment.event === 'object' ? payment.event.event_name : `Event #${eventId}`;
        
        if (!eventRevenue[eventId]) {
          eventRevenue[eventId] = {
            event_id: eventId,
            event_name: eventName.length > 15 ? eventName.substring(0, 15) + '...' : eventName,
            revenue: 0,
            count: 0
          };
        }
        
        const amount = parseFloat(payment?.amount || 0);
        if (!isNaN(amount)) {
          eventRevenue[eventId].revenue += amount;
          eventRevenue[eventId].count += 1;
        }
      }
    });
    
    // Convert to array for chart
    const eventRevenueData = Object.values(eventRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 events by revenue
    
    // Payment status breakdown for pie chart
    const statusBreakdown = [
      { status: 'Completed', count: safePayments.filter(p => p?.payment_status === 'completed').length },
      { status: 'Pending', count: safePayments.filter(p => p?.payment_status === 'pending').length },
      { status: 'Failed', count: safePayments.filter(p => p?.payment_status === 'failed').length },
      { status: 'Refunded', count: safePayments.filter(p => p?.payment_status === 'refunded').length }
    ].filter(item => item.count > 0);
    
    // Create payment trend data by month (last 6 months)
    const paymentTrendData = [];
    const currentDate = new Date();
    
    // Calculate monthly revenue for last 6 months
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const monthRevenue = safePayments.reduce((sum, payment) => {
        try {
          if (payment?.created_at) {
            const paymentDate = new Date(payment.created_at);
            if (paymentDate >= monthStart && paymentDate <= monthEnd) {
              const amount = parseFloat(payment?.amount || 0);
              return isNaN(amount) ? sum : sum + amount;
            }
          }
          return sum;
        } catch (err) {
          console.warn("Error processing payment date:", err);
          return sum;
        }
      }, 0);
      
      paymentTrendData.unshift(monthRevenue); // Add to beginning of array (oldest to newest)
    }
    
    console.log("Prepared chart data:", {
      eventRevenueData,
      statusBreakdown,
      paymentTrendData
    });
    
    return {
      eventRevenueData,
      statusBreakdown,
      paymentTrendData
    };
  };
  
  // Function to get participant name
  const getParticipantName = (payment) => {
    // Try to extract participant info
    if (payment?.user && (payment.user.first_name || payment.user.last_name)) {
      return `${payment.user.first_name || ''} ${payment.user.last_name || ''}`.trim();
    } else if (payment?.user && payment.user.username) {
      return payment.user.username;
    } else if (payment?.user && payment.user.email) {
      return payment.user.email;
    } else if (payment?.payment_details && payment.payment_details.customer) {
      return payment.payment_details.customer.name || payment.payment_details.customer.email || 'Unknown';
    }
    return 'Unknown';
  };
  
  // Function to get payment status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return paymentsStyles.completed;
      case 'pending': return paymentsStyles.pending;
      case 'failed': return paymentsStyles.failed;
      case 'refunded': return paymentsStyles.refunded;
      default: return '';
    }
  };
  
  // Function to get event name from payment
  const getEventName = (payment) => {
    if (payment?.event) {
      if (typeof payment.event === 'object') {
        return payment.event.event_name || 'Unknown Event';
      } else {
        return `Event #${payment.event}`;
      }
    }
    return 'Unknown Event';
  };
  
  // Function to show payment details modal
  const showPaymentDetails = (payment) => {
    toast.info(`Payment details view will be implemented soon!`);
    console.log('Payment details:', payment);
  };

  // Add this with the other handler functions
  const handleReportsFilter = (field, value) => {
    setReportsFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add the exportReport function
  const exportReport = (format) => {
    toast.info(`Exporting report as ${format.toUpperCase()}. This feature will be available soon!`);
  };

  // Handle payment form input changes - moved out of renderPaymentsTab
  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If event changed, update selected event
    if (name === 'eventId' && value) {
      const event = events.find(e => e.id === parseInt(value));
      setSelectedEvent(event);
      // Set default amount based on event price if available
      if (event && event.price) {
        setPaymentFormData(prev => ({
          ...prev,
          amount: event.price
        }));
      }
    }
  };

  // Process credit card payment - moved out of renderPaymentsTab
  const processCardPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentFormData.eventId || !paymentFormData.amount) {
      toast.error("Please select an event and enter an amount");
      return;
    }

    if (!paymentFormData.cardNumber || !paymentFormData.cardHolder || 
        !paymentFormData.expiryMonth || !paymentFormData.expiryYear || 
        !paymentFormData.cvv) {
      toast.error("Please fill in all card details");
      return;
    }

    try {
      setProcessingPayment(true);
      
      // First create a payment record
      const createPaymentResponse = await api.post("payments/payments/", {
        event: paymentFormData.eventId,
        amount: paymentFormData.amount,
        payment_type: "event_registration",
        payment_method: "credit_card"
      });
      
      if (!createPaymentResponse.data || !createPaymentResponse.data.razorpay_order_id) {
        throw new Error("Failed to create payment record");
      }
      
      const paymentDetails = createPaymentResponse.data;
      
      // Initialize Razorpay payment
      const options = {
        key: paymentDetails.payment_details?.key_id,
        amount: parseFloat(paymentFormData.amount) * 100, // Razorpay amount in paisa
        currency: paymentDetails.payment_details?.currency || "INR",
        name: "EventSphere",
        description: `Payment for ${selectedEvent?.event_name || 'Event'}`,
        order_id: paymentDetails.razorpay_order_id,
        handler: async function(response) {
          // Handle successful payment
          try {
            const verifyPaymentResponse = await api.post(`payments/payments/${paymentDetails.id}/verify_payment/`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            
            if (verifyPaymentResponse.data && verifyPaymentResponse.data.success) {
              toast.success("Payment processed successfully!");
              // Refresh payment data
              fetchPaymentsData();
              // Reset form
              setPaymentFormData({
                eventId: '',
                amount: '',
                cardNumber: '',
                cardHolder: '',
                expiryMonth: '',
                expiryYear: '',
                cvv: '',
                email: '',
                phone: ''
              });
              setShowPaymentForm(false);
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Failed to verify payment: " + (error.response?.data?.error || error.message));
          }
        },
        prefill: {
          email: paymentFormData.email,
          contact: paymentFormData.phone,
          method: "card",
          card: {
            number: paymentFormData.cardNumber.replace(/\s/g, ''),
            name: paymentFormData.cardHolder,
            expiry: `${paymentFormData.expiryMonth}/${paymentFormData.expiryYear}`,
            cvv: paymentFormData.cvv
          }
        },
        theme: {
          color: "#ff4a17"
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(false);
            toast.info("Payment canceled");
          }
        }
      };
      
      // Open Razorpay payment form
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
      
    } catch (error) {
      console.error("Payment processing error:", error);
      toast.error("Failed to process payment: " + (error.response?.data?.error || error.message));
    } finally {
      setProcessingPayment(false);
    }
  };

  // Add the missing renderPaymentsTab function
  const renderPaymentsTab = () => {
    // Prepare chart data for the payments tab
    const chartData = preparePaymentChartData();

    if (paymentsLoading) {
      return (
        <div className={paymentsStyles.loadingSection}>
          <div className={paymentsStyles.loaderSpinner}></div>
          <p>Loading payment data...</p>
        </div>
      );
    }

    // Empty state for when there are no payments
    const renderEmptyState = () => (
      <div className={paymentsStyles.emptyState}>
        <div className={paymentsStyles.emptyIcon}>
          <FaFileInvoiceDollar />
        </div>
        <h3>No Payment Data Available</h3>
        <p>
          You don't have any payment records yet. When users register for your events with payments, they will appear here automatically.
        </p>
        <button 
          className={paymentsStyles.emptyStateButton}
          onClick={() => navigate('/create-event')}
        >
          <FaCalendarPlus /> Create a Paid Event
        </button>
      </div>
    );

    return (
      <div className={paymentsStyles.paymentsContainer}>
        <div className={paymentsStyles.sectionHeader}>
          <h2>Payment Analytics</h2>
          <p>Track and manage all payments for your events</p>
          <button 
            className={paymentsStyles.newPaymentButton}
            onClick={() => setShowPaymentForm(!showPaymentForm)}
          >
            {showPaymentForm ? 'Hide Payment Form' : 'Process New Payment'}
          </button>
        </div>

        {/* Credit Card Payment Form */}
        {showPaymentForm && (
          <div className={paymentsStyles.paymentFormContainer}>
            <h3 className={paymentsStyles.formTitle}>Process Card Payment</h3>
            <form onSubmit={processCardPayment} className={paymentsStyles.paymentForm}>
              <div className={paymentsStyles.formSection}>
                <h4>Payment Details</h4>
                <div className={paymentsStyles.formRow}>
                  <div className={paymentsStyles.formGroup}>
                    <label>Select Event</label>
                    <select 
                      name="eventId" 
                      value={paymentFormData.eventId} 
                      onChange={handlePaymentFormChange}
                      required
                    >
                      <option value="">Select an event</option>
                      {events.filter(e => e.status === 'upcoming').map(event => (
                        <option key={event.id} value={event.id}>
                          {event.event_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={paymentsStyles.formGroup}>
                    <label>Amount (₹)</label>
                    <input 
                      type="number" 
                      name="amount" 
                      value={paymentFormData.amount} 
                      onChange={handlePaymentFormChange}
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={paymentsStyles.formSection}>
                <h4>Card Details</h4>
                <div className={paymentsStyles.formRow}>
                  <div className={paymentsStyles.formGroup}>
                    <label>Card Number</label>
                    <input 
                      type="text" 
                      name="cardNumber" 
                      value={paymentFormData.cardNumber} 
                      onChange={handlePaymentFormChange}
                      placeholder="1234 5678 9012 3456"
                      pattern="[0-9\s]{13,19}"
                      required
                    />
                  </div>
                </div>
                <div className={paymentsStyles.formRow}>
                  <div className={paymentsStyles.formGroup}>
                    <label>Card Holder Name</label>
                    <input 
                      type="text" 
                      name="cardHolder" 
                      value={paymentFormData.cardHolder} 
                      onChange={handlePaymentFormChange}
                      required
                    />
                  </div>
                </div>
                <div className={paymentsStyles.formRow}>
                  <div className={paymentsStyles.formGroup}>
                    <label>Expiry Month</label>
                    <select 
                      name="expiryMonth" 
                      value={paymentFormData.expiryMonth} 
                      onChange={handlePaymentFormChange}
                      required
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1;
                        return (
                          <option key={month} value={month.toString().padStart(2, '0')}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className={paymentsStyles.formGroup}>
                    <label>Expiry Year</label>
                    <select 
                      name="expiryYear" 
                      value={paymentFormData.expiryYear} 
                      onChange={handlePaymentFormChange}
                      required
                    >
                      <option value="">YY</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <option key={year} value={year.toString().slice(-2)}>
                            {year.toString().slice(-2)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className={paymentsStyles.formGroup}>
                    <label>CVV</label>
                    <input 
                      type="text" 
                      name="cvv" 
                      value={paymentFormData.cvv} 
                      onChange={handlePaymentFormChange}
                      maxLength="4"
                      pattern="[0-9]{3,4}"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={paymentsStyles.formSection}>
                <h4>Contact Information</h4>
                <div className={paymentsStyles.formRow}>
                  <div className={paymentsStyles.formGroup}>
                    <label>Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={paymentFormData.email} 
                      onChange={handlePaymentFormChange}
                      required
                    />
                  </div>
                  <div className={paymentsStyles.formGroup}>
                    <label>Phone</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={paymentFormData.phone} 
                      onChange={handlePaymentFormChange}
                      pattern="[0-9]{10}"
                      placeholder="10-digit number"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={paymentsStyles.formActions}>
                <button 
                  type="button" 
                  className={paymentsStyles.cancelButton}
                  onClick={() => setShowPaymentForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={paymentsStyles.submitButton}
                  disabled={processingPayment}
                >
                  {processingPayment ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={paymentsStyles.statsGrid}>
          <div className={paymentsStyles.statCard}>
            <div className={paymentsStyles.statIcon}>
              <FaMoneyBillWave />
            </div>
            <div>
              <h3>Total Revenue</h3>
              <p>{formatCurrency(calculateTotalRevenue())}</p>
            </div>
          </div>

          <div className={paymentsStyles.statCard}>
            <div className={paymentsStyles.statIcon}>
              <FaExchangeAlt />
            </div>
            <div>
              <h3>Total Transactions</h3>
              <p>{payments?.length || 0}</p>
            </div>
          </div>

          <div className={paymentsStyles.statCard}>
            <div className={paymentsStyles.statIcon}>
              <FaUsers />
            </div>
            <div>
              <h3>Unique Customers</h3>
              <p>{countUniqueCustomers()}</p>
            </div>
          </div>

          <div className={paymentsStyles.statCard}>
            <div className={paymentsStyles.statIcon}>
              <FaTicketAlt />
            </div>
            <div>
              <h3>Average Revenue per Event</h3>
              <p>{formatCurrency(calculateAverageRevenue())}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={paymentsStyles.chartsSection}>
          {/* Monthly Revenue Trend */}
          <div className={paymentsStyles.chartContainer}>
            <h3 className={paymentsStyles.chartTitle}>Monthly Revenue Trend</h3>
            {chartData.paymentTrendData && chartData.paymentTrendData.some(value => value > 0) ? (
              <div className={paymentsStyles.chartWrapper}>
                <Bar
                  data={{
                    labels: ["Last 6M", "Last 5M", "Last 4M", "Last 3M", "Last 2M", "Last 1M"],
                    datasets: [
                      {
                        label: "Revenue",
                        data: chartData.paymentTrendData,
                        backgroundColor: "#ff4a17",
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `₹${value}`,
                        },
                      },
                    },
                  }}
                />
                </div>
              ) : (
              <div className={paymentsStyles.emptyStateSmall}>
                <p>No revenue data available for the past 6 months</p>
                </div>
              )}
            </div>

          {/* Payment Status Distribution */}
          <div className={paymentsStyles.chartContainer}>
            <h3 className={paymentsStyles.chartTitle}>Payment Status Distribution</h3>
            {chartData.statusBreakdown && chartData.statusBreakdown.length > 0 ? (
              <div className={paymentsStyles.chartWrapper}>
                <Pie
                  data={{
                    labels: chartData.statusBreakdown.map(item => item.status),
                    datasets: [
                      {
                        data: chartData.statusBreakdown.map(item => item.count),
                        backgroundColor: [
                          "#4CAF50", // completed
                          "#2196F3", // pending
                          "#F44336", // failed
                          "#FFC107", // refunded
                        ],
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
                  </div>
            ) : (
              <div className={paymentsStyles.emptyStateSmall}>
                <p>No payment status data available</p>
                </div>
            )}
                  </div>
                </div>

        {/* Top Events by Revenue */}
        <div className={paymentsStyles.chartContainer}>
          <h3 className={paymentsStyles.chartTitle}>Top Events by Revenue</h3>
          {chartData.eventRevenueData && chartData.eventRevenueData.length > 0 ? (
            <div className={paymentsStyles.chartWrapper}>
              <Bar
                data={{
                  labels: chartData.eventRevenueData.map(item => item.event_name),
                  datasets: [
                    {
                      label: "Revenue",
                      data: chartData.eventRevenueData.map(item => item.revenue),
                      backgroundColor: "#673AB7",
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => `₹${value}`,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
                  </div>
          ) : (
            <div className={paymentsStyles.emptyStateSmall}>
              <p>No event revenue data available</p>
                </div>
          )}
                  </div>

        {/* Payment History */}
        <div className={paymentsStyles.sectionWrapper}>
          <div className={paymentsStyles.sectionHeader}>
            <h2>Payment History</h2>
            <div className={paymentsStyles.actionButtons}>
              <div className={paymentsStyles.searchInput}>
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchPaymentTerm}
                  onChange={(e) => setSearchPaymentTerm(e.target.value)}
                />
                </div>
              <div className={paymentsStyles.filterDropdown}>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                >
                  <option value="all">All Payments</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          {filteredPayments && filteredPayments.length > 0 ? (
            <div className={paymentsStyles.tableContainer}>
              <table className={paymentsStyles.dataTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Event</th>
                    <th>Participant</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>#{payment.id}</td>
                      <td>{getEventName(payment)}</td>
                      <td>{getParticipantName(payment)}</td>
                      <td>₹{payment.amount}</td>
                      <td>
                        <span className={getStatusClass(payment.payment_status)}>
                          {payment.payment_status?.charAt(0).toUpperCase() + payment.payment_status?.slice(1)}
                        </span>
                      </td>
                      <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className={paymentsStyles.actionButton}
                          onClick={() => showPaymentDetails(payment)}
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            renderEmptyState()
          )}
        </div>
      </div>
    );
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
              activeTab === "payments" ? sidebarStyles.active : ""
            }`}
            onClick={() => setActiveTab("payments")}
          >
            <FaMoneyBill />
            <span>Payments</span>
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