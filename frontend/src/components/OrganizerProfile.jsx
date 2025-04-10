import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaCalendar,
} from 'react-icons/fa';
import api from '../utils/api';
import styles from '../assets/css/organizerProfile.module.css';

const OrganizerProfile = ({ event }) => {
  const [organizer, setOrganizer] = useState(null);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (event?.created_by) {
      fetchOrganizerDetails();
      fetchOrganizerEvents();
    }
  }, [event]);

  const fetchOrganizerDetails = async () => {
    try {
      const response = await api.get(`/users/users/${event.created_by}/`);
      setOrganizer(response.data);
    } catch (error) {
      console.error('Error fetching organizer details:', error);
    }
  };

  const fetchOrganizerEvents = async () => {
    try {
      // Try several variations of the endpoint to get events by creator
      let eventsData = null;
      let error = null;
      
      try {
        // Try direct API endpoint first
        const response = await api.get(`/events/?created_by=${event.created_by}`);
        eventsData = response.data.results || response.data;
      } catch (err) {
        error = err;
        try {
          // Try nested endpoint format
          const response = await api.get(`/events/events/?created_by=${event.created_by}`);
          eventsData = response.data;
        } catch (err2) {
          error = err2;
          try {
            // Try direct API endpoint with filters
            const response = await api.get(`/api/events/?created_by=${event.created_by}`);
            eventsData = response.data.results || response.data;
          } catch (err3) {
            error = err3;
          }
        }
      }
      
      if (eventsData) {
        // Filter out current event and limit to max 3 events
        eventsData = Array.isArray(eventsData) 
          ? eventsData.filter(e => e.id !== event.id).slice(0, 3)
          : [];
        setOrganizerEvents(eventsData);
      } else {
        console.error("Error fetching organizer events:", error);
        setOrganizerEvents([]);
      }
    } catch (error) {
      console.error("Error fetching organizer events:", error);
      setOrganizerEvents([]);
    }
  };

  if (!organizer) return null;

  return (
    <div className={styles.organizerSection}>
      <h2><FaUser /> Event Organizer</h2>
      
      <div className={styles.organizerInfo}>
        <div className={styles.organizerHeader}>
          <div className={styles.organizerName}>
            <h3>{organizer.name || organizer.username}</h3>
            {event.organizer_info && (
              <p className={styles.organizerBio}>{event.organizer_info}</p>
            )}
          </div>
        </div>

        <div className={styles.contactInfo}>
          {event.organizer_email && (
            <a href={`mailto:${event.organizer_email}`} className={styles.contactItem}>
              <FaEnvelope /> {event.organizer_email}
            </a>
          )}
          {event.organizer_phone && (
            <a href={`tel:${event.organizer_phone}`} className={styles.contactItem}>
              <FaPhone /> {event.organizer_phone}
            </a>
          )}
          {event.organizer_website && (
            <a href={event.organizer_website} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
              <FaGlobe /> Website
            </a>
          )}
        </div>

        {event.organizer_social && (
          <div className={styles.socialLinks}>
            {event.organizer_social.facebook && (
              <a href={event.organizer_social.facebook} target="_blank" rel="noopener noreferrer">
                <FaFacebook />
              </a>
            )}
            {event.organizer_social.twitter && (
              <a href={event.organizer_social.twitter} target="_blank" rel="noopener noreferrer">
                <FaTwitter />
              </a>
            )}
            {event.organizer_social.linkedin && (
              <a href={event.organizer_social.linkedin} target="_blank" rel="noopener noreferrer">
                <FaLinkedin />
              </a>
            )}
            {event.organizer_social.instagram && (
              <a href={event.organizer_social.instagram} target="_blank" rel="noopener noreferrer">
                <FaInstagram />
              </a>
            )}
          </div>
        )}
      </div>

      {organizerEvents.length > 0 && (
        <div className={styles.otherEvents}>
          <h3><FaCalendar /> Other Events by this Organizer</h3>
          <div className={styles.eventsList}>
            {organizerEvents.map(otherEvent => (
              <div 
                key={otherEvent.id} 
                className={styles.eventCard}
                onClick={() => navigate(`/events/${otherEvent.id}`)}
              >
                {otherEvent.photos && otherEvent.photos[0] && (
                  <div className={styles.eventImage}>
                    <img src={otherEvent.photos[0].photo_url} alt={otherEvent.event_name} />
                  </div>
                )}
                <div className={styles.eventInfo}>
                  <h4>{otherEvent.event_name}</h4>
                  <span className={styles.eventDate}>
                    <FaCalendar />
                    {new Date(otherEvent.event_time).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerProfile; 