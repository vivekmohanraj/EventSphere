import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSearch,
  FaPlus,
  FaEye,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import api from "../../utils/api";
import styles from "../../assets/css/adminDashboard.module.css";

const EventsManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const response = await api.get("events/");
      setEvents(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredEvents = events.filter((event) =>
    event.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      event_name: event.event_name || "",
      description: event.description || "",
      event_date: event.event_date || event.start_date || "",
      location: event.location || "",
      event_type: event.event_type || "conference",
      capacity: event.capacity || "",
      price: event.price || "",
      status: event.status || "upcoming"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.delete(`events/${eventId}/`);
        toast.success("Event deleted successfully");
        fetchEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event");
      }
    }
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
      if (selectedEvent) {
        await api.put(`events/${selectedEvent.id}/`, formData);
        toast.success("Event updated successfully");
      } else {
        await api.post("events/", formData);
        toast.success("Event created successfully");
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    }
  };

  const openAddEventModal = () => {
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

  return (
    <div className={styles.contentContainer}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Event Management</h2>
        <button 
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={openAddEventModal}
        >
          <FaPlus /> Add New Event
        </button>
      </div>

      <div className={styles.searchBar}>
        <FaSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search events..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {loading ? (
        <div className={styles.loader}>Loading events...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{event.event_name}</td>
                    <td>
                      <div className={styles.flexCenter}>
                        <FaCalendarAlt className={styles.iconSmall} />
                        {new Date(event.event_date || event.start_date || event.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className={styles.flexCenter}>
                        <FaMapMarkerAlt className={styles.iconSmall} />
                        {event.location || 'N/A'}
                      </div>
                    </td>
                    <td>{event.event_type || 'Other'}</td>
                    <td>
                      <span className={styles.statusIndicator + ' ' + 
                        (event.status === 'upcoming' 
                          ? styles.statusActive 
                          : event.status === 'completed' 
                            ? styles.statusComplete 
                            : event.status === 'cancelled' 
                              ? styles.statusRejected 
                              : '')
                      }>
                        {event.status || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.actionButton}
                          onClick={() => handleEdit(event)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDelete(event.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.noData}>
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>{selectedEvent ? "Edit Event" : "Add New Event"}</h3>
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
