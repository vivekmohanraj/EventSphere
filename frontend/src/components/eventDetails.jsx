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
} from "react-icons/fa";
import api from "../utils/api";
import { getGoogleCalendarUrl, getOutlookCalendarUrl, downloadICalendarFile } from "../utils/calendarUtils";
import styles from "../assets/css/eventDetails.module.css";
import OrganizerProfile from './OrganizerProfile';
import EventQA from './EventQA';

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

  useEffect(() => {
    fetchEventDetails();
    checkUserRole();
    fetchFeedback();
    if (event) {
      fetchRelatedEvents();
    }
    checkBookmarkStatus();
    // eslint-disable-next-line
  }, [id]);

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
      // Fetch event details using the event id
      const response = await api.get(`/events/events/${id}/`);
      if (response.data) {
        setEvent({
          ...response.data,
          photos: response.data.photos || [],
          formatted_date: new Date(
            response.data.event_time
          ).toLocaleDateString(),
          formatted_time: new Date(
            response.data.event_time
          ).toLocaleTimeString(),
        });
        
        // Check if user is registered for the event
        if (response.data.is_registered) {
          // Check if the event is completed to allow feedback
          if (response.data.status === "completed") {
            setCanLeaveFeedback(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to load event details");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFeedback = async () => {
    try {
      const response = await api.get(`/events/${id}/feedback/`);
      setFeedback(response.data);
      
      // Check if user has already submitted feedback
      const userFeedback = response.data.find(item => item.user === userId);
      if (userFeedback) {
        setUserFeedback(userFeedback);
        setCanLeaveFeedback(false);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  const handleRegister = async () => {
    try {
      await api.post(`/events/${id}/register/`);
      toast.success("Successfully registered for the event!");
      fetchEventDetails(); // Refresh event details after registration
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to register for event"
      );
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
      await api.post(`/events/${id}/feedback/`, feedbackForm);
      toast.success("Thank you for your feedback!");
      setShowFeedbackForm(false);
      fetchFeedback();
      setCanLeaveFeedback(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit feedback");
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
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const response = await api.get(`/events/events/${id}/bookmarked/`);
      setIsBookmarked(response.data.length > 0);
    } catch (error) {
      console.error("Error checking bookmark status:", error);
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
            <span className={`${styles.statusBadge} ${styles[event.status]}`}>
              {event.status}
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
        {event.max_participants && (
          <div className={styles.infoItem}>
            <FaUsers className={styles.infoIcon} />
            <span>
              {event.registered_participants || 0}/{event.max_participants} registered
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
        
        {canLeaveFeedback && (
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
        
        {feedback.length > 0 ? (
          <div className={styles.feedbackList}>
            {feedback.map(item => (
              <div key={item.id} className={styles.feedbackItem}>
                <div className={styles.feedbackHeader}>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>
                      <FaUserCircle className={styles.userIcon} /> {item.user_name}
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
            <p>No reviews yet. Be the first to leave feedback for this event!</p>
          </div>
        )}
      </div>

      <EventQA event={event} isOrganizer={userRole === 'coordinator' || event.created_by === userId} />

      <div className={styles.actions}>
        {!event.is_registered && event.status === "upcoming" && (
          <button
            onClick={handleRegister}
            className={styles.registerButton}
            disabled={
              event.max_participants &&
              event.registered_participants >= event.max_participants
            }
          >
            {event.is_paid ? <><FaDollarSign /> Register & Pay</> : <><FaCheckCircle /> Register Now</>}
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
