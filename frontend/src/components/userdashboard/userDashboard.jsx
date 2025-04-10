import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  FaCalendarAlt,
  FaTicketAlt,
  FaRegBookmark,
  FaSignOutAlt,
  FaUserCog,
  FaMapMarkerAlt,
  FaUsers,
  FaClock,
  FaSearch,
  FaFilter,
  FaStar,
  FaThumbsUp,
  FaRegComment,
  FaUserPlus,
  FaTimes,
  FaSave,
  FaCompass,
  FaListUl,
  FaBookmark,
  FaUserEdit,
  FaExclamationTriangle,
  FaSync,
  FaCamera,
  FaPlus,
  FaEdit,
  FaUser,
  FaUserCheck,
  FaChartBar,
  FaCalendarCheck,
  FaCalendarMinus,
  FaCalendarPlus,
  FaChartLine,
  FaUserFriends
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import api, { getMediaUrl, tryMultipleEndpoints } from "../../utils/api";
import styles from "../../assets/css/user/userDashboard.module.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../utils/constants";
import CoordinatorRequestForm from "./CoordinatorRequestForm";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import profileStyles from "../../assets/css/user/profile.module.css";
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

const UpdatedStyles = () => (
  <style>
    {`
    :root {
      --accent-color: #ff4a17 !important;
      --accent-hover: #e63c0c !important;
      --accent-light: rgba(255, 74, 23, 0.1) !important;
    }
    
    /* Fallback for elements that might not use CSS variables */
    .primaryButton, .registerButton, .navButton.active, 
    .editProfileButton, .saveButton, .coordinatorRequestButton {
      background-color: #ff4a17 !important;
    }
    
    .statIcon, .quickActionIcon, .starFilled {
      color: #ff4a17 !important;
    }

    /* Avatar styling in sidebar */
    .userAvatar {
      border: 3px solid #ff4a17 !important;
      box-shadow: 0 0 10px rgba(255, 74, 23, 0.3) !important;
    }
    
    .userAvatarPlaceholder {
      background-color: #ff4a17 !important;
      color: white !important;
      border: 2px solid rgba(255, 255, 255, 0.8) !important;
    }

    .sidebarHeader h2 {
      color: #ff4a17 !important;
    }
    `}
  </style>
);

