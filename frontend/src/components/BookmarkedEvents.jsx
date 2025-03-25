import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaBookmark, FaCalendar, FaMapMarkerAlt } from 'react-icons/fa';
import api from '../utils/api';
import styles from '../assets/css/eventList.module.css';

const BookmarkedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookmarkedEvents();
  }, []);

  const fetchBookmarkedEvents = async () => {
    try {
      const response = await api.get('/events/events/bookmarked/');
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load bookmarked events');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.bookmarkedEventsContainer}>
      <h1><FaBookmark /> My Bookmarked Events</h1>
      {events.length === 0 ? (
        <div className={styles.noEvents}>
          <p>You haven't bookmarked any events yet.</p>
        </div>
      ) : (
        <div className={styles.eventGrid}>
          {events.map(event => (
            <div 
              key={event.id} 
              className={styles.eventCard}
              onClick={() => navigate(`/events/${event.id}`)}
            >
              {event.photos && event.photos[0] && (
                <div className={styles.eventImage}>
                  <img src={event.photos[0].photo_url} alt={event.event_name} />
                </div>
              )}
              <div className={styles.eventInfo}>
                <h3>{event.event_name}</h3>
                <div className={styles.eventDetails}>
                  <span>
                    <FaCalendar />
                    {new Date(event.event_time).toLocaleDateString()}
                  </span>
                  <span>
                    <FaMapMarkerAlt />
                    {event.venue}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarkedEvents; 