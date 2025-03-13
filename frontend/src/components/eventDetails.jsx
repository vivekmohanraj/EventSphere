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
} from "react-icons/fa";
import api from "../utils/api";
import styles from "../assets/css/eventDetails.module.css";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchEventDetails();
    checkUserRole();
    // eslint-disable-next-line
  }, [id]);

  const checkUserRole = async () => {
    try {
      const response = await api.get("/users/profile/");
      setUserRole(response.data.role);
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
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to load event details");
      navigate("/events");
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!event) {
    return <div className={styles.error}>Event not found</div>;
  }

  return (
    <div className={styles.eventDetailsContainer}>
      <div className={styles.eventHeader}>
        <h1>{event.event_name}</h1>
        <div className={styles.headerActions}>
          <span className={styles.eventType}>{event.event_type}</span>
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
          <FaCalendar />
          <span>{event.formatted_date}</span>
        </div>
        <div className={styles.infoItem}>
          <FaClock />
          <span>{event.formatted_time}</span>
        </div>
        <div className={styles.infoItem}>
          <FaMapMarkerAlt />
          <span>{event.venue}</span>
        </div>
        {event.max_participants && (
          <div className={styles.infoItem}>
            <FaUsers />
            <span>
              {event.registered_participants || 0}/{event.max_participants}{" "}
              registered
            </span>
          </div>
        )}
        {event.is_paid && (
          <div className={styles.infoItem}>
            <FaTicketAlt />
            <span>₹{event.price}</span>
          </div>
        )}
      </div>

      <div className={styles.description}>
        <h2>Description</h2>
        <p>{event.description}</p>
      </div>

      <div className={styles.actions}>
        {!event.is_registered && event.status === "active" && (
          <button
            onClick={handleRegister}
            className={styles.registerButton}
            disabled={
              event.max_participants &&
              event.registered_participants >= event.max_participants
            }
          >
            {event.is_paid ? "Register & Pay" : "Register Now"}
          </button>
        )}
        <button
          onClick={() => navigate("/events")}
          className={styles.backButton}
        >
          Back to Events
        </button>
      </div>
    </div>
  );
};

export default EventDetails;