const UserDashboard = () => {
  const [stats, setStats] = useState({
    registeredEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    location: "",
    date: "",
    type: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    profile_photo: null
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);
  const fileInputRef = React.useRef(null);
  const navigate = useNavigate();
  const [showCoordinatorRequestModal, setShowCoordinatorRequestModal] = useState(false);
  const [hasCoordinatorRequest, setHasCoordinatorRequest] = useState(false);
  const [coordinatorRequestStatus, setCoordinatorRequestStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ rating: 5, comment: '' });
  const [cancelingRegistration, setCancelingRegistration] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [profileEditFormData, setProfileEditFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    profilePicture: null,
    password: '',
    confirmPassword: '',
    previousProfilePicture: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    password: '',
    confirm_password: '',
    profile_picture: null
  });
  // Add these state variables if they don't exist
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [userParticipations, setUserParticipations] = useState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  // Add new state variables for coordinator events data
  const [coordinatorEvents, setCoordinatorEvents] = useState([]);
  const [coordinatorStats, setCoordinatorStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    participantsCount: 0,
    completedEvents: 0,
    canceledEvents: 0
  });

  // Initialize dashboard data when component mounts
  useEffect(() => {
    // Add an event listener for auth errors
    const handleAuthError = (event) => {
      console.log("Auth error detected from event:", event.detail);
      
      // If the error is due to user being inactive, show message but don't log out
      if (event.detail.originalError?.response?.data?.code === 'user_inactive') {
        console.log("User account is inactive");
        setError("Your account is currently inactive. Please contact support.");
        return; // Don't log out for inactive users
      }
      
      // Handle auth errors by removing tokens and navigating to login
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
      localStorage.removeItem("user");
      navigate("/login_reg");
    };

    // Add event listener for registration updates
    const handleRegistrationUpdate = () => {
      console.log("Registration update detected, refreshing dashboard data");
      fetchDashboardData();
    };

    // Add event listener for registration cancellation from event details page
    const handleRegistrationCanceled = (event) => {
      console.log("Registration canceled event received", event.detail);
      
      // Refresh the user participations data
      fetchUserParticipations();
      
      // Show a toast notification
      toast.info(`Your registration has been canceled`, {
        position: "bottom-right",
        autoClose: 3000
      });
    };

    window.addEventListener('auth-error', handleAuthError);
    window.addEventListener('event-registration-updated', handleRegistrationUpdate);
    window.addEventListener('registration-canceled', handleRegistrationCanceled);

    // Check authentication and fetch data immediately on mount
    checkAuthAndFetchStats();

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
      window.removeEventListener('event-registration-updated', handleRegistrationUpdate);
      window.removeEventListener('registration-canceled', handleRegistrationCanceled);
    };
  }, [navigate]);

  // Fetch all events for browse/recommendations tab
  useEffect(() => {
    if (activeTab === "browse") {
      console.log("Browse events tab activated - fetching events");
      fetchAllEvents();
    }
  }, [activeTab]);
  
  // Generate activity feed when dependencies change
  useEffect(() => {
    generateActivityFeed();
  }, [upcomingEvents, pastEvents, userProfile]);

  const checkAuthAndFetchStats = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    
    if (!token) {
      console.log("No access token found, redirecting to login");
      navigate("/login_reg");
      return;
    }
    
    try {
      // First try a simple API call to verify token validity
      console.log("Testing token validity with API call");
      
      // TEMPORARY FIX: Skip all the complex auth checks and proceed with dashboard
      // Comment this out when you want to reimplement the strict auth checks
      console.log("DEVELOPMENT MODE: Bypassing strict auth checks");
      await fetchDashboardData();
      return;
      
      /* Original code - commented out for development
      let isAuthenticated = false;
      let isUserInactive = false;
      
      // Try multiple endpoints for auth validation
      const authEndpoints = ["users/check-auth/", "users/profile/", "events/"];
      
      for (const endpoint of authEndpoints) {
        if (isAuthenticated) break; // Stop if already authenticated
        
        try {
          console.log(`Checking auth with endpoint: ${endpoint}`);
          const response = await api.get(endpoint);
          console.log(`Auth check with ${endpoint} succeeded`);
          isAuthenticated = true;
        } catch (error) {
          console.warn(`Auth check with ${endpoint} failed:`, error.response?.status);
          
          // Check if this is a user_inactive error
          if (error.response?.data?.code === 'user_inactive') {
            console.log("User account is inactive");
            isUserInactive = true;
            setError("Your account is currently inactive. Please contact support.");
            break; // Stop checking other endpoints
          }
          
          // If this isn't an auth error (401/403), we're probably still authenticated
          if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
            console.log("Non-auth error, continuing...");
            isAuthenticated = true;
          }
        }
      }
      
      if (isUserInactive) {
        // For inactive users, show the dashboard with error message but with limited functionality
        console.log("User is inactive, showing limited dashboard");
        setLoading(false);
        return;
      }
      
      if (!isAuthenticated) {
        console.error("All auth checks failed - redirecting to login");
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem("user");
        navigate("/login_reg");
        return;
      }
      
      // Get user role and redirect if needed
      let userRole = null;
      const userData = localStorage.getItem("user");
            
      try {
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          console.log("User data from localStorage:", parsedUserData);
          userRole = parsedUserData.role;
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
      
      console.log("User role:", userRole);
      
      // If we have a role and it's not a normal user, redirect
      if (userRole) {
        const normalizedRole = userRole.toString().toLowerCase();
        
        if (normalizedRole === 'admin') {
          console.log("Admin user detected, redirecting to admin dashboard");
          navigate("/admin-dashboard");
          return;
        } else if (normalizedRole === 'coordinator') {
          console.log("Coordinator user detected, redirecting to coordinator dashboard");
          navigate("/coordinator-dashboard");
          return;
        } else if (normalizedRole !== 'normal' && normalizedRole !== 'user') {
          console.warn("Unknown role:", normalizedRole);
          // Continue anyway
        }
      }
      
      // We're a normal user, proceed with dashboard data fetch
      await fetchDashboardData();
      */
    } catch (error) {
      console.error("Authentication error:", error);
      
      // Try to load dashboard data anyway - this is helpful for development
      try {
        await fetchDashboardData();
      } catch (dashboardError) {
        console.error("Dashboard data fetch failed after auth error:", dashboardError);
        setLoading(false);
      }
    }
  };

  // Add fetchCoordinatorEvents function before the fetchDashboardData function
  const fetchCoordinatorEvents = async () => {
    if (!userProfile?.is_coordinator) return;
    
    try {
      // Try multiple endpoint paths
      const endpoints = [
        "events/coordinator-events/",
        "api/events/coordinator-events/",
        "/coordinator-events/"
      ];
      
      const response = await api.tryMultipleEndpoints(endpoints, 'get');
      
      if (response?.data) {
        if (response.data.events) {
          // Format with necessary fields
          const events = response.data.events.map(event => ({
            ...event,
            formatted_date: new Date(event.event_time).toLocaleDateString(),
            formatted_time: new Date(event.event_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          }));
          setCoordinatorEvents(events);
        } else if (Array.isArray(response.data)) {
          // Format with necessary fields
          const events = response.data.map(event => ({
            ...event,
            formatted_date: new Date(event.event_time).toLocaleDateString(),
            formatted_time: new Date(event.event_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          }));
          setCoordinatorEvents(events);
        }
      }
      
      // Also fetch coordinator stats
      const statEndpoints = [
        "events/coordinator-stats/",
        "api/events/coordinator-stats/",
        "/coordinator-stats/"
      ];
      
      const statsResponse = await api.tryMultipleEndpoints(statEndpoints, 'get');
      
      if (statsResponse?.data) {
        setCoordinatorStats({
          totalEvents: statsResponse.data.total_events || 0,
          upcomingEvents: statsResponse.data.upcoming_events || 0,
          participantsCount: statsResponse.data.participants_count || 0,
          completedEvents: statsResponse.data.completed_events || 0,
          canceledEvents: statsResponse.data.canceled_events || 0
        });
      }
    } catch (error) {
      console.error("Error fetching coordinator events:", error);
      // Don't show error toast for non-critical features
    }
  };

  // Fetch dashboard data including participations, bookmarks, feedback history, and notifications
  const fetchDashboardData = async () => {
      setLoading(true);
    setErrorMessage(null);
      console.log("Fetching dashboard data");
      
    try {
      // Check if the API baseURL is correctly configured
      console.log("API baseURL:", api.defaults.baseURL);
      
      // Fetch user profile
      await fetchUserProfile();
      
      // Fetch participations, then upcoming and past events
      await fetchUserParticipations();
      await Promise.all([
        fetchUpcomingEvents(),
        fetchPastEvents(),
        fetchBookmarkedEvents(),
        fetchAllEvents(false) // Load all events without showing loading indicator
      ]);
      
      // Update stats
      updateStats();
      
      // Generate activity feed
      generateActivityFeed();
      
      // Add this line near the end of the function
      if (userProfile?.is_coordinator) {
        await fetchCoordinatorEvents();
      }
      
      setLoading(false);
      setInitialLoadComplete(true);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      
      if (error.response?.status === 401) {
        console.log("Authentication error in dashboard data fetch");
        // Dispatch auth error event for handling at the top level
        window.dispatchEvent(new CustomEvent('auth-error', {
          detail: { originalError: error }
        }));
      } else {
        setErrorMessage("There was an error loading your dashboard data. Please try refreshing the page.");
      }
      
      setLoading(false);
    }
  };
  
  // Fetch capacity information for events
  const fetchCapacityInfo = async (eventId) => {
    if (!eventId) return null;
    
    try {
      // Try multiple endpoints for capacity info
      const capacityEndpoints = [
        `/events/participants/event_capacity/?event_id=${eventId}`,
        `/api/events/participants/event_capacity/?event_id=${eventId}`,
        `/participants/event_capacity/?event_id=${eventId}`
      ];
      
      let response = null;
      
      for (const endpoint of capacityEndpoints) {
        try {
          console.log(`Trying to fetch capacity info from ${endpoint}`);
          response = await api.get(endpoint);
          
          if (response?.data) {
            console.log(`Successfully fetched capacity info from ${endpoint}`);
            return {
              current_participants: response.data.current_participants || 0,
              is_full: response.data.is_full || false,
              max_participants: response.data.max_participants || 0
            };
          }
        } catch (err) {
          console.log(`Failed to fetch capacity info from ${endpoint}:`, err);
        }
      }
      
      // If no endpoints work, return default values
      return {
        current_participants: 0,
        is_full: false,
        max_participants: 0
      };
      } catch (error) {
      console.error(`Error in fetchCapacityInfo for event ${eventId}:`, error);
      return {
        current_participants: 0,
        is_full: false,
        max_participants: 0
      };
    }
  };

  // Process participations data to update upcoming and past events
  const processParticipationsData = async (participations) => {
    if (!participations || participations.length === 0) {
      setUpcomingEvents([]);
      setPastEvents([]);
      return;
    }
    
    // Filter out canceled participations
    const activeParticipations = participations.filter(p => p.status !== 'canceled');
    if (activeParticipations.length === 0) {
      setUpcomingEvents([]);
      setPastEvents([]);
      return;
    }
    
    // Extract event IDs from active participations only
    const eventIds = activeParticipations.map(p => p.event);
    console.log("Event IDs from active participations:", eventIds);
    
    const upcomingList = [];
    const pastList = [];
    const now = new Date();
    
    // Fetch details for each event
    for (const eventId of eventIds) {
      try {
        const eventData = await fetchEventDetails(eventId);
        
        if (eventData) {
          // Skip events with canceled status
          if (eventData.status === 'canceled' || eventData.status === 'cancelled') {
            console.log(`Skipping canceled event: ${eventData.event_name}`);
            continue;
          }
          
          // Get capacity information
          const capacityInfo = await fetchCapacityInfo(eventId);
          
          // Combine event data with capacity info
          const enrichedEventData = {
            ...eventData,
            participant_count: capacityInfo?.current_participants || 0,
            is_full: capacityInfo?.is_full || false,
            max_participants: capacityInfo?.max_participants || eventData.max_participants || 0
          };
          
          const eventDate = new Date(eventData.event_time);
          
          if (eventDate > now && eventData.status !== 'canceled') {
            upcomingList.push(enrichedEventData);
          } else if (eventData.status !== 'canceled') {
            // Only add past events that are not canceled
            pastList.push(enrichedEventData);
          }
        }
      } catch (err) {
        console.error(`Error fetching details for event ${eventId}:`, err);
      }
    }
    
    console.log("Processed events - Upcoming:", upcomingList.length, "Past:", pastList.length);
    setUpcomingEvents(upcomingList);
    setPastEvents(pastList);
  };
  
  // Fetch bookmarked events from multiple possible endpoints
  const fetchBookmarkedEvents = async () => {
    try {
      console.log("Fetching bookmarked events");
      
      // Try multiple endpoints for bookmarked events
      const endpoints = [
        "/events/bookmarked/",
        "/api/events/bookmarked/",
        "/events/bookmark/",
        "/api/events/bookmark/"
      ];
      
      let response = null;
      let lastError = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch bookmarked events from ${endpoint}`);
          response = await api.get(endpoint);
          
          if (response?.data) {
            console.log(`Successfully fetched ${response.data.length} bookmarked events from ${endpoint}`);
            setBookmarkedEvents(response.data);
            return response.data;
          }
        } catch (err) {
          console.log(`Failed to fetch bookmarked events from ${endpoint}:`, err);
          lastError = err;
          // Continue to next endpoint
        }
      }
      
      // If we reach here, no endpoints worked - check if we have allEvents
      // and try to extract bookmarked events from there
      if (allEvents && allEvents.length > 0) {
        console.log("Trying to extract bookmarked events from allEvents");
        
        // Filter events that might be bookmarked based on various property names
        const bookmarked = allEvents.filter(event => 
          event.is_bookmarked === true || 
          event.bookmarked === true ||
          (event.bookmarks && Array.isArray(event.bookmarks) && 
            event.bookmarks.some(b => 
              b.user === getUserIdFromToken() || 
              b.user_id === getUserIdFromToken()
            )
          )
        );
        
        if (bookmarked.length > 0) {
          console.log(`Extracted ${bookmarked.length} bookmarked events from allEvents`);
          setBookmarkedEvents(bookmarked);
          return bookmarked;
        }
      }
      
      // If we still don't have data, set empty array and log error
      console.warn("Could not fetch bookmarked events from any source");
      setBookmarkedEvents([]);
      
      // Don't throw error for bookmarks since they're not critical
      // Just return empty array
      return [];
      
    } catch (error) {
      console.error("Error fetching bookmarked events:", error);
      setBookmarkedEvents([]);
      return [];
    }
  };
  
  // Fetch details for a specific event
  const fetchEventDetails = async (eventId) => {
    try {
      // Try multiple endpoints for each event - ordered by priority based on logs
      const eventEndpoints = [
        `/events/${eventId}/`,       // This seems to work based on logs
        `/api/events/${eventId}/`,
        `/events/events/${eventId}/`
      ];
      
      for (const endpoint of eventEndpoints) {
        try {
          console.log(`Trying to fetch event details from ${endpoint}`);
          const response = await api.get(endpoint);
          
          if (response?.data) {
            console.log(`Successfully fetched event details from ${endpoint}`);
            
            // Add formatted display fields for better UI
            const eventData = {
              ...response.data,
              formatted_date: new Date(response.data.event_time).toLocaleDateString(),
              formatted_time: new Date(response.data.event_time).toLocaleTimeString(),
              photos: response.data.photos || []
            };
            
            return eventData;
          }
        } catch (err) {
          console.log(`Failed to fetch event ${eventId} from ${endpoint}:`, err);
        }
      }
      
      console.warn(`Could not fetch details for event ${eventId} from any endpoint`);
      // Return minimal data that won't break UI
      return {
        id: eventId,
        event_name: "Event Information Unavailable",
        description: "Event details could not be loaded",
        event_time: new Date().toISOString(),
        venue: "Unknown Venue",
        photos: [],
        formatted_date: new Date().toLocaleDateString(),
        formatted_time: new Date().toLocaleTimeString()
      };
    } catch (error) {
      console.error(`Error in fetchEventDetails for event ${eventId}:`, error);
      // Return minimal data that won't break UI
      return {
        id: eventId,
        event_name: "Event Information Unavailable",
        description: "Event details could not be loaded",
        event_time: new Date().toISOString(),
        venue: "Unknown Venue",
        photos: [],
        formatted_date: new Date().toLocaleDateString(),
        formatted_time: new Date().toLocaleTimeString()
      };
    }
  };

  // Fetch user participations (registered events)
  const fetchUserParticipations = async () => {
    try {
      console.log("Fetching user participations");
      
      const endpoints = [
        "/events/participants/my_participations/",
        "/api/events/participants/my_participations/",
        "/participants/my_participations/",
        "/api/participants/my_participations/"
      ];
      
      const response = await api.tryMultipleEndpoints(endpoints, 'get');
      
      if (response && response.data) {
        console.log(`Successfully fetched ${response.data.length} participations`);
        setUserParticipations(response.data);
        return response.data;
        } else {
        console.warn("Response format unexpected for participations", response);
        setUserParticipations([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching user participations:", error);
      setUserParticipations([]);
      return [];
    }
  };

  // Fetch upcoming events the user is registered for
  const fetchUpcomingEvents = async () => {
    try {
      // First get participations
      const participations = await fetchUserParticipations();
      
      if (!participations || participations.length === 0) {
        setUpcomingEvents([]);
        return;
      }
      
      // Extract event IDs
      const eventIds = participations.map(p => p.event);
      
      // Now fetch details for each event
      const upcomingEventsList = [];
      
      for (const eventId of eventIds) {
        try {
          // Try multiple endpoints for each event
          const eventEndpoints = [
            `/events/${eventId}/`,
            `/api/events/${eventId}/`,
            `/events/events/${eventId}/`
          ];
          
          let eventData = null;
          
          for (const endpoint of eventEndpoints) {
            try {
              const response = await api.get(endpoint);
              if (response?.data) {
                eventData = response.data;
                break;
              }
            } catch (err) {
              console.log(`Failed to fetch event ${eventId} from ${endpoint}`);
            }
          }
          
          if (eventData) {
            const eventDate = new Date(eventData.event_time);
          const now = new Date();
            
            // Only add to upcoming events if the event is in the future
            if (eventDate > now && eventData.status !== 'canceled') {
              upcomingEventsList.push(eventData);
            }
          }
        } catch (err) {
          console.log(`Error fetching details for event ${eventId}:`, err);
        }
      }
      
      setUpcomingEvents(upcomingEventsList);
        } catch (error) {
      console.error("Error fetching upcoming events:", error);
          setUpcomingEvents([]);
    }
  };

  // Fetch past events the user has attended
  const fetchPastEvents = async () => {
    try {
      // First get participations
      const participations = await fetchUserParticipations();
      
      if (!participations || participations.length === 0) {
        setPastEvents([]);
        return;
      }
      
      // Extract event IDs
      const eventIds = participations.map(p => p.event);
      
      // Now fetch details for each event
      const pastEventsList = [];
      
      for (const eventId of eventIds) {
        try {
          // Try multiple endpoints for each event
          const eventEndpoints = [
            `/events/${eventId}/`,
            `/api/events/${eventId}/`,
            `/events/events/${eventId}/`
          ];
          
          let eventData = null;
          
          for (const endpoint of eventEndpoints) {
            try {
              const response = await api.get(endpoint);
              if (response?.data) {
                eventData = response.data;
                break;
              }
            } catch (err) {
              console.log(`Failed to fetch event ${eventId} from ${endpoint}`);
            }
          }
          
          if (eventData) {
            const eventDate = new Date(eventData.event_time);
            const now = new Date();
            
            // Only add to past events if the event is in the past or completed
            if (eventDate < now || eventData.status === 'completed') {
              pastEventsList.push(eventData);
            }
          }
        } catch (err) {
          console.log(`Error fetching details for event ${eventId}:`, err);
        }
      }
      
      setPastEvents(pastEventsList);
    } catch (error) {
      console.error("Error fetching past events:", error);
      setPastEvents([]);
    }
  };

  // Update dashboard stats based on current events data
  const updateStats = () => {
    // Count only active events (non-canceled)
    const activeUpcomingEvents = upcomingEvents.filter(event => 
      event.status !== 'canceled' && event.status !== 'cancelled'
    );
    
    const activePastEvents = pastEvents.filter(event => 
      event.status !== 'canceled' && event.status !== 'cancelled'
    );
    
      setStats({
      registeredEvents: activeUpcomingEvents.length + activePastEvents.length,
      upcomingEvents: activeUpcomingEvents.length,
      completedEvents: activePastEvents.length
    });
    
    console.log("Updated stats:", {
      registeredEvents: activeUpcomingEvents.length + activePastEvents.length,
      upcomingEvents: activeUpcomingEvents.length,
      completedEvents: activePastEvents.length
    });
  };

  // Utility function to extract user ID from JWT token
  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        const decoded = jwtDecode(token);
        return decoded.user_id || decoded.id || null;
      }
      return null;
    } catch (error) {
      console.error("Error extracting user ID from token:", error);
      return null;
    }
  };

  const fetchAllEvents = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      // Try multiple endpoints to fetch events
      const endpoints = [
        "/events/", 
        "/api/events/", 
        "/",
        "/events/events/"
      ];
      
      console.log("Fetching all events for browse tab");
      
      // Use the tryMultipleEndpoints helper
      const response = await api.tryMultipleEndpoints(endpoints, 'get');
      
      // Process the response data
      let eventsData = [];
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // Direct array of events
          eventsData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Paginated results
          eventsData = response.data.results;
        } else if (response.data.events && Array.isArray(response.data.events)) {
          // Nested under 'events' key
          eventsData = response.data.events;
      } else {
          // Try to find any array in the response that might contain events
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              const firstItem = response.data[key][0];
              if (firstItem && (firstItem.event_name || firstItem.id || firstItem.title)) {
                eventsData = response.data[key];
                break;
              }
            }
          }
        }
      }
      
      // Update state with the events data
      console.log(`Found ${eventsData.length} events`);
      setAllEvents(eventsData);
      
    } catch (error) {
      console.error("Error fetching all events:", error);
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please login again.");
        handleLogout();
      } else {
        toast.error("Failed to load events. Please try refreshing the page.");
      }
      setAllEvents([]);
    } finally {
      if (showLoading) {
      setLoading(false);
      }
    }
  };

  const handleRegister = async (eventId) => {
    try {
      setRegistering(true);
      console.log(`Attempting to register for event ${eventId}`);
      
      // Use the correct API endpoint for registration
      const response = await api.post(`/events/participants/`, {
        event: eventId
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log("Registration response:", response.data);
        toast.success("Successfully registered for event!");
        
        // Update local state to reflect the new registration
        setAllEvents(allEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                is_registered: true,
                participants: [...(event.participants || []), {
                  user: user.id,
                  status: 'registered'
                }]
              } 
            : event
        ));
        
        // Refresh upcoming events
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Registration error:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Failed to register for event. Please try again.");
    } finally {
      setRegistering(false);
    }
  };
  
  const submitFeedback = async (eventId, rating, comment) => {
    try {
      const response = await api.post(`events/${eventId}/feedback/`, {
        rating,
        comment
      });
      
      if (response.status === 200 || response.status === 201) {
        toast.success("Thank you for your feedback!");
        // Refresh past events to show updated feedback
        const pastResponse = await api.get("events/user-events/past/");
        if (pastResponse.data) {
          setPastEvents(pastResponse.data);
        }
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem("user");
    navigate("/login_reg");
  };

  const handleCancelRegistration = async (eventId) => {
    if (!eventId || cancelingRegistration) {
      return;
    }

    if (!window.confirm('Are you sure you want to cancel your registration for this event?')) {
      return;
    }
    
    setCancelingRegistration(true);
    
    try {
      console.log(`Attempting to cancel registration for event ${eventId}`);
      
      // Define endpoints to try for cancellation using POST method
      const cancelEndpoints = [
        `/events/participants/cancel/${eventId}/`,
        `/api/events/participants/cancel/${eventId}/`,
        `/participants/cancel/${eventId}/`,
        `/events/participants/${eventId}/cancel/`,
        `/api/events/participants/${eventId}/cancel/`
      ];
      
      try {
        // Try POST method first for cancellation
        await tryMultipleEndpoints(cancelEndpoints, 'post');
        
        console.log('Registration canceled successfully with POST method');
        toast.success('Your registration has been canceled successfully');
        
        // Update local state to remove the canceled event from upcoming events
        setUpcomingEvents(prev => prev.filter(event => event.id !== eventId));
        
        // Refresh dashboard data to reflect the changes
        fetchDashboardData();
        
        // Dispatch custom event so other components can react to the cancellation
        window.dispatchEvent(new CustomEvent('registration-canceled', {
          detail: { eventId }
        }));
      } catch (postError) {
        console.error('Failed to cancel registration with POST method, trying DELETE:', postError);
        
        // If POST fails, try DELETE method
        try {
          const deleteEndpoints = [
            `/events/participants/${eventId}/`,
            `/api/events/participants/${eventId}/`,
            `/participants/${eventId}/`
          ];
          
          await tryMultipleEndpoints(deleteEndpoints, 'delete');
          
          console.log('Registration canceled successfully with DELETE method');
          toast.success('Your registration has been canceled successfully');
          
          // Update local state to remove the canceled event from upcoming events
          setUpcomingEvents(prev => prev.filter(event => event.id !== eventId));
          
          // Refresh dashboard data to reflect the changes
          fetchDashboardData();
          
          // Dispatch custom event so other components can react to the cancellation
          window.dispatchEvent(new CustomEvent('registration-canceled', {
            detail: { eventId }
          }));
        } catch (deleteError) {
          console.error('Failed to cancel registration with DELETE method:', deleteError);
          toast.error('Failed to cancel your registration. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Registration cancellation error:', error);
      toast.error('An error occurred while canceling your registration.');
    } finally {
      setCancelingRegistration(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterOptions({
      ...filterOptions,
      [name]: value
    });
  };

  const filteredEvents = allEvents && Array.isArray(allEvents) ? allEvents.filter(event => {
    // Search query filter - handle missing fields gracefully
    const eventName = (event.event_name || "").toLowerCase();
    const eventDesc = (event.description || "").toLowerCase();
    const eventVenue = (event.venue || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = !query || 
      eventName.includes(query) || 
      eventDesc.includes(query) || 
      eventVenue.includes(query);
    
    // Filter options - handle missing fields gracefully
    const locationFilter = filterOptions.location.toLowerCase();
    const matchesLocation = !locationFilter || eventVenue.includes(locationFilter);
    
    const categoryFilter = filterOptions.type.toLowerCase();
    const eventCategory = (event.event_type || event.category || "").toLowerCase();
    const matchesType = !categoryFilter || eventCategory === categoryFilter;
    
    // Handle date filtering with proper date comparison
    let matchesDate = true;
    if (filterOptions.date) {
      try {
        const filterDate = new Date(filterOptions.date).toISOString().split('T')[0];
        const eventDate = new Date(event.event_time).toISOString().split('T')[0];
        matchesDate = eventDate === filterDate;
      } catch (e) {
        console.warn("Date comparison error:", e);
        matchesDate = true; // On error, include the event
      }
    }
    
    return matchesSearch && matchesLocation && matchesType && matchesDate;
  }) : [];

  // Update fetchUserProfile to check coordinator request status
  const fetchUserProfile = async () => {
    setIsLoadingProfile(true);
    try {
      // Prioritize the known working endpoint first based on logs
      const endpoints = [
        'api/profile/',       // This works based on logs
        'auth/users/me/',     // This should work based on backend routes
        'api/users/profile/', // Try additional compatibility endpoints
        'users/profile/',
        'api/users/me/',
        'users/me/'
      ];
      
      console.log('Fetching user profile data');
      let success = false;
      let userData = null;
      let lastError = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch profile from: ${endpoint}`);
          const response = await api.get(endpoint);
          
          console.log(`Successfully fetched profile from: ${endpoint}`, response.data);
          success = true;
            userData = response.data;
          
          // Format the user data consistently
          if (userData) {
            // Ensure consistent field names
            const formattedUserData = {
              id: userData.id || userData.pk || userData.user_id,
              username: userData.username,
              email: userData.email,
              first_name: userData.first_name,
              last_name: userData.last_name,
              bio: userData.bio || userData.profile?.bio,
              profile_picture: userData.profile_picture || userData.profile?.profile_picture,
              is_coordinator: userData.is_coordinator || userData.profile?.is_coordinator || userData.user_role === 'coordinator' || false,
              coordinator_request: userData.coordinator_request || false
            };
            
            setUserProfile(formattedUserData);
            
            // Update coordinator request status
            setHasCoordinatorRequest(!!formattedUserData.coordinator_request);
            if (formattedUserData.is_coordinator) {
              setCoordinatorRequestStatus('approved');
            } else if (formattedUserData.coordinator_request) {
              setCoordinatorRequestStatus('pending');
            } else {
              setCoordinatorRequestStatus(null);
            }
            
            // Update localStorage for fallback purposes
            localStorage.setItem('user', JSON.stringify(formattedUserData));
            
            break; // Exit loop on success
          }
        } catch (error) {
          console.error(`Error fetching profile from ${endpoint}:`, error);
          lastError = error;
        }
      }
      
      if (!success) {
        // Try to use profile data from localStorage as fallback
        const fallbackData = tryUseLocalStorageForProfile();
        
        if (fallbackData) {
          console.log('Using localStorage fallback for profile data');
          setUserProfile(fallbackData);
          
          // Update coordinator request status from localStorage data
          setHasCoordinatorRequest(!!fallbackData.coordinator_request);
          if (fallbackData.is_coordinator) {
            setCoordinatorRequestStatus('approved');
          } else if (fallbackData.coordinator_request) {
            setCoordinatorRequestStatus('pending');
          } else {
            setCoordinatorRequestStatus(null);
        }
      } else {
          console.error('Failed to fetch user profile from any endpoint');
          toast.error('Failed to load profile data');
        }
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      
      // Try to use localStorage as final fallback
      const fallbackData = tryUseLocalStorageForProfile();
      if (fallbackData) {
        console.log('Using localStorage as final fallback for profile data');
        setUserProfile(fallbackData);
        
        // Update coordinator request status from localStorage data
        setHasCoordinatorRequest(!!fallbackData.coordinator_request);
        if (fallbackData.is_coordinator) {
          setCoordinatorRequestStatus('approved');
        } else if (fallbackData.coordinator_request) {
          setCoordinatorRequestStatus('pending');
        } else {
          setCoordinatorRequestStatus(null);
        }
      } else {
        toast.error('An error occurred while loading your profile');
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  // Helper function to try to extract profile info from localStorage
  const tryUseLocalStorageForProfile = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedData = JSON.parse(userData);
        
        // Format the profile data from localStorage
        return {
          id: parsedData.id || parsedData.pk || parsedData.user_id,
          username: parsedData.username,
          email: parsedData.email,
          first_name: parsedData.first_name,
          last_name: parsedData.last_name,
          bio: parsedData.bio || '',
          profile_picture: parsedData.profile_picture || null
        };
      }
    } catch (error) {
      console.error('Error reading profile from localStorage:', error);
    }
    return null;
  };
  
  // Handle profile update
  const handleUpdateProfile = async () => {
    if (isUpdating) return;
    
    // Validate form
    if (profileForm.password !== profileForm.confirm_password) {
      toast.error("Passwords don't match");
        return;
      }
      
    setIsUpdating(true);
      
    try {
      // Create form data object
      const formData = new FormData();
      if (profileForm.username) formData.append('username', profileForm.username);
      if (profileForm.first_name) formData.append('first_name', profileForm.first_name);
      if (profileForm.last_name) formData.append('last_name', profileForm.last_name);
      if (profileForm.email) formData.append('email', profileForm.email);
      if (profileForm.bio) formData.append('bio', profileForm.bio);
      if (profileForm.password) formData.append('password', profileForm.password);
      if (profileForm.profile_picture) formData.append('profile_picture', profileForm.profile_picture);
      
      // Define endpoints to try, prioritizing the working endpoint based on logs
      const updateEndpoints = [
        'api/profile/', // This works based on logs - try first
        'auth/users/me/', // This should work based on backend routes
        'api/users/profile/',
        'users/profile/',
        'api/users/me/',
        'users/me/'
      ];
      
      // Create config with correct headers for multipart/form-data
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      console.log('Updating profile with form data');
      
      let success = false;
      let lastError = null;
      let responseData = null;
      
      // Try each endpoint until one works
      for (const endpoint of updateEndpoints) {
        try {
          console.log(`Trying to update profile at ${endpoint}`);
          const response = await api.patch(endpoint, formData, config);
          
            console.log(`Profile updated successfully at ${endpoint}`);
            success = true;
          responseData = response.data;
          
          // Update the user profile state
          setUserProfile({
            ...userProfile,
            ...responseData
          });
          
          // Update localStorage with new profile data
          try {
            const userData = JSON.parse(localStorage.getItem("user") || "{}");
            const updatedUserData = {
              ...userData,
              ...responseData,
              profile_picture: responseData.profile_picture || userData.profile_picture
            };
            localStorage.setItem("user", JSON.stringify(updatedUserData));
          } catch (e) {
            console.error("Failed to update localStorage:", e);
          }
          
          break; // Exit the loop on success
        } catch (error) {
          console.error(`Failed to update profile at ${endpoint}:`, error);
          lastError = error;
        }
      }
      
      if (success) {
        toast.success('Profile updated successfully!');
        
        // Close the modal
        closeProfileEditModal();
        
        // If the profile picture was updated, clear the file input
        if (profileForm.profile_picture && responseData?.profile_picture) {
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          // Clear preview
          setProfilePhotoPreview(null);
        }
        
        // Refetch user profile to get latest data
        fetchUserProfile();
      } else {
        console.error('All profile update endpoints failed:', lastError);
        toast.error(`Failed to update profile: ${lastError?.response?.data?.detail || lastError?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('An error occurred while updating your profile.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const closeProfileEditModal = () => {
    setShowProfileEditModal(false);
  };

  // Add the handleCoordinatorRequest function
  const handleCoordinatorRequest = async () => {
    // Ask for confirmation before submitting request
    const confirmed = window.confirm(
      "Would you like to request coordinator privileges? This will allow you to create and manage events."
    );

    if (!confirmed) return;

    // Set loading state
    setLoading(true);
    
    // Define the endpoints to try
    const endpoints = [
      "/api/users/request-coordinator/",
      "/users/request-coordinator/",
      "/auth/request-coordinator/"
    ];
    
    try {
      // Try each endpoint using POST method
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        try {
          const response = await api.post(endpoint);
          console.log(`Successfully submitted coordinator request via ${endpoint}`, response.data);
          
          // Update state to show pending request
        setHasCoordinatorRequest(true);
          setUserProfile(prev => ({
            ...prev,
            coordinator_request: true,
            has_coordinator_request: true
          }));
          
          // Show success message
          toast.success("Coordinator request submitted successfully. You will be notified when it's approved.");
          setLoading(false);
          return;
        } catch (error) {
          console.log(`Failed to submit coordinator request via ${endpoint}:`, error);
          // Continue to next endpoint if this one fails
        }
      }
      
      // If we reached here, all endpoints failed
      throw new Error("All endpoints failed for coordinator request");
    } catch (error) {
      console.error("Error submitting coordinator request:", error);
      toast.error("Unable to submit coordinator request. Please try again later.");
      setLoading(false);
    }
  };

  const generateActivityFeed = () => {
    const activities = [];
    const now = new Date();

    // Add upcoming events as activities (newest first)
    if (upcomingEvents && upcomingEvents.length > 0) {
      // Sort by registration date if available, otherwise by event date
      const sortedUpcoming = [...upcomingEvents].sort((a, b) => {
        const dateA = new Date(a.registered_at || a.created_at || a.event_time);
        const dateB = new Date(b.registered_at || b.created_at || b.event_time);
        return dateB - dateA; // Sort descending (newest first)
      });

      // Add the 3 most recent upcoming event registrations
      sortedUpcoming.slice(0, 3).forEach(event => {
        const registrationDate = new Date(event.registered_at || event.created_at || now);
        const timeAgo = getTimeAgo(registrationDate);
        
        activities.push({
          type: 'registration',
          icon: <FaTicketAlt className={styles.activityIconTicket} />,
          text: `You registered for "${event.event_name}"`,
          time: timeAgo,
          date: registrationDate,
          eventId: event.id
        });
      });
    }
    
    // Add recent completed events
    if (pastEvents && pastEvents.length > 0) {
      // Sort by event date (newest first)
      const recentPastEvents = [...pastEvents]
        .sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
        .slice(0, 3);
      
      recentPastEvents.forEach(event => {
        const eventDate = new Date(event.event_time);
        const timeAgo = getTimeAgo(eventDate);
        
      activities.push({
          type: 'attended',
          icon: <FaUsers className={styles.activityIconUsers} />,
          text: `You attended "${event.event_name}"`,
          time: timeAgo,
          date: eventDate,
          eventId: event.id
        });
      });
    }

    // Add recently bookmarked events
    if (bookmarkedEvents && bookmarkedEvents.length > 0) {
      // Sort by bookmark date if available (newest first)
      const sortedBookmarks = [...bookmarkedEvents]
        .filter(event => event.created_at || event.bookmarked_at || event.event_time)
        .sort((a, b) => {
          const dateA = new Date(a.bookmarked_at || a.created_at || a.event_time);
          const dateB = new Date(b.bookmarked_at || b.created_at || b.event_time);
          return dateB - dateA;
        })
        .slice(0, 2); // Just get 2 most recent bookmarks
      
      sortedBookmarks.forEach(event => {
        const bookmarkDate = new Date(event.bookmarked_at || event.created_at || now);
        const timeAgo = getTimeAgo(bookmarkDate);
        
        activities.push({
          type: 'bookmark',
          icon: <FaRegBookmark className={styles.activityIconBookmark} />,
          text: `You bookmarked "${event.event_name}"`,
          time: timeAgo,
          date: bookmarkDate,
          eventId: event.id
        });
      });
    }
    
    // If we have user profile data and it was recently updated
    if (userProfile && userProfile.updated_at) {
      const updateDate = new Date(userProfile.updated_at);
      // Only include if update was in the last 7 days
      if ((now - updateDate) < 7 * 24 * 60 * 60 * 1000) { 
      activities.push({
          type: 'profile',
          icon: <FaUserEdit className={styles.activityIconUser} />,
          text: "You updated your profile",
          time: getTimeAgo(updateDate),
          date: updateDate
        });
      }
    }

    // Sort all activities by date (newest first)
    const sortedActivities = activities.sort((a, b) => b.date - a.date);
    
    // Update activity feed with our generated data (limit to 5 items)
    setActivityFeed(sortedActivities.slice(0, 5));
  };

  // Helper function to format elapsed time
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    // For older dates, show actual date
    return date.toLocaleDateString();
  };

  const validateProfileUpdate = (profileData) => {
    const errors = {};
    let isValid = true;
    let message = "";

    // Check for empty fields
    if (!profileData.first_name || profileData.first_name.trim() === "") {
      errors.first_name = "First name is required";
      isValid = false;
      message = "First name is required";
    }

    if (!profileData.last_name || profileData.last_name.trim() === "") {
      errors.last_name = "Last name is required";
      isValid = false;
      if (!message) message = "Last name is required";
    }

    if (!profileData.username || profileData.username.trim() === "") {
      errors.username = "Username is required";
      isValid = false;
      if (!message) message = "Username is required";
    }

    if (!profileData.email || profileData.email.trim() === "") {
      errors.email = "Email is required";
      isValid = false;
      if (!message) message = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = "Email address is invalid";
      isValid = false;
      if (!message) message = "Email address is invalid";
    }

    // Return both errors object and validity status
    return { errors, isValid, message };
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openProfileEditModal = () => {
    // This function is now deprecated - we're using handleOpenProfileEditModal instead
    // For compatibility, just forward to the new function
    handleOpenProfileEditModal();
  };
  
  // Handle profile picture selection
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileForm({
        ...profileForm,
        profile_picture: file
      });
      // Create preview URL
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };
  
  // Handle form field changes
  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value
    });
  };

  // Initialize the profile form when the modal opens
  const handleOpenProfileEditModal = () => {
    console.log('Opening profile edit modal with data:', userProfile);
    
    // Make sure we have user profile data
    if (!userProfile || Object.keys(userProfile).length === 0) {
      toast.error('Unable to load profile data for editing');
      return;
    }
    
    // Reset the profile form with current user data
    setProfileForm({
      username: userProfile.username || '',
      first_name: userProfile.first_name || '',
      last_name: userProfile.last_name || '',
      email: userProfile.email || '',
      bio: userProfile.bio || '',
      password: '',
      confirm_password: '',
      profile_picture: null
    });
    
    // Reset the profile photo preview if there's a current profile picture
    if (userProfile.profile_picture) {
      const profilePicUrl = getMediaUrl(userProfile.profile_picture);
      console.log('Setting profile picture preview from existing photo:', profilePicUrl);
      setProfilePhotoPreview(null); // Reset first to avoid stale data
    } else {
      setProfilePhotoPreview(null);
    }
    
    setShowProfileEditModal(true);
  };
  
  // ProfileEditModal component
  const ProfileEditModal = () => {
    return (
      <Modal show={showProfileEditModal} onHide={closeProfileEditModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className={profileStyles.profilePictureContainer}>
              <div className={profileStyles.profilePictureWrapper}>
                {profilePhotoPreview || (userProfile.profile_picture && getMediaUrl(userProfile.profile_picture)) ? (
                  <img 
                    src={profilePhotoPreview || getMediaUrl(userProfile.profile_picture)} 
                    alt="Profile Preview" 
                    className={profileStyles.profilePicture}
                  />
                ) : (
                  <div className={profileStyles.profilePlaceholder}>
                    {userProfile.first_name && userProfile.last_name 
                      ? `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}` 
                      : userProfile.username?.substring(0, 2) || "U"}
            </div>
                )}
                <div className={profileStyles.uploadOverlay} onClick={() => document.getElementById("profilePictureInput").click()}>
                  <FaCamera size={24} />
                  <span>Change Photo</span>
            </div>
          </div>
              <input
                type="file"
                id="profilePictureInput"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfilePictureChange}
              />
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={profileForm.username}
                onChange={handleProfileFormChange}
              />
            </Form.Group>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={profileForm.first_name}
                    onChange={handleProfileFormChange}
                  />
                </Form.Group>
            </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={profileForm.last_name}
                    onChange={handleProfileFormChange}
                  />
                </Form.Group>
          </div>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileFormChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileFormChange}
              />
            </Form.Group>
            
            <hr />
            <h5>Change Password (Optional)</h5>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={profileForm.password}
                    onChange={handleProfileFormChange}
                  />
                </Form.Group>
            </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirm_password"
                    value={profileForm.confirm_password}
                    onChange={handleProfileFormChange}
                  />
                </Form.Group>
          </div>
        </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeProfileEditModal}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateProfile}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Saving...</span>
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const renderProfile = () => {
    return (
      <div className={`${styles.dashboardContent} ${styles.profileContainer}`}>
        <div className={styles.profileHeader}>
          <h2>Profile</h2>
            </div>
        
        <div className={styles.profileSection}>
          <div className={styles.profilePhoto}>
            {userProfile.profile_picture ? (
              <img 
                src={getMediaUrl(userProfile.profile_picture)} 
                alt="Profile" 
                className={styles.profileImage}
              />
            ) : (
              <div className={styles.profilePlaceholder}>
                {userProfile.username?.charAt(0) || userProfile.email?.charAt(0) || 'U'}
            </div>
            )}
          </div>
          
          <div className={styles.profileInfo}>
            <h3>{userProfile.username || userProfile.email}</h3>
            <p>{userProfile.email}</p>
            <p>Member since: {new Date(userProfile.date_joined || userProfile.created_at).toLocaleDateString()}</p>
            
            <div className={styles.profileActions}>
              <button 
                className={`${styles.actionButton} ${styles.primaryButton}`}
                onClick={() => navigate('/profile/edit')}
              >
                Edit Profile
          </button>
              
              <button 
                className={`${styles.actionButton} ${styles.secondaryButton}`}
                onClick={() => navigate('/profile/security')}
              >
                Security Settings
              </button>
              
              {/* Coordinator Role Section */}
              {userProfile.is_coordinator || userProfile.isCoordinator ? (
                <div className={`${styles.statusBadge} ${styles.approvedBadge}`}>
                  <span>Coordinator Status: Approved</span>
            </div>
              ) : hasCoordinatorRequest || userProfile.coordinator_request || userProfile.has_coordinator_request ? (
                <div className={`${styles.statusBadge} ${styles.pendingBadge}`}>
                  <span>Coordinator Request: Pending Approval</span>
            </div>
              ) : (
                <button
                  className={`${styles.actionButton} ${styles.specialButton}`}
                  onClick={handleCoordinatorRequest}
                >
                  Request Coordinator Role
          </button>
              )}
            </div>
            </div>
            </div>
        
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{upcomingEvents.length}</span>
            <span className={styles.statLabel}>Upcoming Events</span>
            </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{pastEvents.length}</span>
            <span className={styles.statLabel}>Past Events</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{bookmarkedEvents.length}</span>
            <span className={styles.statLabel}>Bookmarked</span>
          </div>
        </div>
        
        {/* Account Settings Section */}
        <div className={styles.settingsSection}>
          <h3>Account Settings</h3>
          <div className={styles.settingsButtons}>
            <button 
              className={styles.settingButton}
              onClick={() => navigate('/profile/notifications')}
            >
              Notification Preferences
            </button>
            <button 
              className={styles.settingButton}
              onClick={() => navigate('/profile/preferences')}
            >
              App Preferences
          </button>
          </div>
        </div>
      </div>
    );
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Define endpoints to try
      const deleteEndpoints = [
        'api/profile/delete/',
        'users/delete/',
        'auth/users/me/',
        'api/users/me/'
      ];
      
      console.log('Attempting to delete account');
      
      try {
        // Try DELETE requests first
        await tryMultipleEndpoints(deleteEndpoints, 'delete');
        
        console.log('Account deleted successfully');
        toast.success('Your account has been deleted successfully.');
        
        // Clear localStorage and redirect to login
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem("user");
        
        navigate("/login_reg");
      } catch (deleteError) {
        console.error('Failed to delete account with DELETE method, trying POST:', deleteError);
        
        // If DELETE fails, try POST to some endpoints that might require POST
        try {
          const postEndpoints = [
            'api/profile/delete/',
            'users/delete/'
          ];
          
          await tryMultipleEndpoints(postEndpoints, 'post');
          
          console.log('Account deleted successfully with POST method');
          toast.success('Your account has been deleted successfully.');
          
          // Clear localStorage and redirect to login
          localStorage.removeItem(ACCESS_TOKEN);
          localStorage.removeItem(REFRESH_TOKEN);
          localStorage.removeItem("user");
          
          navigate("/login_reg");
        } catch (postError) {
          console.error('Failed to delete account with POST method:', postError);
          toast.error('Failed to delete your account. Please contact support.');
        }
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error('An error occurred while deleting your account.');
    }
  };

  // Function to render the appropriate content based on active tab
  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className={styles.dashboardOverview}>
            {errorMessage && (
              <div className={styles.errorMessage}>
                <FaExclamationTriangle /> {errorMessage}
              </div>
            )}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <FaCalendarAlt />
                </div>
                <div className={styles.statInfo}>
                  <h3>{stats.registeredEvents}</h3>
                  <p>My Registrations</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <FaTicketAlt />
                </div>
                <div className={styles.statInfo}>
                  <h3>{stats.upcomingEvents}</h3>
                  <p>Upcoming Events</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <FaRegBookmark />
                </div>
                <div className={styles.statInfo}>
                  <h3>{bookmarkedEvents.length}</h3>
                  <p>Bookmarked</p>
                </div>
              </div>
              {userProfile?.is_coordinator && (
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <FaUserPlus />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{coordinatorStats.participantsCount}</h3>
                    <p>Total Participants</p>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.dashboardSections}>
              {/* Events I'm attending section */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Upcoming Events</h3>
                  <button 
                    className={styles.viewAllLink}
                    onClick={() => setActiveTab("myEvents")}
                  >
                    View All
                  </button>
                </div>
                
                {upcomingEvents.length > 0 ? (
                  <div className={styles.eventList}>
                    {upcomingEvents.slice(0, 3).map(event => (
                      <div key={event.id} className={styles.eventItem} onClick={() => navigate(`/events/${event.id}`)}>
                        <div className={styles.eventDate}>
                          <span className={styles.eventDay}>
                            {new Date(event.event_time).getDate()}
                          </span>
                          <span className={styles.eventMonth}>
                            {new Date(event.event_time).toLocaleString('default', { month: 'short' })}
                          </span>
                        </div>
                        <div className={styles.eventContent}>
                          <h4 className={styles.eventTitle}>{event.event_name}</h4>
                          <div className={styles.eventInfo}>
                            <p><FaMapMarkerAlt /> {event.venue}</p>
                            <p><FaClock /> {event.formatted_time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <FaCalendarAlt />
                    </div>
                    <p>You haven't registered for any upcoming events.</p>
                    <button className={styles.primaryButton} onClick={() => setActiveTab("browse")}>
                      Browse Events
                    </button>
                  </div>
                )}
              </div>
              
              {/* Events I've Created (Coordinator Only) */}
              {userProfile?.is_coordinator && (
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>My Created Events</h3>
                    <button 
                      className={styles.viewAllLink}
                      onClick={() => navigate("/coordinator-dashboard")}
                    >
                      View All
                    </button>
                  </div>
                  
                  {coordinatorEvents.length > 0 ? (
                    <div className={styles.eventList}>
                      {coordinatorEvents.slice(0, 3).map(event => (
                        <div key={event.id} className={styles.eventItem} onClick={() => navigate(`/events/${event.id}`)}>
                          <div className={styles.eventDate}>
                            <span className={styles.eventDay}>
                              {new Date(event.event_time).getDate()}
                            </span>
                            <span className={styles.eventMonth}>
                              {new Date(event.event_time).toLocaleString('default', { month: 'short' })}
                            </span>
                          </div>
                          <div className={styles.eventContent}>
                            <h4 className={styles.eventTitle}>{event.event_name}</h4>
                            <div className={styles.eventInfo}>
                              <p><FaMapMarkerAlt /> {event.venue}</p>
                              <p><FaUserFriends /> {event.participant_count || 0} / {event.max_participants || 'Unlimited'}</p>
                            </div>
                          </div>
                          <div className={styles.eventStatus}>
                            <span className={styles[getStatusInfo(event.status).class]}>
                              {getStatusInfo(event.status).text}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyStateIcon}>
                        <FaCalendar />
                      </div>
                      <p>You haven't created any events yet.</p>
                      <button className={styles.primaryButton} onClick={() => navigate("/create-event")}>
                        Create Event
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Analytics Section (Coordinator Only) */}
              {userProfile?.is_coordinator && (
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Event Analytics</h3>
                  </div>
                  
                  <div className={styles.analyticsGrid}>
                    <div className={styles.analyticItem}>
                      <div className={styles.analyticIcon}>
                        <FaChartBar />
                      </div>
                      <div className={styles.analyticInfo}>
                        <h4>{coordinatorStats.totalEvents}</h4>
                        <p>Total Events</p>
                      </div>
                    </div>
                    <div className={styles.analyticItem}>
                      <div className={styles.analyticIcon}>
                        <FaCalendarCheck />
                      </div>
                      <div className={styles.analyticInfo}>
                        <h4>{coordinatorStats.completedEvents}</h4>
                        <p>Completed</p>
                      </div>
                    </div>
                    <div className={styles.analyticItem}>
                      <div className={styles.analyticIcon}>
                        <FaCalendarMinus />
                      </div>
                      <div className={styles.analyticInfo}>
                        <h4>{coordinatorStats.canceledEvents}</h4>
                        <p>Canceled</p>
                      </div>
                    </div>
                    <div className={styles.analyticItem}>
                      <div className={styles.analyticIcon}>
                        <FaCalendarPlus />
                      </div>
                      <div className={styles.analyticInfo}>
                        <h4>{coordinatorStats.upcomingEvents}</h4>
                        <p>Upcoming</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.analyticsActions}>
                    <button 
                      className={styles.analyticsButton} 
                      onClick={() => navigate("/coordinator-dashboard")}
                    >
                      <FaChartLine /> Full Analytics
                    </button>
                    <button 
                      className={styles.analyticsButton}
                      onClick={() => navigate("/create-event")}
                    >
                      <FaPlus /> Create Event
                    </button>
                  </div>
                </div>
              )}
              
              {/* Recent Activity Section */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Recent Activity</h3>
                </div>
                
                {activityFeed.length > 0 ? (
                  <div className={styles.activityFeed}>
                    {activityFeed.map((activity, index) => (
                      <div key={index} className={styles.activityItem}>
                        <div className={styles.activityIcon}>{activity.icon}</div>
                        <div className={styles.activityContent}>
                          <p className={styles.activityText}>{activity.text}</p>
                          <span className={styles.activityTime}>{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No recent activity to show.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "myEvents":
    return (
      <div className={styles.myEventsContainer}>
            <div className={styles.eventsHeader}>
              <h2>Upcoming Events</h2>
            </div>
        
          {upcomingEvents.length > 0 ? (
            <div className={styles.eventsList}>
                {upcomingEvents.map(event => (
                  <div key={event.id} className={styles.eventCard}>
                    <div className={styles.eventCardHeader}>
                  <div className={styles.eventDate}>
                    <span className={styles.eventDay}>
                      {new Date(event.event_time).getDate()}
                    </span>
                    <span className={styles.eventMonth}>
                          {new Date(event.event_time).toLocaleString('default', { month: 'short' })}
                    </span>
                      </div>
                      <h3 className={styles.eventTitle}>{event.event_name}</h3>
                  </div>
                  <div className={styles.eventCardContent}>
                      <p className={styles.eventDescription}>
                        {event.description ? 
                          (event.description.length > 120 ? 
                            `${event.description.substring(0, 120)}...` : 
                            event.description) : 
                          'No description available'}
                      </p>
                    <div className={styles.eventDetails}>
                        <p>
                          <span className={styles.eventDetailIcon}><FaMapMarkerAlt /></span> 
                          {event.venue}
                        </p>
                        <p>
                          <span className={styles.eventDetailIcon}><FaClock /></span> 
                          {event.formatted_time}
                        </p>
                    </div>
                      <div className={styles.eventActions}>
                        <button 
                          className={styles.viewDetailsButton} 
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          View Details
                        </button>
                        <button 
                          className={styles.cancelButton} 
                          onClick={() => handleCancelRegistration(event.id)}
                          disabled={cancelingRegistration}
                        >
                          {cancelingRegistration ? 'Canceling...' : 'Cancel Registration'}
                        </button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <FaCalendarAlt />
                </div>
                <p>You haven't registered for any upcoming events.</p>
                <button className={styles.primaryButton} onClick={() => setActiveTab("browse")}>
                  Browse Events
                </button>
              </div>
            )}
            
            <div className={styles.eventsHeader}>
              <h2>Past Events</h2>
        </div>
        
          {pastEvents.length > 0 ? (
              <div className={styles.pastEventsList}>
                {pastEvents.map(event => (
                  <div key={event.id} className={styles.pastEventCard}>
                    <div className={styles.pastEventContent}>
                    <h4>{event.event_name}</h4>
                      <p>
                        <FaCalendarAlt /> {event.formatted_date} • <FaClock /> {event.formatted_time}
                      </p>
                      <p>
                        <FaMapMarkerAlt /> {event.venue}
                      </p>
                      <button 
                        className={styles.viewDetailsButton} 
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        View Details
                      </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
              <div className={styles.emptyState}>
                <p>You haven't attended any past events.</p>
              </div>
          )}
      </div>
    );

      case "browse":
    return (
      <div className={styles.browseEventsContainer}>
            <div className={styles.sectionTitle}>
        <h2>Browse Events</h2>
              <p>Discover and register for amazing events</p>
            </div>
        
            <div className={styles.filterContainer}>
          <div className={styles.searchBox}>
                <span className={styles.searchIcon}><FaSearch /></span>
            <input
              type="text"
                  className={styles.searchInput}
                  placeholder="Search events by name, description, or location..."
              value={searchQuery}
              onChange={handleSearch}
                />
                <button
                  onClick={handleRefresh}
                  className={`${styles.refreshButton} ${refreshing ? styles.spinning : ''}`}
                  disabled={refreshing}
                  title="Refresh Events"
                >
                  <FaSync />
                </button>
              </div>
              
              <div className={styles.filterButtons}>
                <button
                  className={filter === "all" ? styles.active : ""}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  className={filter === "upcoming" ? styles.active : ""}
                  onClick={() => setFilter("upcoming")}
                >
                  Upcoming
                </button>
                <button
                  className={filter === "completed" ? styles.active : ""}
                  onClick={() => setFilter("completed")}
                >
                  Completed
                </button>
                <button
                  className={filter === "canceled" ? styles.active : ""}
                  onClick={() => setFilter("canceled")}
                >
                  Canceled
                </button>
                <button
                  className={filter === "registered" ? styles.active : ""}
                  onClick={() => setFilter("registered")}
                >
                  My Events
                </button>
              </div>
              
            <button 
              className={styles.filterButton} 
              onClick={() => setShowFilters(!showFilters)}
            >
                <FaFilter /> {showFilters ? 'Hide Filters' : 'More Filters'}
            </button>
          </div>
          
          {showFilters && (
            <div className={styles.filterOptions}>
              <div className={styles.filterGroup}>
                <label>Location</label>
                <input
                  type="text"
                    className={styles.filterInput}
                  name="location"
                  value={filterOptions.location}
                  onChange={handleFilterChange}
                    placeholder="Enter location"
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Date</label>
                <input
                  type="date"
                    className={styles.filterInput}
                  name="date"
                  value={filterOptions.date}
                  onChange={handleFilterChange}
                />
              </div>
              <div className={styles.filterGroup}>
                  <label>Category</label>
                <select
                    className={styles.filterSelect}
                  name="type"
                  value={filterOptions.type}
                  onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    <option value="concert">Concert</option>
                    <option value="conference">Conference</option>
                    <option value="exhibition">Exhibition</option>
                    <option value="sport">Sport</option>
                    <option value="workshop">Workshop</option>
                    <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}
        
        {loading ? (
              <div className={styles.loaderContainer}>
          <div className={styles.loader}>Loading events...</div>
              </div>
            ) : (
              <div className={styles.eventsGrid}>
                {allEvents
                  .filter(event => {
                    // Filter by search term
                    const matchesSearch = event.event_name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
                                         event.description?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
                                         event.venue?.toLowerCase()?.includes(searchQuery.toLowerCase());
                    
                    // Filter by event status
                    const matchesFilter = filter === "all" || 
                                        (filter === "registered" && isUserRegistered(event.id)) ||
                                        (event.status?.toLowerCase() === filter);
                    
                    // Filter by location if specified
                    const matchesLocation = !filterOptions.location || 
                                           event.venue?.toLowerCase()?.includes(filterOptions.location.toLowerCase());
                    
                    // Filter by date if specified
                    const matchesDate = !filterOptions.date || 
                                       new Date(event.event_time).toLocaleDateString() === new Date(filterOptions.date).toLocaleDateString();
                    
                    // Filter by category/type if specified
                    const matchesType = !filterOptions.type || 
                                       event.event_type?.toLowerCase() === filterOptions.type.toLowerCase();
                    
                    return matchesSearch && matchesFilter && matchesLocation && matchesDate && matchesType;
                  })
                  .map(event => {
                    const statusInfo = getStatusInfo(event.status);
                    
                    return (
                      <div
                        key={event.id}
                        className={styles.eventCard}
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <div className={styles.eventImage}>
                          <img
                            src={event.photos?.[0]?.photo_url || "/default-event.jpg"}
                            alt={event.event_name}
                          />
                          <div className={styles.eventStatus}>
                            <span className={styles[statusInfo.class]}>
                              {statusInfo.text}
                            </span>
                          </div>
                          {isUserRegistered(event.id) && (
                            <div className={styles.enrolledBadge}>
                              <FaUserCheck /> Enrolled
                    </div>
                  )}
                </div>
                        
                        <div className={styles.eventContent}>
                  <h3>{event.event_name}</h3>
                          <div className={styles.eventDetails}>
                            <p>
                              <FaCalendarAlt />
                              {new Date(event.event_time).toLocaleDateString()}
                            </p>
                            <p>
                              <FaClock />
                              {new Date(event.event_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <p>
                              <FaMapMarkerAlt />
                              {event.venue}
                            </p>
                            <p>
                              <FaTicketAlt />
                              {event.is_paid ? `₹${event.price}` : "Free"}
                            </p>
                  </div>
                          
                          <p className={styles.eventDescription}>
                            {event.description ? 
                              `${event.description.substring(0, 100)}...` : 
                              'No description available'}
                          </p>
                          
                          <div className={styles.eventCardActions}>
                            <button
                              className={styles.viewDetailsButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/events/${event.id}`);
                              }}
                            >
                              View Details
                            </button>
                            
                            {!isUserRegistered(event.id) && event.status === 'upcoming' && (
                  <button
                    className={styles.registerButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRegister(event.id);
                                }}
                    disabled={registering}
                  >
                                {registering ? 'Registering...' : 'Register Now'}
                  </button>
                            )}
                </div>
              </div>
          </div>
                    );
                  })}
              </div>
            )}
            
            {!loading && allEvents.filter(event => {
              const matchesSearch = event.event_name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
                                  event.description?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
                                  event.venue?.toLowerCase()?.includes(searchQuery.toLowerCase());
              
              const matchesFilter = filter === "all" || 
                                 (filter === "registered" && isUserRegistered(event.id)) ||
                                 (event.status?.toLowerCase() === filter);
              
              const matchesLocation = !filterOptions.location || 
                                     event.venue?.toLowerCase()?.includes(filterOptions.location.toLowerCase());
              
              const matchesDate = !filterOptions.date || 
                                new Date(event.event_time).toLocaleDateString() === new Date(filterOptions.date).toLocaleDateString();
              
              const matchesType = !filterOptions.type || 
                                event.event_type?.toLowerCase() === filterOptions.type.toLowerCase();
              
              return matchesSearch && matchesFilter && matchesLocation && matchesDate && matchesType;
            }).length === 0 && (
          <div className={styles.noEventsFound}>
                <div className={styles.emptyStateIcon}>
                  <FaSearch />
                </div>
            <h3>No events found</h3>
                <p>Try adjusting your search criteria or check back later for new events.</p>
                <button 
                  className={styles.resetFiltersButton}
                  onClick={() => {
                    setSearchQuery("");
                    setFilterOptions({ location: "", date: "", type: "" });
                    setFilter("all");
                    setShowFilters(false);
                    fetchAllEvents();
                  }}
                >
                  Reset Filters
                </button>
          </div>
        )}
      </div>
    );

      case "bookmarks":
    return (
      <div className={styles.bookmarksContainer}>
        <h2>Bookmarked Events</h2>
            {bookmarkedEvents.length > 0 ? (
              <div className={styles.eventsGrid}>
                {bookmarkedEvents.map(event => (
                  <div 
                    key={event.id} 
                    className={styles.eventCard}
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    {event.photos && event.photos[0] ? (
                      <div className={styles.eventCardImage}>
                        <img src={event.photos[0].photo_url} alt={event.event_name} />
                </div>
                    ) : (
                      <div className={styles.eventCardImagePlaceholder}>
                        <FaBookmark />
                      </div>
                    )}
                <div className={styles.eventCardContent}>
                  <h4>{event.event_name}</h4>
                      <p>{event.description ? `${event.description.substring(0, 100)}...` : 'No description'}</p>
                      <div className={styles.eventCardDetails}>
                        <span><FaCalendarAlt /> {new Date(event.event_time).toLocaleDateString()}</span>
                        <span><FaClock /> {new Date(event.event_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span><FaMapMarkerAlt /> {event.venue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <FaRegBookmark />
                </div>
                <p>You haven't bookmarked any events yet.</p>
                <button className={styles.primaryButton} onClick={() => setActiveTab("browse")}>
                  Browse Events
            </button>
          </div>
        )}
      </div>
    );

      case "profile":
    return (
          <div className={styles.tabContent}>
            <div className={styles.profileSection}>
              <div className={styles.profileHeader}>
                <h2>My Profile</h2>
                <div className={styles.accountActions}>
                  <button 
                    className={styles.accountActionButton}
                    onClick={() => setActiveTab('security')}
                  >
                    Security Settings
                  </button>
                  {!userProfile?.is_coordinator && !hasCoordinatorRequest && (
              <button 
                      className={styles.coordinatorRequestButton}
                      onClick={handleCoordinatorRequest}
              >
                      Request Coordinator Role
              </button>
            )}
                  {!userProfile?.is_coordinator && hasCoordinatorRequest && (
                    <div className={styles.coordinatorRequestStatus}>
                      <p>Coordinator Request Status: <span className={styles.statusPending}>Pending</span></p>
          </div>
                  )}
                  {userProfile?.is_coordinator && (
                    <div className={styles.coordinatorRequestStatus}>
                      <p>Coordinator Status: <span className={styles.statusApproved}>Approved</span></p>
                </div>
                  )}
                </div>
              </div>
              
              <div className={styles.profileSection}>
                <h3>About Me</h3>
                <p className={styles.bio}>{userProfile.bio || "No bio provided yet. Click 'Edit Profile' to add information about yourself."}</p>
                </div>
              
              <div className={styles.profileStatsContainer}>
                <div className={styles.profileStat}>
                  <span className={styles.statValue}>{upcomingEvents.length}</span>
                  <span className={styles.statLabel}>Upcoming Events</span>
                </div>
                <div className={styles.profileStat}>
                  <span className={styles.statValue}>{pastEvents.length}</span>
                  <span className={styles.statLabel}>Past Events</span>
              </div>
                <div className={styles.profileStat}>
                  <span className={styles.statValue}>{bookmarkedEvents.length}</span>
                  <span className={styles.statLabel}>Bookmarked</span>
                </div>
              </div>
              
              {!userProfile.is_coordinator && !coordinatorRequestStatus && (
                <div className={styles.profileSection}>
                  <h3>Become an Event Coordinator</h3>
                  <p>Create and manage your own events by becoming an event coordinator.</p>
                <button 
                    className={styles.coordinatorRequestButton} 
                    onClick={handleCoordinatorRequest}
                  >
                    <FaUserPlus /> Request Coordinator Role
                </button>
            </div>
          )}
          
              {coordinatorRequestStatus && (
                <div className={styles.profileSection}>
                  <h3>Coordinator Request Status</h3>
                  <div className={`${styles.statusBadge} ${styles[coordinatorRequestStatus]}`}>
                    {coordinatorRequestStatus === 'pending' && 'Pending Review'}
                    {coordinatorRequestStatus === 'approved' && 'Approved'}
                    {coordinatorRequestStatus === 'rejected' && 'Rejected'}
                </div>
                  {coordinatorRequestStatus === 'rejected' && (
              <button
                      className={styles.newRequestButton} 
                onClick={handleCoordinatorRequest}
              >
                      Submit New Request
              </button>
            )}
          </div>
              )}
              
              <div className={styles.profileSection}>
                <h3>Account Actions</h3>
                <div className={styles.accountActions}>
                  <button className={styles.deleteAccountButton} onClick={handleDeleteAccount}>
                    <FaTimes /> Delete Account
                      </button>
                  <button className={styles.logoutButton} onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                  </button>
                  </div>
              </div>
        </div>
      </div>
    );
    }
  };

  // Add this function if it doesn't exist
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllEvents(false).then(() => {
      setRefreshing(false);
      toast.info("Events refreshed", { autoClose: 1000 });
    });
  };
  
  // Add this helper function if it doesn't exist
  const getStatusInfo = (status) => {
    const statusMap = {
      'upcoming': { class: 'upcoming', text: 'Upcoming' },
      'completed': { class: 'completed', text: 'Completed' },
      'canceled': { class: 'canceled', text: 'Canceled' },
      'cancelled': { class: 'canceled', text: 'Canceled' },
      'postponed': { class: 'postponed', text: 'Postponed' }
    };

    return statusMap[status] || { class: 'upcoming', text: 'Upcoming' };
  };
  
  // Add this if it doesn't exist
  const isUserRegistered = (eventId) => {
    if (!eventId) return false;
    
    console.log("Checking if user is registered for event", eventId);
    
    // If we have userParticipations, check in that first
    if (userParticipations && userParticipations.length > 0) {
      console.log("Checking in userParticipations array, length:", userParticipations.length);
      
      // Check different participation data formats
      return userParticipations.some(participation => {
        // Different formats for event id comparison
        const eventIdMatches = 
          participation.event === eventId || 
          participation.event_id === eventId ||
          participation.eventId === eventId;
        
        // Different formats for status
        const statusIsValid = 
          (participation.status && ["registered", "attended"].includes(participation.status)) ||
          participation.is_attending === true;
        
        return eventIdMatches && statusIsValid;
      });
    }
    
    // Fall back to checking in upcomingEvents
    if (upcomingEvents && upcomingEvents.length > 0) {
      console.log("Falling back to checking in upcomingEvents array");
      return upcomingEvents.some(event => event.id === eventId);
    }
    
    // If no data is available, default to false
    return false;
  };

  return (
    <div className={styles.dashboardContainer}>
      <ToastContainer />
      <UpdatedStyles />
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
              activeTab === "myEvents" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("myEvents")}
          >
            <FaTicketAlt />
            <span>My Events</span>
          </button>
          <button
            className={`${styles.navButton} ${
              activeTab === "browse" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("browse")}
          >
            <FaSearch />
            <span>Browse Events</span>
          </button>
          <button
            className={`${styles.navButton} ${
              activeTab === "bookmarks" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("bookmarks")}
          >
            <FaRegBookmark />
            <span>Bookmarks</span>
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
        <h1>{activeTab === "browse" ? "Discover Events" : activeTab === "myEvents" ? "My Events" : "My Dashboard"}</h1>
        {loading ? (
          <div className={styles.loader}>Loading dashboard data...</div>
        ) : (
          <>
            {renderTab()}
          </>
        )}
      </main>
      {/* Profile Edit Modal */}
      <ProfileEditModal />
    </div>
  );
};

export default UserDashboard; 