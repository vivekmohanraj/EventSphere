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
  FaCalendarCheck,
  FaFilter,
  FaSort,
  FaDownload,
  FaTag,
  FaMoneyBillWave,
  FaUsers,
  FaClock,
  FaTimes
} from "react-icons/fa";
import api from "../../utils/api";
import { ACCESS_TOKEN } from "../../utils/constants";
import styles from "../../assets/css/eventsManagement.module.css";
import { normalizeEventData, formatDate, formatCurrency } from "../../utils/dataFormatters";

const EventsManagement = () => {
  // Predefined event types that match the event creation component
  const PREDEFINED_EVENT_TYPES = [
    { value: "conference", label: "Conference" },
    { value: "workshop", label: "Workshop" },
    { value: "seminar", label: "Seminar" },
    { value: "concert", label: "Concert" },
    { value: "birthday", label: "Birthday Party" },
    { value: "wedding", label: "Wedding" },
    { value: "corporate", label: "Corporate Event" },
    { value: "other", label: "Other" }
  ];
  
  // Status options that match the backend model exactly
  const STATUS_OPTIONS = [
    { value: "upcoming", label: "Upcoming" },
    { value: "in_progress", label: "Ongoing" },
    { value: "canceled", label: "Canceled" }, // Note the spelling: "canceled" not "cancelled"
    { value: "postponed", label: "Postponed" },
    { value: "completed", label: "Completed" }
  ];

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formData, setFormData] = useState({
    event_name: "",
    description: "",
    event_date: "",
    location: "",
    event_type: "",
    custom_event_type: "",
    capacity: "",
    price: "",
    status: "upcoming"
  });
  const [showCustomType, setShowCustomType] = useState(false);

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
      event_type: PREDEFINED_EVENT_TYPES[0].value, // Default to first type (conference)
      custom_event_type: "",
      capacity: "",
      price: "",
      status: "upcoming"
    });
    setShowCustomType(false);
    setIsModalOpen(true);
  };

  const handleView = async (event) => {
    try {
      // Fetch complete event data directly from the backend
      const response = await api.get(`/events/events/${event.id}/`);
      const completeEvent = response.data;
      
      // Log the complete event data for debugging
      console.log("Backend event data:", completeEvent);
      
      setViewEvent(completeEvent);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to load event details");
    }
  };

  const handleEdit = async (event) => {
    try {
      // Fetch complete event data directly from the backend
      const response = await api.get(`/events/events/${event.id}/`);
      const completeEvent = response.data;
      
      // Log for debugging
      console.log("Backend event data for edit:", completeEvent);
      
      setSelectedEvent(completeEvent);
      
      // Format date for datetime-local input
      let formattedDate = '';
      if (completeEvent.event_time) {
        try {
          const date = new Date(completeEvent.event_time);
          formattedDate = date.toISOString().slice(0, 16);
        } catch (e) {
          console.warn("Date formatting error:", e);
        }
      }
      
      // Check if the event type is one of the predefined types
      const eventType = completeEvent.event_type || "";
      const isKnownType = PREDEFINED_EVENT_TYPES.some(type => type.value === eventType);
      
      // Set showCustomType if we need to use "other"
      const useCustomType = !isKnownType && eventType;
      setShowCustomType(useCustomType);
      
      setFormData({
        event_name: completeEvent.event_name || "",
        description: completeEvent.description || "",
        event_date: formattedDate,
        location: completeEvent.venue || "",
        event_type: isKnownType ? eventType : "other",
        custom_event_type: useCustomType ? eventType : "",
        capacity: completeEvent.max_participants || "",
        price: completeEvent.price || "",
        status: completeEvent.status || "upcoming"
      });
      
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to load event details");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Show custom type input when "other" is selected
    if (name === "event_type" && value === "other") {
      setShowCustomType(true);
    } else if (name === "event_type") {
      setShowCustomType(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use custom event type if "other" is selected
      const eventType = formData.event_type === "other" && formData.custom_event_type 
        ? formData.custom_event_type 
        : formData.event_type;
      
      // Debug to see what status is being submitted
      console.log("Original status value:", formData.status);
      
      // Check valid backend status values - the backend might use different terminology
      // Common mappings: "ongoing" → "in_progress" or "active"
      let statusForBackend = formData.status;
      
      // Fix for "cancelled" vs "canceled" status discrepancy
      if (formData.status === "cancelled") {
        statusForBackend = "canceled";
      }
      
      // Try alternative status mappings if backend doesn't accept "ongoing"
      // You may need to adjust this based on what your backend accepts
      if (formData.status === "ongoing") {
        // Try a more common Django status value for ongoing events
        statusForBackend = "in_progress"; 
        // If that fails, we'll try other options in future attempts
      }
      
      console.log("Status being sent to backend:", statusForBackend);
        
      const eventData = {
        event_name: formData.event_name,
        description: formData.description,
        event_time: formData.event_date, // Match Django model field
        venue: formData.location, // Map to the backend field name
        event_type: eventType, // Use determined event type
        status: statusForBackend,
        is_paid: parseFloat(formData.price) > 0,
        price: parseFloat(formData.price) || 0,
        max_participants: parseInt(formData.capacity) || 0 // Match Django model field
      };

      // Log the data being sent for debugging
      console.log("Sending event data to backend:", eventData);

      if (selectedEvent) {
        try {
          const response = await api.patch(`/events/events/${selectedEvent.id}/`, eventData);
          console.log("Update response:", response.data);
          toast.success("Event updated successfully");
        } catch (error) {
          console.error("Update error response:", error.response?.data);
          // Throw the error to be caught by the outer catch block
          throw error;
        }
      } else {
        await api.post("/events/events/", eventData);
        toast.success("Event created successfully");
      }

      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      const errorMessage = error.response?.data?.detail || 
                          (error.response?.data ? JSON.stringify(error.response.data) : error.message);
      toast.error(`Failed to save event: ${errorMessage}`);
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
    // Apply search filter
    const matchesSearch = 
      event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter, handling both "canceled" and "cancelled" variations
    // and matching "ongoing" display status with "in_progress" backend status
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "canceled" && (event.status === "canceled" || event.status === "cancelled")) ||
      (statusFilter === "in_progress" && (event.status === "in_progress" || event.status === "ongoing")) ||
      event.status === statusFilter;
    
    // Apply type filter
    const matchesType = typeFilter === "all" || event.event_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  // Get unique event types for filter dropdown
  const eventTypes = ["all", ...new Set(events.map(event => event.event_type))];

  return (
    <div className={styles.contentSection}>
      <div className={styles.pageHeader}>
        <h2>Event Management</h2>
        <button
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={handleAddEvent}
        >
          <FaPlus /> Add Event
        </button>
      </div>
      
      {/* Enhanced search and filter section */}
      <div className={styles.filterContainer}>
        <div className={styles.searchBar}>
          <FaSearch />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.filtersGroup}>
          <div className={styles.filterItem}>
            <FaFilter className={styles.filterIcon} />
            <select 
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterItem}>
            <FaTag className={styles.filterIcon} />
            <select 
              className={styles.filterSelect}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {eventTypes.filter(type => type !== "all").map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <button className={styles.exportButton}>
            <FaDownload /> Export
          </button>
        </div>
      </div>
      
      {/* Error message if any */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading events...</p>
        </div>
      ) : (
        <>
          {/* Events table with enhanced styling */}
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
                      <td title={event.event_name}>
                        <div className={styles.eventNameCell}>
                          {event.event_name}
                        </div>
                      </td>
                      <td>
                        <div className={styles.cellWithIcon}>
                          <span className={styles.tableIcon}>
                            <FaCalendarAlt />
                          </span>
                          <span>{formatDate(event.event_date)}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.cellWithIcon}>
                          <span className={styles.tableIcon}>
                            <FaMapMarkerAlt />
                          </span>
                          <span>{event.location}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.eventTypeCell}>
                          {event.event_type}
                        </div>
                      </td>
                      <td>
                        <div className={styles.statusBadgeContainer}>
                          <span className={`${styles.statusBadge} ${styles[event.status]}`}>
                            {event.status}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.priceCell}>
                          {event.price > 0 ? `₹${event.price}` : "Free"}
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={`${styles.iconButton} ${styles.viewButton}`}
                            onClick={() => handleView(event)}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            className={`${styles.iconButton} ${styles.editButton}`}
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noData}>
              <FaCalendarCheck size={48} />
              <p>No events found matching your criteria</p>
              <button
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={handleAddEvent}
              >
                Add Your First Event
              </button>
            </div>
          )}
          
          {/* Table footer with pagination */}
          {filteredEvents.length > 0 && (
            <div className={styles.tableFooter}>
              <div className={styles.resultsInfo}>
                Showing {filteredEvents.length} of {events.length} events
              </div>
              <div className={styles.pagination}>
                <button className={styles.pageButton} disabled={true}>Previous</button>
                <button className={`${styles.pageButton} ${styles.activePage}`}>1</button>
                <button className={styles.pageButton} disabled={true}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Event Form Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{selectedEvent ? "Edit Event" : "Add New Event"}</h2>
              <button 
                className={styles.closeModalButton}
                onClick={() => setIsModalOpen(false)}
                title="Close Modal"
              >
                <FaTimes />
              </button>
            </div>
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
                <label className={styles.formLabel}>Event Date & Time</label>
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
                    {PREDEFINED_EVENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                    {/* Add "other" option if not already included */}
                    {!PREDEFINED_EVENT_TYPES.some(type => type.value === "other") && (
                      <option value="other">Other</option>
                    )}
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
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {showCustomType && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Custom Event Type</label>
                  <input
                    type="text"
                    name="custom_event_type"
                    className={styles.formControl}
                    value={formData.custom_event_type}
                    onChange={handleInputChange}
                    placeholder="Enter custom event type"
                    required
                  />
                </div>
              )}
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
                  {selectedEvent ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event View Modal */}
      {isViewModalOpen && viewEvent && (
        <div className={styles.modalBackdrop}>
          <div className={`${styles.modal} ${styles.viewModal}`}>
            <div className={styles.modalHeader}>
              <h2>Event Details</h2>
              <button 
                className={styles.closeModalButton}
                onClick={() => setIsViewModalOpen(false)}
                title="Close Modal"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className={styles.eventDetailHeader}>
              <span className={`${styles.statusBadge} ${styles[viewEvent.status]}`}>
                {viewEvent.status}
              </span>
              <h3>{viewEvent.event_name}</h3>
            </div>
            
            <div className={styles.eventDetailsGrid}>
              <div className={styles.eventDetailItem}>
                <div className={styles.detailIcon}>
                  <FaCalendarAlt />
                </div>
                <div>
                  <h4>Date & Time</h4>
                  <p>{formatDate(viewEvent.event_time) || "Not scheduled"}</p>
                </div>
              </div>
              
              <div className={styles.eventDetailItem}>
                <div className={styles.detailIcon}>
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <h4>Location</h4>
                  <p>{viewEvent.venue || "TBA"}</p>
                </div>
              </div>
              
              <div className={styles.eventDetailItem}>
                <div className={styles.detailIcon}>
                  <FaTag />
                </div>
                <div>
                  <h4>Event Type</h4>
                  <p>{viewEvent.event_type || "Not specified"}</p>
                </div>
              </div>
              
              <div className={styles.eventDetailItem}>
                <div className={styles.detailIcon}>
                  <FaUsers />
                </div>
                <div>
                  <h4>Capacity</h4>
                  <p>{viewEvent.max_participants || "Unlimited"}</p>
                </div>
              </div>
              
              <div className={styles.eventDetailItem}>
                <div className={styles.detailIcon}>
                  <FaMoneyBillWave />
                </div>
                <div>
                  <h4>Price</h4>
                  <p>{viewEvent.is_paid ? formatCurrency(viewEvent.price) : "Free"}</p>
                </div>
              </div>
              
              <div className={styles.eventDetailItem}>
                <div className={styles.detailIcon}>
                  <FaClock />
                </div>
                <div>
                  <h4>Created</h4>
                  <p>{formatDate(viewEvent.created_at) || "Unknown"}</p>
                </div>
              </div>
            </div>
            
            <div className={styles.eventDescription}>
              <h4>Description</h4>
              <p>{viewEvent.description || "No description provided."}</p>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEdit(viewEvent);
                }}
              >
                <FaEdit /> Edit Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsManagement;
