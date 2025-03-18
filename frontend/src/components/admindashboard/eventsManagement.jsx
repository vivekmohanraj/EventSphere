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
} from "react-icons/fa";
import api from "../../utils/api";
import styles from "../../assets/css/Dashboard.module.css";

const EventsManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
    category: "",
    price: "",
    max_attendees: "",
    is_approved: false,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Try multiple endpoints that could exist
      try {
        const response = await api.get("events/all/");
        setEvents(response.data);
      } catch (firstError) {
        console.warn("Could not fetch from events/all/, trying events/events/");
        try {
          const fallbackResponse = await api.get("events/events/");
          setEvents(Array.isArray(fallbackResponse.data) ? fallbackResponse.data : []);
        } catch (secondError) {
          console.warn("Could not fetch from events/events/, trying events/");
          const lastFallbackResponse = await api.get("events/");
          setEvents(Array.isArray(lastFallbackResponse.data) ? lastFallbackResponse.data : []);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch events");
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "approved") return matchesSearch && event.is_approved;
    if (statusFilter === "pending") return matchesSearch && !event.is_approved;
    
    return matchesSearch;
  });

  const handleAddNew = () => {
    setSelectedEvent(null);
    setFormData({
      title: "",
      description: "",
      location: "",
      start_date: "",
      end_date: "",
      category: "",
      price: "",
      max_attendees: "",
      is_approved: false,
    });
    setShowModal(true);
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      start_date: event.start_date.split("T")[0],
      end_date: event.end_date.split("T")[0],
      category: event.category,
      price: event.price,
      max_attendees: event.max_attendees,
      is_approved: event.is_approved,
    });
    setShowModal(true);
  };

  const handleView = (event) => {
    setViewDetails(event);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.delete(`events/${eventId}/`);
        toast.success("Event deleted successfully");
        fetchEvents();
      } catch (error) {
        toast.error("Failed to delete event");
        console.error("Error deleting event:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...formData,
        price: parseFloat(formData.price),
        max_attendees: parseInt(formData.max_attendees, 10),
      };

      if (selectedEvent) {
        // Edit existing event
        await api.put(`events/${selectedEvent.id}/`, eventData);
        toast.success("Event updated successfully");
      } else {
        // Add new event
        await api.post("events/create/", eventData);
        toast.success("Event created successfully");
      }
      setShowModal(false);
      fetchEvents();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to process event data"
      );
      console.error("Error saving event:", error);
    }
  };

  const handleApproveEvent = async (eventId, approve) => {
    try {
      // Try multiple endpoints that could exist
      try {
        await api.patch(`events/${eventId}/approve/`, { is_approved: approve });
      } catch (firstError) {
        if (firstError.response && firstError.response.status === 404) {
          console.warn(`Could not patch events/${eventId}/approve/, trying events/${eventId}/status/`);
          await api.patch(`events/${eventId}/status/`, { 
            status: approve ? "approved" : "rejected" 
          });
        } else {
          throw firstError;
        }
      }
      toast.success(approve ? "Event approved" : "Event rejected");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to update event status");
      console.error("Error updating event status:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={styles.eventsManagement}>
      <div className={styles.toolbarContainer}>
        <div className={styles.filters}>
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search events..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className={styles.statusFilter}
          >
            <option value="all">All Events</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <button className={styles.addButton} onClick={handleAddNew}>
          <FaPlus /> Add New Event
        </button>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading events...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{event.title}</td>
                    <td>{formatDate(event.start_date)}</td>
                    <td>{event.location}</td>
                    <td>₹{event.price.toFixed(2)}</td>
                    <td>
                      <span
                        className={`${styles.statusChip} ${
                          event.is_approved ? styles.approved : styles.pending
                        }`}
                      >
                        {event.is_approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          onClick={() => handleView(event)}
                        >
                          <FaEye />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.editButton}`}
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
                        {!event.is_approved && (
                          <button
                            className={`${styles.actionButton} ${styles.approveButton}`}
                            onClick={() => handleApproveEvent(event.id, true)}
                          >
                            <FaCheck />
                          </button>
                        )}
                        {event.is_approved && (
                          <button
                            className={`${styles.actionButton} ${styles.rejectButton}`}
                            onClick={() => handleApproveEvent(event.id, false)}
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2>{selectedEvent ? "Edit Event" : "Add New Event"}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Meetup">Meetup</option>
                    <option value="Concert">Concert</option>
                    <option value="Exhibition">Exhibition</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Maximum Attendees</label>
                  <input
                    type="number"
                    name="max_attendees"
                    value={formData.max_attendees}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="is_approved"
                      checked={formData.is_approved}
                      onChange={handleInputChange}
                    />
                    <span>Approve Event</span>
                  </label>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  {selectedEvent ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewDetails && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2>{viewDetails.title}</h2>
            <div className={styles.eventDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Description:</span>
                <span className={styles.detailValue}>{viewDetails.description}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Date:</span>
                <span className={styles.detailValue}>
                  {formatDate(viewDetails.start_date)} - {formatDate(viewDetails.end_date)}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Location:</span>
                <span className={styles.detailValue}>{viewDetails.location}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Category:</span>
                <span className={styles.detailValue}>{viewDetails.category}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Price:</span>
                <span className={styles.detailValue}>₹{viewDetails.price.toFixed(2)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Max Attendees:</span>
                <span className={styles.detailValue}>{viewDetails.max_attendees}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={`${styles.statusChip} ${
                  viewDetails.is_approved ? styles.approved : styles.pending
                }`}>
                  {viewDetails.is_approved ? "Approved" : "Pending"}
                </span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setViewDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsManagement;
