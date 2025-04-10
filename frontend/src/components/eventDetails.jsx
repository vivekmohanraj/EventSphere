import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaCalendar,
  FaClock,
  FaUsers,
  FaTicketAlt,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaShareAlt,
  FaComments,
  FaCalendarPlus,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaGoogle,
  FaMicrosoft,
  FaApple,
  FaDollarSign,
  FaInfoCircle,
  FaUserCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronLeft,
  FaChevronRight,
  FaBookmark,
  FaRegBookmark,
  FaCheck,
} from "react-icons/fa";
import api from "../utils/api";
import { getGoogleCalendarUrl, getOutlookCalendarUrl, downloadICalendarFile } from "../utils/calendarUtils";
import styles from "../assets/css/eventDetails.module.css";
import OrganizerProfile from './OrganizerProfile';
import EventQA from './EventQA';
import { ACCESS_TOKEN } from "../utils/constants";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [feedback, setFeedback] = useState([]);
  const [userFeedback, setUserFeedback] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comment: "",
    is_anonymous: false,
  });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [canLeaveFeedback, setCanLeaveFeedback] = useState(false);
  const [userId, setUserId] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Check if user is logged in from localStorage
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const user = JSON.parse(localStorage.getItem('user'));
    
    setIsUserLoggedIn(!!token && !!user);
    setUserToken(token);
    
    // Log the login status for debugging
    console.log("Login status:", !!token && !!user);
  }, []);

  useEffect(() => {
    // Fetch event details when the component mounts
    fetchEventDetails();

    // Check if user is logged in and has a role
    if (isUserLoggedIn) {
      checkUserRole();
      checkBookmarkStatus();
    }
  }, [id, isUserLoggedIn, userToken]);

  useEffect(() => {
    // Fetch related data after the event details are loaded
    if (event?.id) {
      fetchFeedback();
      fetchRelatedEvents();
      fetchCapacityInfo();
    }
  }, [event?.id]);
  
  // Set canLeaveFeedback when registration status or user feedback changes
  useEffect(() => {
    // User can leave feedback if:
    // 1. They are registered for the event
    // 2. They haven't already left feedback
    // 3. The event has a status of "completed" (either actual status or client-side determined)
    if (isRegistered && !userFeedback && 
        (event?.status === "completed" || event?.clientSideStatus === "completed")) {
      setCanLeaveFeedback(true);
    } else {
      setCanLeaveFeedback(false);
    }
  }, [isRegistered, userFeedback, event?.status, event?.clientSideStatus]);
  
  // Check if event time has passed and visually update status 
  useEffect(() => {
    if (event && event.status === "upcoming") {
      const eventDateTime = new Date(event.event_time);
      const currentTime = new Date();
      
      // If event time has passed, show it as completed in the UI
      if (eventDateTime < currentTime) {
        console.log("Event time has passed, showing as completed");
        setEvent(prev => ({
          ...prev,
          clientSideStatus: "completed"
        }));
      }
    }
  }, [event]);

  const checkUserRole = async () => {
    try {
      // Try multiple possible profile endpoints - order matters
      const endpoints = [
        "/users/profile/",
        "/api/users/me/",
        "/auth/users/me/",
        "/api/profile/",
        "/users/me/",
        "/users/check-auth/"
      ];
      
      let response = null;
      let lastError = null;
      
      // Try each endpoint sequentially
      for (const endpoint of endpoints) {
        try {
          response = await api.get(endpoint);
          if (response && response.data) {
            break; // Exit the loop if successful
          }
        } catch (error) {
          lastError = error;
          // Continue to next endpoint
        }
      }
      
      if (response && response.data) {
        // Handle different field names in response
        const role = response.data.role || response.data.user_role;
        const id = response.data.id || response.data.user_id;
        
        setUserRole(role);
        setUserId(id);
      } else {
        // If all API calls fail, fall back to localStorage as a last resort
        fallbackToLocalStorage();
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      // Fall back to localStorage
      fallbackToLocalStorage();
    }
  };
  
  // Helper function to extract user data from localStorage
  const fallbackToLocalStorage = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('access_token') || localStorage.getItem('ACCESS_TOKEN');
      
      if (userData && token) {
        console.log("Using localStorage user data as fallback:", userData);
        setUserRole(userData.role || userData.user_role || 'user');
        setUserId(userData.id || userData.user_id);
      } else {
        // If no valid user data in localStorage, set default values
        setUserRole('user');
        setUserId(null);
      }
    } catch (e) {
      console.error("Could not parse user data from localStorage:", e);
      setUserRole('user');
      setUserId(null);
    }
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const eventId = id;
      console.log(`Fetching details for event ID: ${eventId}`);
      
      // Try multiple endpoints
      const endpoints = [
        `/events/${eventId}/`,
        `/api/events/${eventId}/`,
        `/events/events/${eventId}/`
      ];
      
      let response = null;
      let fetchError = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch event details using endpoint: ${endpoint}`);
          response = await api.get(endpoint);
          
          if (response && response.status >= 200 && response.status < 300 && response.data) {
            console.log(`Event details fetch successful with endpoint ${endpoint}`);
            break; // Exit the loop if fetch is successful
          }
        } catch (error) {
          console.log(`Event details fetch failed with endpoint ${endpoint}:`, error);
          fetchError = error;
          // Continue to next endpoint
        }
      }
      
      // If no endpoint worked, throw the last error
      if (!response || !response.data) {
        throw fetchError || new Error("Failed to fetch event details with any endpoint");
      }
      
      console.log("Event details:", response.data);
      
      // Make sure we have all the required fields or set defaults
      const eventData = {
        ...response.data,
        photos: response.data.photos || [],
        venue: response.data.venue || "TBD",
        price: response.data.price || 0,
        max_participants: response.data.max_participants || 0,
        description: response.data.description || "No description available",
        formatted_date: new Date(response.data.event_time).toLocaleDateString(),
        formatted_time: new Date(response.data.event_time).toLocaleTimeString()
      };
      
      setEvent(eventData);
      
      // Add a delay to ensure the UI updates properly
      setTimeout(() => {
        // Check if user is registered
        checkRegistrationStatus(eventId)
          .catch(e => console.error("Error checking registration:", e))
          .finally(() => {
            // Check if event is bookmarked
            checkBookmarkStatus(eventId)
              .catch(e => console.error("Error checking bookmark:", e))
              .finally(() => {
                setLoading(false); // Set loading to false after all checks
              });
          });
      }, 100);
      
    } catch (error) {
      console.error("Error loading event details:", error);
      toast.error("Failed to load event details");
      setEvent(null); // Reset event state on error
      setLoading(false); // Set loading to false on error
    }
  };

  const checkRegistrationStatus = async (eventId) => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        console.log("No token found, user not logged in");
        setIsRegistered(false);
        return;
      }

      // Try multiple endpoints to check registration status
      const endpoints = [
        `/events/participants/my_participations/`,
        `/participants/my_participations/`,
        `/api/events/participants/my_participations/`
      ];
      
      let response = null;
      let fetchError = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to check registration status using endpoint: ${endpoint}`);
          response = await api.get(endpoint);
          
          if (response && response.status >= 200 && response.status < 300) {
            console.log(`Registration status check successful with endpoint ${endpoint}`);
            break; // Exit the loop if fetch is successful
          }
        } catch (error) {
          console.log(`Registration status check failed with endpoint ${endpoint}:`, error);
          fetchError = error;
          // Continue to next endpoint
        }
      }
      
      // If no endpoint worked, handle the error appropriately
      if (!response) {
        console.error("Failed to check registration status with any endpoint:", fetchError);
        toast.error("Unable to verify your registration status. Please try again later.");
        setIsRegistered(false);
        return;
      }
      
      const participations = response.data;
      console.log("User participations:", participations);
      
      // Check if the user is registered for this specific event
      const isUserRegistered = participations.some(
        participation => participation.event_id === parseInt(eventId) || 
                         participation.event === parseInt(eventId) ||
                         participation.event_id === eventId ||
                         participation.event === eventId
      );
      
      console.log(`User registration status for event ${eventId}: ${isUserRegistered}`);
      setIsRegistered(isUserRegistered);
    } catch (error) {
      console.error("Error checking registration status:", error);
      setIsRegistered(false);
    }
  };

  // Fetch capacity information for the event
  const fetchCapacityInfo = async () => {
    try {
      // Try multiple endpoints for capacity information
      const capacityEndpoints = [
        `/events/participants/event_capacity/?event_id=${id}`,
        `/api/events/participants/event_capacity/?event_id=${id}`,
        `/participants/event_capacity/?event_id=${id}`
      ];
      
      console.log("Fetching capacity info for event:", id);
      
      const response = await api.tryMultipleEndpoints(capacityEndpoints, 'get');
      
      if (response.data) {
        console.log("Capacity info:", response.data);
        
        // Update event with capacity info
      setEvent(prev => ({
        ...prev,
          registered_participants: response.data.current_participants || 0,
          is_full: response.data.is_full || false,
          remaining_spots: response.data.remaining_spots || 0
      }));
      }
    } catch (error) {
      console.error("Error fetching capacity info:", error);
      // Don't show a toast for this error as it's not critical
      // Just set some reasonable defaults
      setEvent(prev => ({
        ...prev,
        is_full: prev.registered_participants >= prev.max_participants,
        remaining_spots: Math.max(0, (prev.max_participants || 0) - (prev.registered_participants || 0))
      }));
    }
  };

  const fetchFeedback = async () => {
    try {
      console.log(`Fetching feedback for event ${id}`);
      
      // First, try the correct endpoint pattern for feedback
      const response = await api.get(`/events/events/${id}/feedback/`);
      console.log("Feedback response:", response.data);
      
      // Set the feedback data
      const feedbackData = response.data.results || response.data;
      setFeedback(Array.isArray(feedbackData) ? feedbackData : []);
      
      // Check if the current user has already left feedback
      if (isUserLoggedIn && userId) {
        console.log("Checking if user has already submitted feedback");
        const userFeedbackItem = feedbackData.find(item => {
          return parseInt(item.user) === parseInt(userId);
        });
        
        console.log("User feedback found:", userFeedbackItem);
        setUserFeedback(userFeedbackItem || null);
        
        // Update canLeaveFeedback based on this info and event status
        setCanLeaveFeedback(
          isRegistered && 
          !userFeedbackItem && 
          (event?.status === "completed" || event?.clientSideStatus === "completed")
        );
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      
      // Try alternative endpoint
      try {
        const altResponse = await api.get(`/events/feedback/?event=${id}`);
        const feedbackData = altResponse.data.results || altResponse.data;
        setFeedback(Array.isArray(feedbackData) ? feedbackData : []);
        
        if (isUserLoggedIn && userId) {
          const userFeedbackItem = feedbackData.find(item => 
            parseInt(item.user) === parseInt(userId)
          );
          setUserFeedback(userFeedbackItem || null);
          
          setCanLeaveFeedback(
            isRegistered && 
            !userFeedbackItem && 
            (event?.status === "completed" || event?.clientSideStatus === "completed")
          );
        }
      } catch (altError) {
        console.error("Error fetching feedback with alternate endpoint:", altError);
      setFeedback([]);
      setUserFeedback(null);
      }
    }
  };

  const registerForEvent = async () => {
    try {
      setIsRegistering(true);
      
      // List of possible endpoints for registration
      const registrationEndpoints = [
        `/events/participants/`,
        `/api/events/participants/`,
        `/participants/`
      ];
      
      const registrationPayload = { event: Number(id) };
      
      console.log("Attempting to register for event with ID:", id);
      
      // Try each endpoint
      try {
        await api.tryMultipleEndpoints(registrationEndpoints, 'post', registrationPayload);
        
      setIsRegistered(true);
      
        // Update capacity info after successful registration
        fetchCapacityInfo().catch(e => console.error("Error updating capacity info:", e));
        
        toast.success("Registration successful!");
        
        // Get latest event info
      fetchEventDetails();
    } catch (error) {
        console.error("Registration failed:", error);
        
        // Handle specific error cases
        if (error.response) {
          if (error.response.status === 400) {
            // Check for specific error messages
            const errorMessage = error.response.data.detail || 
                               error.response.data.error || 
                               "Registration failed due to validation errors";
                               
            if (errorMessage.includes("already registered")) {
              toast.warning("You are already registered for this event");
              setIsRegistered(true);
              return;
            } else if (errorMessage.includes("full") || errorMessage.includes("capacity")) {
              toast.error("This event is full. No more registrations allowed.");
              return;
            }
            
            toast.error(errorMessage);
          } else if (error.response.status === 401 || error.response.status === 403) {
            toast.error("Please log in to register for this event");
        navigate("/login_reg");
      } else {
            toast.error("Registration failed. Please try again later.");
          }
        } else {
          toast.error("Network error. Please check your connection and try again.");
        }
      }
    } catch (generalError) {
      console.error("General registration error:", generalError);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.delete(`/events/${id}/`);
        toast.success("Event deleted successfully");
        navigate("/events");
      } catch (error) {
        toast.error("Failed to delete event");
      }
    }
  };
  
  const handleFeedbackChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setIsAnonymous(checked);
    } else {
      setFeedbackText(value);
    }
  };
  
  const handleRatingClick = (rating) => {
    setFeedbackRating(rating);
  };
  
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingFeedback(true);
      
      if (!feedbackText.trim() || feedbackRating === 0) {
        toast.warning("Please provide both a rating and comment");
        return;
      }
      
      const feedbackPayload = {
        event: parseInt(id, 10),
        rating: feedbackRating,
        comment: feedbackText,
        is_anonymous: isAnonymous
      };
      
      console.log("Submitting feedback:", feedbackPayload);
      
      // Try multiple endpoints for feedback submission
      const feedbackEndpoints = [
        `/events/${id}/feedback/`,
        `/api/events/${id}/feedback/`,
        `/events/events/${id}/feedback/`
      ];
      
      await api.tryMultipleEndpoints(feedbackEndpoints, 'post', feedbackPayload);
      
      toast.success("Thank you for your feedback!");
      setShowFeedbackForm(false);
      setFeedbackText("");
      setFeedbackRating(0);
      setIsAnonymous(false);
      
      // Refresh feedback
      fetchFeedback();
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      
      if (error.response?.status === 400) {
        if (error.response.data.non_field_errors?.includes("already provided feedback")) {
          toast.warning("You have already provided feedback for this event");
        } else {
          const errorMsg = error.response.data.detail || 
                        error.response.data.error || 
                        "Invalid feedback data";
          toast.error(errorMsg);
        }
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Please log in to submit feedback");
      } else {
        toast.error("Failed to submit feedback. Please try again later.");
      }
    } finally {
      setSubmittingFeedback(false);
    }
  };
  
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className={styles.starFilled} />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className={styles.starHalf} />);
      } else {
        stars.push(<FaRegStar key={i} className={styles.starEmpty} />);
      }
    }
    
    return <div className={styles.starRating}>{stars}</div>;
  };
  
  const calculateAverageRating = () => {
    if (!feedback || feedback.length === 0) return 0;
    const sum = feedback.reduce((total, item) => total + item.rating, 0);
    return (sum / feedback.length).toFixed(1);
  };

  const fetchRelatedEvents = async () => {
    try {
      // Try multiple endpoints for related events
      const relatedEndpoints = [
        `/events/${id}/related/`,
        `/api/events/${id}/related/`,
        `/events/events/${id}/related/`
      ];
      
      console.log("Fetching related events for:", id);
      
      const response = await api.tryMultipleEndpoints(relatedEndpoints, 'get');
      
      if (response.data) {
        console.log("Related events:", response.data);
      setRelatedEvents(response.data);
      }
    } catch (error) {
      console.error("Error fetching related events:", error);
      // If we can't get related events, just use empty array
      setRelatedEvents([]);
    }
  };

  const checkBookmarkStatus = async (eventId) => {
    try {
      // Try the correct bookmarks endpoint
      const response = await api.get(`/events/bookmarked/`);
      
      if (response && response.data) {
        // If response is an array of bookmarked events
        if (Array.isArray(response.data)) {
          const isCurrentEventBookmarked = response.data.some(
            bookmark => bookmark.id === parseInt(eventId || id)
          );
      setIsBookmarked(isCurrentEventBookmarked);
        } 
        // If response is a different format, handle as needed
        else if (typeof response.data === 'object') {
          const bookmarks = response.data.results || [];
          const isCurrentEventBookmarked = bookmarks.some(
            bookmark => bookmark.id === parseInt(eventId || id)
          );
          setIsBookmarked(isCurrentEventBookmarked);
        }
      }
    } catch (error) {
      // If the first endpoint fails, try an alternative
      try {
        const response = await api.get(`/api/events/bookmarked/`);
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            const isCurrentEventBookmarked = response.data.some(
              bookmark => bookmark.id === parseInt(eventId || id)
            );
            setIsBookmarked(isCurrentEventBookmarked);
          }
        }
      } catch (err) {
        // Log error but don't let it break the component
      console.error("Error checking bookmark status:", error);
        console.log("Defaulting bookmark status to false");
      setIsBookmarked(false);
    }
    }
    
    // Explicitly return so Promise chaining works
    return;
  };

  const toggleBookmark = async () => {
    try {
      setIsBookmarking(true);
      
      // List of possible endpoints for bookmark actions
      const bookmarkEndpoints = [
        `/events/${id}/bookmark/`,
        `/api/events/${id}/bookmark/`,
        `/events/events/${id}/bookmark/`
      ];
      
      if (isBookmarked) {
        // Try multiple endpoints for delete action
        try {
          await api.tryMultipleEndpoints(bookmarkEndpoints, 'delete');
        setIsBookmarked(false);
        toast.success("Event removed from bookmarks");
        } catch (error) {
          console.error("Failed to remove bookmark:", error);
          toast.error("Failed to remove bookmark");
        }
      } else {
        // Try multiple endpoints for post action
        try {
          await api.tryMultipleEndpoints(bookmarkEndpoints, 'post');
        setIsBookmarked(true);
          toast.success("Event added to bookmarks");
        } catch (error) {
          console.error("Failed to add bookmark:", error);
          toast.error("Failed to add bookmark");
        }
      }
    } catch (error) {
      console.error("Toggle bookmark error:", error);
      toast.error("Failed to update bookmark status");
    } finally {
      setIsBookmarking(false);
    }
  };

  // Function to cancel event registration
  const cancelRegistration = async () => {
    if (!window.confirm("Are you sure you want to cancel your registration for this event?")) {
      return;
    }
    
    try {
      setIsCanceling(true);
      
      // List of possible endpoints for canceling registration
      const cancelEndpoints = [
        `/events/participants/${id}/cancel/`,
        `/api/events/participants/${id}/cancel/`,
        `/events/participants/cancel/${id}/`,
        `/api/events/participants/cancel/${id}/`
      ];
      
      console.log("Attempting to cancel registration for event ID:", id);
      
      // Try each endpoint
      try {
        await api.tryMultipleEndpoints(cancelEndpoints, 'post');
        setIsRegistered(false);
        toast.success("Registration canceled successfully");
        
        // Update capacity info after successful cancellation
        fetchCapacityInfo().catch(e => console.error("Error updating capacity info:", e));
        
        // Get latest event info
        fetchEventDetails();
        
        // Dispatch event to update the dashboard if it's open
        window.dispatchEvent(new CustomEvent('registration-canceled', { detail: { eventId: id } }));
      } catch (error) {
        console.error("Cancellation failed with POST method:", error);
        
        // Try with DELETE method as fallback
        try {
          const deleteEndpoints = [
            `/events/participants/${id}/`,
            `/api/events/participants/${id}/`, 
            `/participants/${id}/`
          ];
          
          await api.tryMultipleEndpoints(deleteEndpoints, 'delete');
          
          setIsRegistered(false);
          toast.success("Registration canceled successfully");
          fetchCapacityInfo();
          fetchEventDetails();
          
          // Dispatch event to update the dashboard if it's open
          window.dispatchEvent(new CustomEvent('registration-canceled', { detail: { eventId: id } }));
        } catch (deleteError) {
          console.error("Cancellation failed with DELETE method:", deleteError);
          toast.error("Failed to cancel registration. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Error canceling registration:", error);
      toast.error("Failed to cancel registration. Please try again.");
    } finally {
      setIsCanceling(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!event) {
    return <div className={styles.error}>Event not found</div>;
  }

  // Add debugging before render
  console.log("RENDER DEBUG - Component state:", {
    eventId: id,
    eventData: event,
    isLoading: loading,
    userLoggedIn: isUserLoggedIn,
    registrationStatus: isRegistered,
    bookmarkStatus: isBookmarked
  });

  try {
  return (<>
    <div className={styles.dummy}></div>
    <div className={styles.eventDetailsContainer}>
      <div className={styles.eventHeader}>
        <h1>{event.event_name}</h1>
        <div className={styles.headerActions}>
          <span className={styles.eventType}>{event.event_type}</span>
          <button
            onClick={toggleBookmark}
            className={styles.bookmarkButton}
            title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
          </button>
          {event.status && (
            <span className={`${styles.statusBadge} ${styles[event.clientSideStatus || event.status]}`}>
              {event.clientSideStatus || event.status}
            </span>
          )}
          {(userRole === "admin" || userRole === "coordinator") && (
            <div className={styles.adminActions}>
              <button
                onClick={() => navigate(`/events/edit/${id}`)}
                className={styles.editButton}
              >
                <FaEdit /> Edit
              </button>
              <button onClick={handleDelete} className={styles.deleteButton}>
                <FaTrash /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

        {event.photos && Array.isArray(event.photos) && event.photos.length > 0 ? (
        <div className={styles.imageGallery}>
            {event.photos[selectedImage] && event.photos[selectedImage].photo_url ? (
          <img
            src={event.photos[selectedImage].photo_url}
            alt={`Event photo ${selectedImage + 1}`}
            className={styles.mainImage}
          />
            ) : (
              <div className={styles.noPhotoPlaceholder}>
                <FaCalendar size={48} />
                <p>Photo unavailable</p>
              </div>
            )}
          <div className={styles.thumbnails}>
              {event.photos
                .filter(photo => photo && photo.photo_url)
                .map((photo, index) => (
              <img
                key={index}
                src={photo.photo_url}
                alt={`Thumbnail ${index + 1}`}
                className={`${styles.thumbnail} ${
                  selectedImage === index ? styles.active : ""
                }`}
                onClick={() => setSelectedImage(index)}
              />
            ))}
          </div>
        </div>
        ) : (
          <div className={styles.noPhotos}>
            <p>No photos available for this event</p>
          </div>
      )}

      <div className={styles.eventInfo}>
        <div className={styles.infoItem}>
          <FaCalendar className={styles.infoIcon} />
          <span>{event.formatted_date}</span>
        </div>
        <div className={styles.infoItem}>
          <FaClock className={styles.infoIcon} />
          <span>{event.formatted_time}</span>
        </div>
        <div className={styles.infoItem}>
          <FaMapMarkerAlt className={styles.infoIcon} />
          <span>{event.venue}</span>
        </div>
        {event.max_participants > 0 && (
          <div className={styles.infoItem}>
            <FaUsers className={styles.infoIcon} />
            <span className={event.is_full ? styles.capacityFull : ''}>
              {event.registered_participants || 0}/{event.max_participants} registered
              {event.is_full && <span className={styles.fullBadge}> (FULL)</span>}
            </span>
          </div>
        )}
        {event.is_paid && (
          <div className={styles.infoItem}>
            <FaDollarSign className={styles.infoIcon} />
            <span>₹{event.price}</span>
          </div>
        )}
        {feedback.length > 0 && (
          <div className={styles.infoItem}>
            <FaStar className={styles.infoIcon} />
            <span>
              {calculateAverageRating()} ({feedback.length} reviews)
            </span>
          </div>
        )}
      </div>

      <OrganizerProfile event={event} />

      <div className={styles.description}>
        <h2><FaInfoCircle /> Description</h2>
        <p>{event.description}</p>
      </div>
      
      {/* Venue Information Section */}
      <div className={styles.venueSection}>
        <h2><FaMapMarkerAlt /> Venue Details</h2>
        {event.venue && (
          <div className={styles.venueContainer}>
            <div className={styles.venueImageContainer}>
              {event.venue_details?.image_url ? (
                <img 
                  src={event.venue_details.image_url} 
                  alt={`${event.venue} venue`} 
                  className={styles.venueImage}
                />
              ) : (
                <div className={styles.venuePlaceholder}>
                  <FaMapMarkerAlt className={styles.venuePlaceholderIcon} />
                  <span>No venue image available</span>
                </div>
              )}
            </div>
            <div className={styles.venueInfo}>
              <h3>{event.venue}</h3>
              {event.venue_details?.address && (
                <p className={styles.venueAddress}>
                  <FaMapMarkerAlt className={styles.venueInfoIcon} />
                  {event.venue_details.address}
                </p>
              )}
              {event.venue_details?.capacity && (
                <p className={styles.venueCapacity}>
                  <FaUsers className={styles.venueInfoIcon} />
                  Capacity: {event.venue_details.capacity} people
                </p>
              )}
              {event.venue_details?.features && event.venue_details.features.length > 0 && (
                <div className={styles.venueFeatures}>
                  <h4>Venue Features:</h4>
                  <div className={styles.featuresList}>
                    {event.venue_details.features.map((feature, index) => (
                      <span key={index} className={styles.featureTag}>
                        <FaCheck className={styles.featureIcon} /> {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Social Sharing Section */}
      <div className={styles.socialShare}>
        <h2><FaShareAlt /> Share This Event</h2>
        <div className={styles.shareButtons}>
          <button 
            className={`${styles.shareButton} ${styles.facebookShare}`}
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
          >
            <FaFacebookF /> Share on Facebook
          </button>
          <button 
            className={`${styles.shareButton} ${styles.twitterShare}`}
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out this event: ${event.event_name}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
          >
            <FaTwitter /> Share on Twitter
          </button>
          <button 
            className={`${styles.shareButton} ${styles.linkedinShare}`}
            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
          >
            <FaLinkedinIn /> Share on LinkedIn
          </button>
        </div>
      </div>
      
      {/* Add to Calendar Section */}
      <div className={styles.calendarSection}>
        <h2><FaCalendarPlus /> Add to Calendar</h2>
        <div className={styles.calendarButtons}>
          <button 
            className={`${styles.calendarButton} ${styles.googleCalendar}`}
            onClick={() => window.open(getGoogleCalendarUrl(event), '_blank')}
          >
            <FaGoogle /> Google Calendar
          </button>
          <button 
            className={`${styles.calendarButton} ${styles.outlookCalendar}`}
            onClick={() => window.open(getOutlookCalendarUrl(event), '_blank')}
          >
            <FaMicrosoft /> Outlook
          </button>
          <button 
            className={`${styles.calendarButton} ${styles.appleCalendar}`}
            onClick={() => downloadICalendarFile(event)}
          >
            <FaApple /> Apple Calendar
          </button>
        </div>
      </div>
      
      {/* Feedback Section */}
      <div className={styles.feedbackSection}>
        <h2>
          <FaComments /> Reviews & Feedback 
          {feedback.length > 0 && <span className={styles.reviewCount}>({feedback.length})</span>}
        </h2>
        
        {event.status === "completed" && (
          <>
            {isUserLoggedIn ? (
              <>
                {isRegistered ? (
                  <>
                    {userFeedback ? (
                      <div className={styles.userFeedbackStatus}>
                        <FaCheckCircle className={styles.feedbackSubmittedIcon} />
                        <span>You have already submitted feedback for this event.</span>
                      </div>
                    ) : (
                      <div className={styles.leaveFeedback}>
                        {!showFeedbackForm ? (
                          <button 
                            className={styles.feedbackButton} 
                            onClick={() => setShowFeedbackForm(true)}
                          >
                            <FaComments /> Leave Feedback
                          </button>
                        ) : (
                          <form className={styles.feedbackForm} onSubmit={handleFeedbackSubmit}>
                            <div className={styles.ratingSelector}>
                              <label>Your Rating:</label>
                              <div className={styles.starSelector}>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span 
                                    key={star}
                                    onClick={() => handleRatingClick(star)}
                                    className={feedbackForm.rating >= star ? styles.starFilled : styles.starEmpty}
                                  >
                                    {feedbackForm.rating >= star ? <FaStar /> : <FaRegStar />}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div className={styles.formGroup}>
                              <label htmlFor="comment">Your Comments:</label>
                              <textarea
                                id="comment"
                                name="comment"
                                value={feedbackForm.comment}
                                onChange={handleFeedbackChange}
                                placeholder="Share your experience with this event..."
                                required
                              />
                            </div>
                            
                            <div className={styles.formGroup}>
                              <label className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  name="is_anonymous"
                                  checked={feedbackForm.is_anonymous}
                                  onChange={handleFeedbackChange}
                                />
                                Post as anonymous
                              </label>
                            </div>
                            
                            <div className={styles.formActions}>
                              <button type="submit" className={styles.submitButton}>
                                Submit Feedback
                              </button>
                              <button 
                                type="button" 
                                className={styles.cancelButton}
                                onClick={() => setShowFeedbackForm(false)}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.feedbackNotice}>
                    <FaInfoCircle />
                    <span>Only participants who attended this event can leave feedback.</span>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.feedbackNotice}>
                <FaInfoCircle />
                <span>Please <button onClick={() => navigate("/login_reg")} className={styles.loginLink}>login</button> to leave feedback.</span>
              </div>
            )}
          </>
        )}

        {event.status !== "completed" && (
          <div className={styles.feedbackNotice}>
            <FaInfoCircle />
            <span>Feedback can be left after the event is completed.</span>
          </div>
        )}
        
        {feedback.length > 0 ? (
          <div className={styles.feedbackList}>
            {feedback.map(item => (
              <div key={item.id} className={styles.feedbackItem}>
                <div className={styles.feedbackHeader}>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>
                      <FaUserCircle className={styles.userIcon} /> {item.user_name || "Anonymous User"}
                    </span>
                    <span className={styles.feedbackDate}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.ratingDisplay}>
                    {renderStarRating(item.rating)}
                  </div>
                </div>
                {item.comment && (
                  <div className={styles.feedbackComment}>
                    <p>{item.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noFeedback}>
            <FaComments className={styles.noFeedbackIcon} />
            <p>No reviews yet. {event.status === "completed" && "Be the first to leave feedback for this event!"}</p>
          </div>
        )}
      </div>

      <EventQA event={event} isOrganizer={userRole === 'coordinator' || event.created_by === userId} />

      <div className={styles.actions}>
        {isUserLoggedIn ? (
          isRegistered ? (
              <div className={styles.registeredActions}>
            <div className={styles.registeredStatus}>
              <FaCheckCircle className={styles.registeredIcon} />
              <span>You are registered for this event!</span>
                </div>
                {event.status === "upcoming" && (
                  <button 
                    onClick={cancelRegistration}
                    className={styles.cancelRegistrationButton}
                    disabled={isCanceling}
                  >
                    {isCanceling ? "Canceling..." : "Cancel Registration"}
                  </button>
                )}
            </div>
          ) : (
            event.status === "upcoming" && (
              <button
                  onClick={registerForEvent}
                className={styles.registerButton}
                disabled={
                    isRegistered ||
                  event.is_full || 
                    isRegistering ||
                    !isUserLoggedIn
                }
              >
                  {isRegistering ? "Registering..." : event.is_full ? "Event Full" : "Register for Event"}
              </button>
            )
          )
        ) : (
          <button 
            onClick={() => navigate("/login_reg")} 
            className={styles.loginToRegisterButton}
          >
            <FaUserCircle /> Login to Register
          </button>
        )}
        <button
          onClick={() => navigate("/events")}
          className={styles.backButton}
        >
          <FaChevronLeft /> Back to Events
        </button>
      </div>

      {relatedEvents.length > 0 && (
        <div className={styles.relatedEventsSection}>
          <h2>
            <FaCalendar /> Similar Events
          </h2>
          <div className={styles.relatedEventsList}>
            {relatedEvents.map(relatedEvent => (
              <div 
                key={relatedEvent.id} 
                className={styles.relatedEventCard}
                onClick={() => navigate(`/events/${relatedEvent.id}`)}
              >
                {relatedEvent.photos && relatedEvent.photos[0] && (
                  <div className={styles.relatedEventImage}>
                    <img 
                      src={relatedEvent.photos[0].photo_url} 
                      alt={relatedEvent.event_name} 
                    />
                  </div>
                )}
                <div className={styles.relatedEventInfo}>
                  <h3>{relatedEvent.event_name}</h3>
                  <div className={styles.relatedEventDetails}>
                    <span>
                      <FaCalendar /> 
                      {new Date(relatedEvent.event_time).toLocaleDateString()}
                    </span>
                    <span>
                      <FaMapMarkerAlt /> 
                      {relatedEvent.venue}
                    </span>
                  </div>
                  {relatedEvent.is_paid && (
                    <span className={styles.relatedEventPrice}>
                      <FaDollarSign />₹{relatedEvent.price}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </>);
  } catch (error) {
    console.error("Error rendering event details:", error);
    return (
      <div className={styles.error}>
        <h2>Error displaying event details</h2>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
        <details>
          <summary>Technical Details</summary>
          <p>{error.toString()}</p>
        </details>
      </div>
    );
  }
};

export default EventDetails;
