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
      const response = await api.get("/users/profile/");
      setUserRole(response.data.role);
      setUserId(response.data.id);
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true); // Ensure loading is set to true at start
      // Updated URL to match backend endpoint format
      const response = await api.get(`/events/events/${id}/`);
      const eventData = response.data;

      // Format the date and time for display
      const eventDate = new Date(eventData.event_time);
      const formattedDate = eventDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = eventDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      setEvent({
        ...eventData,
        formatted_date: formattedDate,
        formatted_time: formattedTime,
      });

      // Check if user is registered for this event
      const token = localStorage.getItem(ACCESS_TOKEN);
      const user = localStorage.getItem('user');
      if (token && user) {
        checkRegistrationStatus(eventData.id);
      }
      
      setLoading(false); // Set loading to false after data is fetched
    } catch (error) {
      console.error("Error loading event details:", error);
      toast.error("Failed to load event details");
      setLoading(false); // Set loading to false on error
    }
  };

  const checkRegistrationStatus = async (eventId) => {
    try {
      console.log("Checking registration status for event:", eventId);
      // Updated URL to match backend endpoint format
      const response = await api.get("/events/participants/my_participations/");
      console.log("Participations response:", response.data);
      
      // Check if the user is registered for this event
      const isRegistered = response.data.some(
        registration => registration.event === parseInt(eventId) && 
        ["registered", "attended"].includes(registration.status)
      );
      
      console.log("User is registered:", isRegistered);
      setIsRegistered(isRegistered);
    } catch (error) {
      console.error("Error checking registration status:", error);
      setIsRegistered(false);
    }
  };

  // Fetch capacity information for the event
  const fetchCapacityInfo = async () => {
    if (!event || !event.id) return;
    
    try {
      // Updated URL to match backend endpoint format
      const response = await api.get(`/events/participants/event_capacity/?event_id=${event.id}`);
      
      setEvent(prev => ({
        ...prev,
        registered_participants: response.data.current_participants,
        is_full: response.data.is_full
      }));
    } catch (error) {
      console.error("Error fetching capacity info:", error);
      // Don't show error to user
    }
  };

  const fetchFeedback = async () => {
    try {
      console.log(`Fetching feedback for event ${id}`);
      
      // Get the feedback for this event
      const response = await api.get(`/events/events/${id}/feedback/`);
      console.log("Feedback response:", response.data);
      
      // Set the feedback data
      setFeedback(response.data);
      
      // Check if the current user has already left feedback
      if (isUserLoggedIn && userId) {
        console.log("Checking if user has already submitted feedback");
        const userFeedbackItem = response.data.find(item => {
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
      // Log error but don't show to user as this is a non-critical feature
      setFeedback([]);
      setUserFeedback(null);
    }
  };

  const handleRegister = async () => {
    try {
      console.log("Attempting to register for event:", event.id);
      
      // Verify authentication
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        console.error("Authentication token not found");
        toast.error("Please log in to register for this event");
        navigate("/login_reg");
        return;
      }
      
      // Skip profile fetch and directly try to register
      // The backend should associate the user from the authentication token
      const response = await api.post("/events/participants/", {
        event: event.id,
        status: "registered"
      });
      
      console.log("Registration successful, response:", response.data);
      toast.success("Successfully registered for the event!");
      setIsRegistered(true);
      
      // Update the participant count with the response data
      if (response.data.event_capacity) {
        setEvent(prev => ({
          ...prev,
          registered_participants: response.data.event_capacity.current_participants,
          is_full: response.data.event_capacity.is_full
        }));
      }
      
      // Get updated event details
      fetchEventDetails();
    } catch (error) {
      console.error("Registration error:", error);
      console.error("Error response:", error.response?.data);
      
      // Handle specific errors
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please log in again.");
        navigate("/login_reg");
      } else if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else if (error.response && error.response.data) {
        // Show the specific validation error
        const errorMessage = Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        toast.error(`Registration failed: ${errorMessage}`);
      } else {
        toast.error("Failed to register for the event. Please try again.");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.delete(`/events/events/${id}/`);
        toast.success("Event deleted successfully");
        navigate("/events");
      } catch (error) {
        toast.error("Failed to delete event");
      }
    }
  };
  
  const handleFeedbackChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFeedbackForm({
      ...feedbackForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleRatingClick = (rating) => {
    setFeedbackForm({
      ...feedbackForm,
      rating
    });
  };
  
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format the feedback data as expected by the backend
      const feedbackData = {
        rating: feedbackForm.rating,
        comment: feedbackForm.comment,
        is_anonymous: feedbackForm.is_anonymous
      };
      
      console.log("Submitting feedback:", feedbackData);
      
      // Send feedback to the backend using the correct URL format
      const response = await api.post(`/events/events/${id}/feedback/`, feedbackData);
      
      console.log("Feedback submitted successfully:", response.data);
      toast.success("Thank you for your feedback!");
      
      // Reset the form and UI state
      setShowFeedbackForm(false);
      setFeedbackForm({
        rating: 5,
        comment: "",
        is_anonymous: false,
      });
      
      // Refresh feedback list
      fetchFeedback();
      setCanLeaveFeedback(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data) {
        // Format validation errors nicely
        const errors = Object.entries(error.response.data)
          .map(([field, messages]) => `${field}: ${messages}`)
          .join(', ');
        toast.error(`Failed to submit feedback: ${errors}`);
      } else {
        toast.error("Failed to submit feedback. Please try again later.");
      }
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
      const response = await api.get(`/events/events/${id}/related/`);
      setRelatedEvents(response.data);
    } catch (error) {
      console.error("Error fetching related events:", error);
      // Silently set empty array on error
      setRelatedEvents([]);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const response = await api.get(`/events/events/bookmarked/`);
      // Look for the current event ID in the bookmarked events list
      const isCurrentEventBookmarked = response.data.some(event => event.id === parseInt(id));
      setIsBookmarked(isCurrentEventBookmarked);
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      setIsBookmarked(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await api.delete(`/events/events/${id}/bookmark/`);
        setIsBookmarked(false);
        toast.success("Event removed from bookmarks");
      } else {
        await api.post(`/events/events/${id}/bookmark/`);
        setIsBookmarked(true);
        toast.success("Event bookmarked successfully");
      }
    } catch (error) {
      toast.error("Failed to update bookmark");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!event) {
    return <div className={styles.error}>Event not found</div>;
  }

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

      {event.photos.length > 0 && (
        <div className={styles.imageGallery}>
          <img
            src={event.photos[selectedImage].photo_url}
            alt={`Event photo ${selectedImage + 1}`}
            className={styles.mainImage}
          />
          <div className={styles.thumbnails}>
            {event.photos.map((photo, index) => (
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
            <div className={styles.registeredStatus}>
              <FaCheckCircle className={styles.registeredIcon} />
              <span>You are registered for this event!</span>
            </div>
          ) : (
            event.status === "upcoming" && (
              <button
                onClick={handleRegister}
                className={styles.registerButton}
                disabled={
                  event.is_full || 
                  (event.max_participants > 0 &&
                  event.registered_participants >= event.max_participants)
                }
              >
                {event.is_paid ? <><FaDollarSign /> Register & Pay</> : <><FaCheckCircle /> Register Now</>}
                {event.is_full && <span className={styles.fullText}> (Event is Full)</span>}
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
};

export default EventDetails;
