import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaCalendar, FaClock, FaUsers, FaTicketAlt } from "react-icons/fa";
import api from "../utils/api";
import styles from "../assets/css/eventDetails.module.css";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/events/events/${id}/`);
      setEvent(response.data);
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to load event details");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!event) {
    return <div className={styles.error}>Event not found</div>;
  }

  return (
    <>
      <div
        className="dummy"
        style={{
          height: "90px",
          width: "100%",
          backgroundColor: "rgba(21, 34, 43, 0.85)",
          position: "relative",
        }}
      ></div>
      <div className={styles.eventDetailsContainer}>
        <div className={styles.eventHeader}>
          <h1>{event.event_name}</h1>
          <span className={styles.eventType}>{event.event_type}</span>
        </div>

        {event.photos && event.photos.length > 0 && (
          <div className={styles.imageGallery}>
            {event.photos.map((photo, index) => (
              <img
                key={index}
                src={photo.photo_url}
                alt={`Event photo ${index + 1}`}
                className={styles.eventImage}
              />
            ))}
          </div>
        )}

        <div className={styles.eventInfo}>
          <div className={styles.infoItem}>
            <FaCalendar />
            <span>{new Date(event.event_time).toLocaleDateString()}</span>
          </div>
          <div className={styles.infoItem}>
            <FaClock />
            <span>{new Date(event.event_time).toLocaleTimeString()}</span>
          </div>
          {event.audience && (
            <div className={styles.infoItem}>
              <FaUsers />
              <span>{event.audience}</span>
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
          <button
            onClick={() => navigate("/events")}
            className={styles.backButton}
          >
            Back to Events
          </button>
        </div>
      </div>
    </>
  );
};

export default EventDetails;
