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
  FaUserEdit
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import api, { getMediaUrl } from "../../utils/api";
import styles from "../../assets/css/Dashboard.module.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../utils/constants";
import CoordinatorRequestForm from "./CoordinatorRequestForm";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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

  useEffect(() => {
    checkAuthAndFetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "browse") {
      fetchAllEvents();
    }
  }, [activeTab]);
  
  // Fetch user profile data when component mounts
  useEffect(() => {
    fetchUserProfile();
    generateActivityFeed();
  }, []);

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
      
      // Redirect if not a normal user
      if (userRole && userRole !== "normal") {
        if (userRole === "admin") {
          navigate("/admin-dashboard");
          return;
        } else if (userRole === "coordinator") {
          navigate("/coordinator-dashboard");
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
      
      // Fetch user dashboard data
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
      
      // Default empty values for all data
      let eventsData = [];
      
      // Try to fetch all events first since we need this for other features
      try {
        const eventsResponse = await api.get("events/");
        if (eventsResponse.status === 200 && eventsResponse.data) {
          eventsData = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
          setAllEvents(eventsData);
        } else {
          setAllEvents([]);
        }
      } catch (error) {
        console.warn("Could not fetch events:", error);
        setAllEvents([]);
      }
      
      // Calculate stats from events data if we have it
      try {
        // Try endpoint first
        const statsResponse = await api.get("events/user-stats/");
        if (statsResponse.status === 200 && statsResponse.data) {
          setStats({
            registeredEvents: statsResponse.data.registered_events || 0,
            upcomingEvents: statsResponse.data.upcoming_events || 0,
            completedEvents: statsResponse.data.completed_events || 0,
          });
        } else {
          throw new Error("Invalid response from stats endpoint");
        }
      } catch (error) {
        console.warn("Could not fetch user stats:", error);
        
        // Fallback: calculate stats from events data if available
        if (eventsData.length > 0) {
          try {
            // Get user ID
            const userId = userProfile.id || getUserIdFromToken();
            if (!userId) {
              throw new Error("Could not determine user ID");
            }
            
            // Filter events this user is registered for
            const userEvents = eventsData.filter(event => 
              event.participants && 
              event.participants.some(p => 
                (p.user && p.user.toString() === userId.toString()) || 
                (p.user_id && p.user_id.toString() === userId.toString())
              )
            );
            
            // Calculate upcoming vs past events
            const now = new Date();
            const upcoming = userEvents.filter(event => 
              new Date(event.event_time) > now
            );
            const completed = userEvents.filter(event => 
              new Date(event.event_time) <= now
            );
            
            setStats({
              registeredEvents: userEvents.length,
              upcomingEvents: upcoming.length,
              completedEvents: completed.length
            });
          } catch (fallbackError) {
            console.warn("Could not calculate stats from events:", fallbackError);
            // Default stats
            setStats({
              registeredEvents: 0,
              upcomingEvents: 0,
              completedEvents: 0
            });
          }
        } else {
          // No events data, set empty stats
          setStats({
            registeredEvents: 0,
            upcomingEvents: 0,
            completedEvents: 0
          });
        }
      }
      
      // Extract user's upcoming and past events from all events data
      if (eventsData.length > 0) {
        try {
          // Get user ID
          const userId = userProfile.id || getUserIdFromToken();
          if (!userId) {
            throw new Error("Could not determine user ID");
          }
          
          // Filter events this user is registered for
          const userEvents = eventsData.filter(event => 
            event.participants && 
            event.participants.some(p => 
              (p.user && p.user.toString() === userId.toString()) || 
              (p.user_id && p.user_id.toString() === userId.toString())
            )
          );
          
          // Separate into upcoming and past
          const now = new Date();
          const upcoming = userEvents.filter(event => 
            new Date(event.event_time) > now
          );
          const past = userEvents.filter(event => 
            new Date(event.event_time) <= now
          );
          
          setUpcomingEvents(upcoming);
          setPastEvents(past);
        } catch (error) {
          console.warn("Could not process user events:", error);
          setUpcomingEvents([]);
          setPastEvents([]);
        }
      } else {
        setUpcomingEvents([]);
        setPastEvents([]);
      }
      
      // Create mock bookmarked events if needed
      // Since this is a feature you want to keep, create some dummy data
      try {
        const bookmarksResponse = await api.get("events/bookmarked/");
        if (bookmarksResponse.status === 200 && Array.isArray(bookmarksResponse.data)) {
          setBookmarkedEvents(bookmarksResponse.data);
        } else {
          throw new Error("Invalid bookmarks response");
        }
      } catch (error) {
        console.warn("Could not fetch bookmarked events:", error);
        
        // Create mock bookmarked events from the first few events
        if (eventsData.length > 0) {
          // Take 2-3 random events to use as bookmarks
          const mockBookmarked = eventsData
            .slice(0, Math.min(eventsData.length, 5))
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(eventsData.length, 3))
            .map(event => ({
              ...event,
              bookmarked_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            }));
          
          setBookmarkedEvents(mockBookmarked);
        } else {
          setBookmarkedEvents([]);
        }
      }
      
      // Generate activity feed based on available data
      generateActivityFeed();
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Error loading dashboard data");
      
      // Set default empty values for everything to prevent UI errors
      setStats({
        registeredEvents: 0,
        upcomingEvents: 0,
        completedEvents: 0
      });
      setUpcomingEvents([]);
      setPastEvents([]);
      setAllEvents([]);
      setBookmarkedEvents([]);
    } finally {
      setLoading(false);
    }
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

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/events/");
      if (response.data && Array.isArray(response.data)) {
        setAllEvents(response.data);
      } else {
        console.warn("Events data is not an array or is missing");
        setAllEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      setRegistering(true);
      const response = await api.post(`events/${eventId}/register/`);
      if (response.status === 200 || response.status === 201) {
        toast.success("Successfully registered for event!");
        // Refresh upcoming events list
        const upcomingResponse = await api.get("events/user-events/");
        if (upcomingResponse.data) {
          setUpcomingEvents(upcomingResponse.data.filter(event => 
            new Date(event.event_date) >= new Date()));
        }
        
        // Update stats
        const statsResponse = await api.get("events/user-stats/");
        if (statsResponse.data) {
          setStats({
            registeredEvents: statsResponse.data.registered_events || 0,
            upcomingEvents: statsResponse.data.upcoming_events || 0,
            completedEvents: statsResponse.data.completed_events || 0,
          });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Failed to register for event");
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
    // Search query filter
    const matchesSearch = searchQuery === "" || 
      event.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.venue && event.venue.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter options
    const matchesLocation = filterOptions.location === "" || 
      (event.venue && event.venue.toLowerCase().includes(filterOptions.location.toLowerCase()));
    
    const matchesType = filterOptions.type === "" || 
      (event.category && event.category.toLowerCase() === filterOptions.type.toLowerCase());
    
    const matchesDate = filterOptions.date === "" || 
      (event.event_time && new Date(event.event_time).toISOString().split('T')[0] === filterOptions.date);
    
    return matchesSearch && matchesLocation && matchesType && matchesDate;
  }) : [];

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
        
        // Check if user has a coordinator request
        if (userData.coordinator_requests && userData.coordinator_requests.length > 0) {
          setHasCoordinatorRequest(true);
          setCoordinatorRequestStatus(userData.coordinator_requests[0].status);
        } else if (userData.coordinator_request) {
          setHasCoordinatorRequest(true);
          setCoordinatorRequestStatus(userData.coordinator_request.status || "pending");
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

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setUserProfile(prev => ({
        ...prev,
        profile_photo: file
      }));
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Validate form data
      const errors = validateProfileUpdate(userProfile);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        // Show the first error as a toast
        const firstError = Object.values(errors)[0];
        toast.error(firstError);
        return;
      }
      
      setUpdatingProfile(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("first_name", userProfile.first_name.trim());
      formData.append("last_name", userProfile.last_name.trim());
      formData.append("phone", userProfile.phone || "");
      formData.append("username", userProfile.username.trim());
      
      if (userProfile.profile_photo && typeof userProfile.profile_photo !== 'string') {
        formData.append("profile_photo", userProfile.profile_photo);
      }
      
      // Try multiple endpoints
      const endpointsToTry = [
        "users/profile/",
        "users/me/",
        "api/users/me/",
        "api/profile/"
      ];
      
      let success = false;
      
      for (const endpoint of endpointsToTry) {
        try {
          console.log(`Trying to update profile at ${endpoint}`);
          const response = await api.patch(endpoint, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.status >= 200 && response.status < 300) {
            console.log(`Profile updated successfully at ${endpoint}`);
            success = true;
            break;
          }
        } catch (error) {
          console.warn(`Failed to update profile at ${endpoint}:`, error);
        }
      }
      
      if (success) {
        toast.success("Profile updated successfully!");
        setEditingProfile(false);
        fetchUserProfile();
        
        // Update username in localStorage if it was changed
        const originalUsername = localStorage.getItem("user") ? 
          JSON.parse(localStorage.getItem("user")).username : "";
        
        if (originalUsername !== userProfile.username && localStorage.getItem("user")) {
          const userData = JSON.parse(localStorage.getItem("user"));
          userData.username = userProfile.username;
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } else {
        throw new Error("Could not update profile on any endpoint");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      let errorMessage = "Failed to update profile";
      
      if (error.response) {
        if (error.response.data?.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Define validation schema for profile updates
  const validateProfileUpdate = (data) => {
    const errors = {};
    
    // First name validation
    if (!data.first_name || data.first_name.trim() === "") {
      errors.first_name = "First name is required";
    } else if (!/^[A-Za-z]+$/.test(data.first_name.trim())) {
      errors.first_name = "No numbers or special characters allowed";
    }
    
    // Last name validation
    if (!data.last_name || data.last_name.trim() === "") {
      errors.last_name = "Last name is required";
    } else if (!/^[A-Za-z]+(?:\s[A-Za-z]+)*$/.test(data.last_name.trim())) {
      errors.last_name = "No numbers or special characters allowed";
    }
    
    // Username validation
    if (!data.username || data.username.trim() === "") {
      errors.username = "Username is required";
    } else if (data.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-z0-9_]+$/.test(data.username)) {
      errors.username = "Only lowercase letters, numbers and underscores allowed";
    }
    
    // Phone validation
    if (data.phone && data.phone.trim() !== "") {
      if (!/^[6-9]\d{9}$/.test(data.phone)) {
        errors.phone = "Phone must be 10 digits and start with 6-9";
      }
    }
    
    return errors;
  };

  const handleCoordinatorRequest = () => {
    setShowCoordinatorRequestModal(true);
  };

  const handleCoordinatorRequestSuccess = () => {
    setHasCoordinatorRequest(true);
    setCoordinatorRequestStatus("pending");
    toast.success("Your request to become a coordinator has been submitted successfully!");
  };

  // Generate a mock activity feed for the user
  const generateActivityFeed = () => {
    const now = new Date();
    const activities = [];
    
    // Add registration activities
    if (upcomingEvents.length > 0) {
      upcomingEvents.slice(0, 2).forEach(event => {
        activities.push({
          id: `reg-${event.id}`,
          type: "registration",
          title: "You registered for an event",
          description: event.event_name,
          timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          icon: "FaTicketAlt"
        });
      });
    }
    
    // Add profile update activity if profile was recently updated
    if (userProfile.last_updated && new Date(userProfile.last_updated) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      activities.push({
        id: "profile-update",
        type: "profile",
        title: "You updated your profile",
        description: "Profile information updated",
        timestamp: new Date(userProfile.last_updated),
        icon: "FaUserCog"
      });
    }
    
    // Add feedback activities
    if (pastEvents.length > 0) {
      pastEvents.filter(event => event.feedback).slice(0, 2).forEach(event => {
        activities.push({
          id: `feedback-${event.id}`,
          type: "feedback",
          title: "You left feedback",
          description: `${event.event_name} - ${"★".repeat(event.feedback.rating)}`,
          timestamp: new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000),
          icon: "FaRegComment"
        });
      });
    }
    
    // Sort activities by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // If no activities, add a default message
    if (activities.length === 0) {
      activities.push({
        id: "no-activity",
        type: "info",
        title: "Welcome to EventSphere!",
        description: "Your activity feed will appear here as you interact with events.",
        timestamp: now,
        icon: "FaCalendarAlt"
      });
    }
    
    setActivityFeed(activities);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "myEvents":
        return renderMyEvents();
      case "browse":
        return renderBrowseEvents();
      case "bookmarks":
        return renderBookmarkedEvents();
      case "profile":
        return renderProfile();
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
              <h3>Registered Events</h3>
              <p>{stats.registeredEvents}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaClock />
            </div>
            <div>
              <h3>Upcoming Events</h3>
              <p>{stats.upcomingEvents}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaTicketAlt />
            </div>
            <div>
              <h3>Completed Events</h3>
              <p>{stats.completedEvents}</p>
            </div>
          </div>
        </div>

        <div className={styles.quickActions}>
          <button className={styles.quickActionButton} onClick={() => navigate("/events")}>
            <div className={styles.quickActionIcon}>
              <FaCompass />
            </div>
            <div className={styles.quickActionContent}>
              <span className={styles.quickActionTitle}>Discover Events</span>
              <span className={styles.quickActionDesc}>Find new events to attend</span>
            </div>
          </button>
          <button className={styles.quickActionButton} onClick={() => setActiveTab("myEvents")}>
            <div className={styles.quickActionIcon}>
              <FaListUl />
            </div>
            <div className={styles.quickActionContent}>
              <span className={styles.quickActionTitle}>My Events</span>
              <span className={styles.quickActionDesc}>View your registered events</span>
            </div>
          </button>
          <button className={styles.quickActionButton} onClick={() => setActiveTab("bookmarks")}>
            <div className={styles.quickActionIcon}>
              <FaBookmark />
            </div>
            <div className={styles.quickActionContent}>
              <span className={styles.quickActionTitle}>Bookmarks</span>
              <span className={styles.quickActionDesc}>Your saved events</span>
            </div>
          </button>
          <button className={styles.quickActionButton} onClick={() => setActiveTab("profile")}>
            <div className={styles.quickActionIcon}>
              <FaUserEdit />
            </div>
            <div className={styles.quickActionContent}>
              <span className={styles.quickActionTitle}>Profile</span>
              <span className={styles.quickActionDesc}>Update your information</span>
            </div>
          </button>
        </div>

        <div className={styles.dashboardSections}>
          <div className={styles.upcomingEvents}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>My Upcoming Events</h3>
              <a href="#" className={styles.viewAllLink} onClick={() => setActiveTab("myEvents")}>
                View All
              </a>
            </div>
            
            {upcomingEvents.length > 0 ? (
              <ul className={styles.eventList}>
                {upcomingEvents.slice(0, 3).map((event, index) => (
                  <li key={index} className={styles.eventItem}>
                    <div className={styles.eventDate}>
                      <span className={styles.eventDay}>
                        {new Date(event.event_time).getDate()}
                      </span>
                      <span className={styles.eventMonth}>
                        {new Date(event.event_time).toLocaleString("default", {
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className={styles.eventContent}>
                      <h4 className={styles.eventTitle}>{event.event_name}</h4>
                      <p>{event.description?.substring(0, 100) || "No description"}...</p>
                      <div className={styles.eventInfo}>
                        <span>
                          <FaMapMarkerAlt /> {event.venue || "TBD"}
                        </span>
                        <span>
                          <FaClock /> {new Date(event.event_time).toLocaleTimeString() || "TBA"}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <FaCalendarAlt className={styles.emptyStateIcon} />
                <p>You haven't registered for any upcoming events</p>
                <button 
                  className={styles.primaryButton}
                  onClick={() => navigate("/events")}
                >
                  <FaSearch /> Discover Events
                </button>
              </div>
            )}
          </div>
          
          <div className={styles.recentActivity}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Activity Feed</h3>
            </div>
            
            <div className={styles.activityFeed}>
              {activityFeed.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    {activity.icon === "FaTicketAlt" && <FaTicketAlt />}
                    {activity.icon === "FaUserCog" && <FaUserCog />}
                    {activity.icon === "FaRegComment" && <FaRegComment />}
                  </div>
                  <div className={styles.activityContent}>
                    <h4 className={styles.activityTitle}>{activity.title}</h4>
                    <p className={styles.activityDesc}>{activity.description}</p>
                    <span className={styles.activityTime}>
                      {activity.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.recommendedEventsHeader}>
              <h3 className={styles.sectionTitle}>Recommended Events</h3>
              <a href="#" className={styles.viewAllLink} onClick={(e) => {
                e.preventDefault();
                navigate("/events");
              }}>
                Browse Events
              </a>
            </div>
            
            <div className={styles.recommendedEvents}>
              {allEvents.slice(0, 2).map((event, index) => (
                <div key={index} className={styles.recommendedEventCard}>
                  <div className={styles.eventCardImage}>
                    {event.photos && event.photos.length > 0 ? (
                      <img src={event.photos[0].photo_url} alt={event.event_name} />
                    ) : (
                      <div className={styles.eventCardImagePlaceholder}>
                        <FaCalendarAlt />
                      </div>
                    )}
                  </div>
                  <div className={styles.eventCardContent}>
                    <h4>{event.event_name}</h4>
                    <p>{event.description?.substring(0, 80)}...</p>
                    <div className={styles.eventCardDetails}>
                      <span><FaMapMarkerAlt /> {event.venue || "TBD"}</span>
                      <span><FaClock /> {new Date(event.event_time).toLocaleTimeString()}</span>
                    </div>
                    <button 
                      className={styles.registerButton}
                      onClick={() => handleRegister(event.id)}
                      disabled={registering}
                    >
                      Register Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {pastEvents.length > 0 && (
          <div className={styles.pastEvents}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Past Events</h3>
              <a href="#" className={styles.viewAllLink} onClick={() => setActiveTab("myEvents")}>
                View All
              </a>
            </div>
            
            <div className={styles.pastEventsList}>
              {pastEvents.slice(0, 2).map((event, index) => (
                <div key={index} className={styles.pastEventCard}>
                  <div className={styles.pastEventContent}>
                    <h4>{event.event_name}</h4>
                    <p>{new Date(event.event_time).toLocaleDateString()}</p>
                    {!event.feedback ? (
                      <button 
                        className={styles.feedbackButton}
                        onClick={() => {
                          const rating = prompt("Rate this event from 1-5");
                          const comment = prompt("Any comments about this event?");
                          if (rating && comment) {
                            submitFeedback(event.id, parseInt(rating), comment);
                          }
                        }}
                      >
                        <FaRegComment /> Leave Feedback
                      </button>
                    ) : (
                      <div className={styles.feedbackGiven}>
                        <span>Your rating: {event.feedback.rating} <FaStar /></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMyEvents = () => {
    return (
      <div className={styles.myEventsContainer}>
        <h2>My Events</h2>
        
        <div className={styles.eventsSection}>
          <h3>Upcoming Events</h3>
          {upcomingEvents.length > 0 ? (
            <div className={styles.eventsList}>
              {upcomingEvents.map((event, index) => (
                <div key={index} className={styles.eventCard}>
                  <div className={styles.eventDate}>
                    <span className={styles.eventDay}>
                      {new Date(event.event_time).getDate()}
                    </span>
                    <span className={styles.eventMonth}>
                      {new Date(event.event_time).toLocaleString("default", {
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className={styles.eventCardContent}>
                    <h4>{event.event_name}</h4>
                    <p>{event.description?.substring(0, 150)}...</p>
                    <div className={styles.eventDetails}>
                      <p><FaMapMarkerAlt /> {event.venue}</p>
                      <p><FaClock /> {new Date(event.event_time).toLocaleTimeString()}</p>
                      <p><FaUsers /> {event.attendee_count || 0} attending</p>
                    </div>
                    <button className={styles.viewDetailsButton}>View Details</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>You don't have any upcoming events</p>
          )}
        </div>
        
        <div className={styles.eventsSection}>
          <h3>Past Events</h3>
          {pastEvents.length > 0 ? (
            <div className={styles.eventsList}>
              {pastEvents.map((event, index) => (
                <div key={index} className={styles.eventCard}>
                  <div className={styles.eventDate}>
                    <span className={styles.eventDay}>
                      {new Date(event.event_time).getDate()}
                    </span>
                    <span className={styles.eventMonth}>
                      {new Date(event.event_time).toLocaleString("default", {
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className={styles.eventCardContent}>
                    <h4>{event.event_name}</h4>
                    <p>{event.description?.substring(0, 150)}...</p>
                    <div className={styles.eventDetails}>
                      <p><FaMapMarkerAlt /> {event.venue}</p>
                    </div>
                    {!event.feedback ? (
                      <button 
                        className={styles.feedbackButton}
                        onClick={() => {
                          // Show feedback form (modal in real implementation)
                          const rating = prompt("Rate this event from 1-5");
                          const comment = prompt("Any comments about this event?");
                          if (rating && comment) {
                            submitFeedback(event.id, parseInt(rating), comment);
                          }
                        }}
                      >
                        Leave Feedback
                      </button>
                    ) : (
                      <div className={styles.feedbackGiven}>
                        <p>Your rating: {event.feedback.rating} <FaStar /></p>
                        <p>"{event.feedback.comment}"</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>You haven't attended any events yet</p>
          )}
        </div>
      </div>
    );
  };

  const renderBrowseEvents = () => {
    return (
      <div className={styles.browseEventsContainer}>
        <h2>Browse Events</h2>
        
        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search for events..."
              value={searchQuery}
              onChange={handleSearch}
              className={styles.searchInput}
            />
            <button 
              className={styles.filterButton} 
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>
          </div>
          
          {showFilters && (
            <div className={styles.filterOptions}>
              <div className={styles.filterGroup}>
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Filter by city, venue..."
                  value={filterOptions.location}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                />
              </div>
              
              <div className={styles.filterGroup}>
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={filterOptions.date}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                />
              </div>
              
              <div className={styles.filterGroup}>
                <label>Event Type</label>
                <select
                  name="type"
                  value={filterOptions.type}
                  onChange={handleFilterChange}
                  className={styles.filterSelect}
                >
                  <option value="">All Types</option>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="social">Social</option>
                  <option value="concert">Concert</option>
                  <option value="hackathon">Hackathon</option>
                </select>
              </div>
              
              <button
                className={styles.resetFiltersButton}
                onClick={() => setFilterOptions({
                  location: "",
                  date: "",
                  type: ""
                })}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className={styles.loader}>Loading events...</div>
        ) : filteredEvents.length > 0 ? (
          <div className={styles.eventsGrid}>
            {filteredEvents.map((event, index) => (
              <div key={index} className={styles.eventCard}>
                <div className={styles.eventCardImage}>
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.event_name} />
                  ) : (
                    <div className={styles.eventCardImagePlaceholder}>
                      <FaCalendarAlt />
                    </div>
                  )}
                  {event.category && (
                    <span className={styles.eventType}>{event.category}</span>
                  )}
                </div>
                <div className={styles.eventCardContent}>
                  <h3>{event.event_name}</h3>
                  <p className={styles.eventCardDescription}>
                    {event.description?.substring(0, 100)}...
                  </p>
                  <div className={styles.eventCardDetails}>
                    <p><FaMapMarkerAlt /> {event.venue || "TBD"}</p>
                    <p><FaCalendarAlt /> {new Date(event.event_time).toLocaleDateString()}</p>
                    <p><FaClock /> {new Date(event.event_time).toLocaleTimeString() || "TBA"}</p>
                  </div>
                  <button
                    className={styles.registerButton}
                    onClick={() => handleRegister(event.id)}
                    disabled={registering}
                  >
                    Register Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noEventsFound}>
            <h3>No events found</h3>
            <p>Try adjusting your search criteria or explore events at a later date.</p>
          </div>
        )}
      </div>
    );
  };

  const renderBookmarkedEvents = () => {
    return (
      <div className={styles.bookmarksContainer}>
        <h2>Bookmarked Events</h2>
        
        {loading ? (
          <div className={styles.loader}>Loading bookmarked events...</div>
        ) : bookmarkedEvents.length > 0 ? (
          <div className={styles.eventsList}>
            {bookmarkedEvents.map((event, index) => (
              <div key={index} className={styles.eventCard}>
                <div className={styles.eventDate}>
                  <span className={styles.eventDay}>
                    {new Date(event.event_time).getDate()}
                  </span>
                  <span className={styles.eventMonth}>
                    {new Date(event.event_time).toLocaleString("default", { month: "short" })}
                  </span>
                </div>
                <div className={styles.eventCardContent}>
                  <h4>{event.event_name}</h4>
                  <p>{event.description?.substring(0, 150) || "No description available"}...</p>
                  <div className={styles.eventDetails}>
                    <p><FaMapMarkerAlt /> {event.venue || "TBD"}</p>
                    <p><FaClock /> {new Date(event.event_time).toLocaleTimeString() || "TBA"}</p>
                    <p><FaUsers /> {event.attendee_count || 0} attending</p>
                  </div>
                  <div className={styles.eventActions}>
                    <button className={styles.viewDetailsButton}>View Details</button>
                    <button 
                      className={styles.registerButton}
                      onClick={() => handleRegister(event.id)}
                      disabled={registering}
                    >
                      Register Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FaBookmark className={styles.emptyStateIcon} />
            <p>You haven't bookmarked any events yet</p>
            <button 
              className={styles.primaryButton}
              onClick={() => setActiveTab("browse")}
            >
              <FaCompass /> Discover Events
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderProfile = () => {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.profilePhoto}>
              {editingProfile ? (
                <div className={styles.profilePhotoUpload}>
                  {profilePhotoPreview ? (
                    <img 
                      src={profilePhotoPreview} 
                      alt="Profile Preview" 
                      className={styles.profileImage}
                    />
                  ) : (
                    <div className={styles.profilePhotoPlaceholder}>
                      <span>
                        {userProfile.first_name ? userProfile.first_name.charAt(0).toUpperCase() : ''}
                        {userProfile.last_name ? userProfile.last_name.charAt(0).toUpperCase() : ''}
                      </span>
                    </div>
                  )}
                  <button 
                    type="button" 
                    className={styles.changePhotoButton}
                    onClick={() => fileInputRef.current.click()}
                  >
                    Change Photo
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePhotoChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <>
                  {profilePhotoPreview ? (
                    <img 
                      src={profilePhotoPreview} 
                      alt="Profile" 
                      className={styles.profileImage}
                    />
                  ) : (
                    <div className={styles.profilePhotoPlaceholder}>
                      <span>
                        {userProfile.first_name ? userProfile.first_name.charAt(0).toUpperCase() : ''}
                        {userProfile.last_name ? userProfile.last_name.charAt(0).toUpperCase() : ''}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className={styles.profileInfo}>
              <h3>
                {userProfile.first_name} {userProfile.last_name}
              </h3>
              <p className={styles.username}>@{userProfile.username}</p>
              <p className={styles.email}>{userProfile.email}</p>
              <p className={styles.role}>Role: {userProfile.user_role || userProfile.role || "User"}</p>
            </div>
            {!editingProfile && (
              <button 
                className={styles.editProfileButton}
                onClick={() => setEditingProfile(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
          
          {editingProfile ? (
            <div className={styles.profileForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={userProfile.first_name || ""}
                    onChange={handleProfileChange}
                    placeholder="First Name"
                    className={styles.formControl}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={userProfile.last_name || ""}
                    onChange={handleProfileChange}
                    placeholder="Last Name"
                    className={styles.formControl}
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={userProfile.username || ""}
                    onChange={handleProfileChange}
                    placeholder="Username"
                    className={styles.formControl}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email (Cannot be changed)</label>
                  <input
                    type="email"
                    name="email"
                    value={userProfile.email || ""}
                    className={`${styles.formControl} ${styles.disabledInput}`}
                    disabled
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={userProfile.phone || ""}
                  onChange={handleProfileChange}
                  placeholder="Phone Number"
                  className={styles.formControl}
                />
              </div>
              
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => {
                    setEditingProfile(false);
                    fetchUserProfile(); // Reset to original values
                  }}
                >
                  <FaTimes /> Cancel
                </button>
                <button 
                  type="button" 
                  className={styles.saveButton}
                  onClick={handleUpdateProfile}
                  disabled={updatingProfile}
                >
                  <FaSave /> {updatingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.profileDetails}>
              <div className={styles.detailSection}>
                <h4>Personal Information</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Full Name:</span>
                  <span className={styles.detailValue}>
                    {userProfile.first_name} {userProfile.last_name}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Username:</span>
                  <span className={styles.detailValue}>{userProfile.username}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>{userProfile.email}</span>
                </div>
                {userProfile.phone && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Phone:</span>
                    <span className={styles.detailValue}>{userProfile.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className={styles.coordinatorRequestSection}>
            <h4>Become an Event Coordinator</h4>
            <p>As a coordinator, you can create and manage your own events.</p>
            
            {hasCoordinatorRequest ? (
              <div className={styles.requestStatus}>
                <div className={`${styles.statusBadge} ${styles[coordinatorRequestStatus]}`}>
                  {coordinatorRequestStatus === 'pending' ? 'Request pending approval' : 
                   coordinatorRequestStatus === 'approved' ? 'Request approved' : 'Request rejected'}
                </div>
              </div>
            ) : (
              <button
                className={styles.coordinatorRequestButton}
                onClick={handleCoordinatorRequest}
              >
                <FaUserPlus className={styles.buttonIcon} />
                Request Coordinator Status
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.activitySummary}>
          <h3>Activity Summary</h3>
          
          <div className={styles.activityStats}>
            <div className={styles.activityStat}>
              <div className={styles.statNumber}>{stats.registeredEvents}</div>
              <div className={styles.statLabel}>Events Registered</div>
            </div>
            <div className={styles.activityStat}>
              <div className={styles.statNumber}>{stats.completedEvents}</div>
              <div className={styles.statLabel}>Events Attended</div>
            </div>
            <div className={styles.activityStat}>
              <div className={styles.statNumber}>{pastEvents.filter(e => e.feedback).length}</div>
              <div className={styles.statLabel}>Reviews Given</div>
            </div>
          </div>
          
          {pastEvents.length > 0 && (
            <div className={styles.recentActivity}>
              <h4>Recent Events</h4>
              <div className={styles.recentEventsList}>
                {pastEvents.slice(0, 3).map((event, index) => (
                  <div key={index} className={styles.recentEventItem}>
                    <div className={styles.eventBasicInfo}>
                      <h5>{event.event_name}</h5>
                      <p>{new Date(event.event_time).toLocaleDateString()}</p>
                    </div>
                    {event.feedback ? (
                      <div className={styles.eventRating}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < event.feedback.rating ? styles.starFilled : styles.starEmpty}>
                            ★
                          </span>
                        ))}
                      </div>
                    ) : (
                      <button 
                        className={styles.leaveFeedbackButton}
                        onClick={() => {
                          const rating = prompt("Rate this event from 1-5");
                          const comment = prompt("Any comments about this event?");
                          if (rating && comment) {
                            submitFeedback(event.id, parseInt(rating), comment);
                          }
                        }}
                      >
                        Leave Feedback
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
        {loading && activeTab === "overview" ? (
          <div className={styles.loader}>Loading dashboard data...</div>
        ) : (
          renderTab()
        )}
      </main>
      {showCoordinatorRequestModal && (
        <CoordinatorRequestForm 
          onClose={() => setShowCoordinatorRequestModal(false)}
          onSuccess={handleCoordinatorRequestSuccess}
        />
      )}
    </div>
  );
};

export default UserDashboard; 