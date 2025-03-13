import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSearch,
  FaCalendarAlt,
} from "react-icons/fa";
import api from "../utils/api";
import styles from "../assets/css/eventsManagement.module.css";

const EventsManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("events/events/");
      setEvents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to fetch events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (eventId, newStatus) => {
    try {
      await api.patch(`events/${eventId}/status/`, {
        status: newStatus,
      });
      toast.success("Event status updated successfully");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to update event status");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.delete(`events/${eventId}/`);
        toast.success("Event deleted successfully");
        fetchEvents();
      } catch (error) {
        toast.error("Failed to delete event");
      }
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.event_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Events Management</h2>
        <div className={styles.filters}>
          <div className={styles.searchBar}>
            <FaSearch />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading...</div>
      ) : (
        <div className={styles.eventsGrid}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div key={event.id} className={styles.eventCard}>
                <div className={styles.eventImage}>
                  <img
                    src={event.cover_image || "/default-event.jpg"}
                    alt={event.event_name}
                  />
                  <span
                    className={`${styles.statusBadge} ${styles[event.status]}`}
                  >
                    {event.status}
                  </span>
                </div>
                <div className={styles.eventContent}>
                  <h3>{event.event_name}</h3>
                  <div className={styles.eventDetails}>
                    <span>
                      <FaCalendarAlt />
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                    <span>Coordinator: {event.coordinator_name}</span>
                  </div>
                  <div className={styles.actions}>
                    <button
                      onClick={() => handleStatusUpdate(event.id, "approved")}
                      className={`${styles.actionButton} ${styles.approveButton}`}
                    >
                      <FaCheck />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(event.id, "cancelled")}
                      className={`${styles.actionButton} ${styles.cancelButton}`}
                    >
                      <FaTimes />
                    </button>
                    <button className={styles.actionButton}>
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noData}>No events found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsManagement;
