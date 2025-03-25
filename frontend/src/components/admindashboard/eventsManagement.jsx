import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus,
  FaEye,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCalendarCheck
} from "react-icons/fa";
import api from "../../utils/api";
import { ACCESS_TOKEN } from "../../utils/constants";
import styles from "../../assets/css/adminDashboard.module.css";
import { normalizeEventData, formatDate } from "../../utils/dataFormatters";

const EventsManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    event_name: "",
    description: "",
    event_date: "",
    location: "",
    event_type: "conference",
    capacity: "",
    price: "",
    status: "upcoming"
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the correct endpoint matching your backend URL structure
      const response = await api.get("/events/events/");
      
      if (response.data) {
        // Assume response is either array of events or has a results property
        const eventsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || []);
        
        if (eventsData.length > 0) {
          const normalizedEvents = eventsData.map(normalizeEventData);
          setEvents(normalizedEvents);
          setError(null);
        } else {
          setEvents([]);
          setError("No events found");
        }
      } else {
        setEvents([]);
        setError("Empty response from backend");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(`Failed to load events: ${error.message || 'Unknown error'}`);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setFormData({
      event_name: "",
      description: "",
      event_date: "",
      location: "",
      event_type: "conference",
      capacity: "",
      price: "",
      status: "upcoming"
    });
    setIsModalOpen(true);
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    
    // Format date for datetime-local input
    let formattedDate = event.event_date;
    if (formattedDate) {
      try {
        const date = new Date(formattedDate);
        formattedDate = date.toISOString().slice(0, 16);
      } catch (e) {
        console.warn("Date formatting error:", e);
      }
    }
    
    setFormData({
      event_name: event.event_name || "",
      description: event.description || "",
      event_date: formattedDate || "",
      location: event.location || "",
      event_type: event.event_type || "conference",
      capacity: event.capacity || "",
      price: event.price || "",
      status: event.status || "upcoming"
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        event_name: formData.event_name,
        description: formData.description,
        event_time: formData.event_date, // Match Django model field
        location: formData.location,
        event_type: formData.event_type,
        status: formData.status,
        is_paid: parseFloat(formData.price) > 0,
        price: parseFloat(formData.price) || 0,
        capacity: parseInt(formData.capacity) || 0
      };

      if (selectedEvent) {
        await api.patch(`/events/events/${selectedEvent.id}/`, eventData);
        toast.success("Event updated successfully");
      } else {
        await api.post("/events/events/", eventData);
        toast.success("Event created successfully");
      }

      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.delete(`/events/events/${eventId}/`);
        toast.success("Event deleted successfully");
        fetchEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event");
      }
    }
  };

  const filteredEvents = events.filter(event => {
    return (
      event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className={styles.contentSection}>
      <h2>Event Management</h2>
      
      {/* Search and Add section */}
      <div className={styles.actionHeader}>
        <div className={styles.searchBar}>
          <FaSearch />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={handleAddEvent}
        >
          <FaPlus /> Add Event
        </button>
      </div>
      
      {/* Error message if any */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className={styles.loading}>Loading events...</div>
      ) : (
        <>
          {/* Events table */}
          {filteredEvents.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Event Name</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(event => (
                    <tr key={event.id}>
                      <td>{event.id}</td>
                      <td>{event.event_name}</td>
                      <td>
                        <span className={styles.tableIcon}>
                          <FaCalendarAlt />
                        </span>
                        {formatDate(event.event_date)}
                      </td>
                      <td>
                        <span className={styles.tableIcon}>
                          <FaMapMarkerAlt />
                        </span>
                        {event.location}
                      </td>
                      <td>{event.event_type}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[event.status]}`}>
                          {event.status}
                        </span>
                      </td>
                      <td>
                        {event.price > 0 ? `₹${event.price}` : "Free"}
                      </td>
                      <td className={styles.actionButtons}>
                        <button
                          className={styles.iconButton}
                          onClick={() => handleEdit(event)}
                          title="Edit Event"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className={`${styles.iconButton} ${styles.deleteButton}`}
                          onClick={() => handleDelete(event.id)}
                          title="Delete Event"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noData}>
              <FaCalendarCheck size={48} />
              <p>No events found</p>
              <button
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={handleAddEvent}
              >
                Add Your First Event
              </button>
            </div>
          )}
        </>
      )}

      {/* Event Form Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2>{selectedEvent ? "Edit Event" : "Add New Event"}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Event Name</label>
                <input
                  type="text"
                  name="event_name"
                  className={styles.formControl}
                  value={formData.event_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  name="description"
                  className={styles.formControl}
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Event Date</label>
                <input
                  type="datetime-local"
                  name="event_date"
                  className={styles.formControl}
                  value={formData.event_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Location</label>
                <input
                  type="text"
                  name="location"
                  className={styles.formControl}
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Event Type</label>
                  <select
                    name="event_type"
                    className={styles.formControl}
                    value={formData.event_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="conference">Conference</option>
                    <option value="seminar">Seminar</option>
                    <option value="workshop">Workshop</option>
                    <option value="networking">Networking</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select
                    name="status"
                    className={styles.formControl}
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    className={styles.formControl}
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    className={styles.formControl}
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.secondaryButton}`}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`${styles.button} ${styles.primaryButton}`}
                >
                  {selectedEvent ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsManagement;
