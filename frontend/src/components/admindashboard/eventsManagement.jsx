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
import { createClient } from '@renderize/lib';
import api from "../../utils/api";
import { ACCESS_TOKEN } from "../../utils/constants";
import styles from "../../assets/css/eventsManagement.module.css";
import { normalizeEventData, formatCurrency } from "../../utils/dataFormatters";
import { Badge, Spinner } from "react-bootstrap";

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
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [formData, setFormData] = useState({
    event_name: "",
    description: "",
    event_date: "",
    event_time: "",
    venue: "",
    event_type: "",
    custom_event_type: "",
    capacity: "",
    price: "",
    is_paid: false,
    rsvp_required: false,
    limited_capacity: false,
    audience: "",
    tags: [],
    organizer_info: "",
    organizer_website: "",
    organizer_email: "",
    organizer_phone: "",
    organizer_social: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: ""
    },
    status: "upcoming"
  });
  const [showCustomType, setShowCustomType] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [eventStats, setEventStats] = useState({
    totalRegistered: 0,
    totalAttended: 0,
    registrationRate: 0,
    revenue: 0
  });
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchVenues();
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

  const fetchVenues = async () => {
    try {
      setLoadingVenues(true);
      const response = await api.get('/events/venues/');
      
      if (response.data && Array.isArray(response.data)) {
        setVenues(response.data);
      } else {
        // Fallback data matching eventCreation.jsx if API fails
        setVenues([
          {
            id: 1,
            name: 'Corporate Executive Center',
            address: '123 Business Park, Financial District',
            capacity: 300,
            price_per_hour: 5000,
            description: 'Professional venue with advanced presentation technology.',
            image_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205',
            features: ['Conference Tables', 'Stage', 'Projectors', 'Wi-Fi']
          },
          {
            id: 2,
            name: 'Workshop Studio',
            address: '456 Creative Lane, Arts District',
            capacity: 50,
            price_per_hour: 2500,
            description: 'Flexible space designed for interactive workshops.',
            image_url: 'https://images.stockcake.com/public/b/5/f/b5fd8cec-afa5-4237-b1e7-f9569d27e14c',
            features: ['Workstations', 'Whiteboards', 'Natural Lighting']
          },
          {
            id: 3,
            name: 'Grand Ballroom',
            address: '789 Celebration Avenue, City Center',
            capacity: 400,
            price_per_hour: 7500,
            description: 'Elegant ballroom with crystal chandeliers.',
            image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3',
            features: ['Dance Floor', 'Stage', 'Professional Lighting']
          },
          {
            id: 4,
            name: 'Rooftop Concert Space',
            address: '101 Skyline Drive, Entertainment District',
            capacity: 200,
            price_per_hour: 6000,
            description: 'Urban rooftop venue with panoramic city views.',
            image_url: 'https://images.stockcake.com/public/0/3/0/030a274e-47e8-487e-9129-544289c369a3',
            features: ['Sound System', 'Lighting', 'Bar Service']
          },
          {
            id: 5,
            name: 'Kids Party Palace',
            address: '222 Fun Street, Family Zone',
            capacity: 80,
            price_per_hour: 3000,
            description: 'Colorful space for children\'s parties.',
            image_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d',
            features: ['Play Area', 'Theme Decorations', 'Party Rooms']
          },
          {
            id: 6,
            name: 'Garden Terrace',
            address: '333 Park Lane, Green Hills',
            capacity: 150,
            price_per_hour: 4000,
            description: 'Beautiful outdoor venue with lush gardens.',
            image_url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3',
            features: ['Outdoor Space', 'Garden Lighting', 'Scenic Photo Spots']
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      // Use the same fallback data as above
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setFormData({
      event_name: "",
      description: "",
      event_date: "",
      event_time: "",
      venue: "",
      event_type: PREDEFINED_EVENT_TYPES[0].value,
      custom_event_type: "",
      capacity: "",
      price: "",
      is_paid: false,
      rsvp_required: false,
      limited_capacity: false,
      audience: "",
      tags: [],
      organizer_info: "",
      organizer_website: "",
      organizer_email: "",
      organizer_phone: "",
      organizer_social: {
        facebook: "",
        twitter: "",
        instagram: "",
        linkedin: ""
      },
      status: "upcoming"
    });
    
    // Reset custom type and load venues if needed
    setShowCustomType(false);
    if (venues.length === 0) {
      fetchVenues();
    }
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
      
      // Fetch participant data for this event
      await fetchParticipants(event.id);
      
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
        event_time: completeEvent.event_time ? completeEvent.event_time.split('T')[1] : '',
        venue: completeEvent.venue || "",
        event_type: isKnownType ? eventType : "other",
        custom_event_type: useCustomType ? eventType : "",
        capacity: completeEvent.max_participants || "",
        price: completeEvent.price || "",
        is_paid: completeEvent.is_paid,
        rsvp_required: completeEvent.rsvp_required,
        limited_capacity: completeEvent.max_participants > 0,
        audience: completeEvent.audience || "",
        tags: completeEvent.tags || [],
        organizer_info: completeEvent.organizer_info || "",
        organizer_website: completeEvent.organizer_website || "",
        organizer_email: completeEvent.organizer_email || "",
        organizer_phone: completeEvent.organizer_phone || "",
        organizer_social: completeEvent.organizer_social || {
          facebook: "",
          twitter: "",
          instagram: "",
          linkedin: ""
        },
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
      
      // Combine date and time if separate fields
      let eventDateTime = formData.event_date;
      if (typeof formData.event_date === 'string' && formData.event_time) {
        // If date and time are separate, combine them
        const datePart = formData.event_date.split('T')[0];
        eventDateTime = `${datePart}T${formData.event_time}`;
      }
      
      // Fix for backend status values
      let statusForBackend = formData.status;
      if (formData.status === "cancelled") {
        statusForBackend = "canceled";
      }
        
      const eventData = {
        event_name: formData.event_name,
        description: formData.description,
        event_time: eventDateTime, 
        venue: formData.venue,
        venue_id: formData.venue_id,
        event_type: eventType,
        tags: formData.tags || [],
        status: statusForBackend,
        is_paid: formData.is_paid,
        price: formData.is_paid ? parseFloat(formData.price) || 0 : 0,
        max_participants: formData.limited_capacity ? parseInt(formData.capacity) || 0 : null,
        rsvp_required: formData.rsvp_required,
        audience: formData.audience || "",
        organizer_info: formData.organizer_info || "",
        organizer_website: formData.organizer_website || "",
        organizer_email: formData.organizer_email || "",
        organizer_phone: formData.organizer_phone || "",
        organizer_social: formData.organizer_social || {
          facebook: "",
          twitter: "",
          instagram: "",
          linkedin: ""
        }
      };

      console.log("Sending event data to backend:", eventData);

      if (selectedEvent) {
        try {
          const response = await api.patch(`/events/events/${selectedEvent.id}/`, eventData);
          console.log("Update response:", response.data);
          toast.success("Event updated successfully");
        } catch (error) {
          console.error("Update error response:", error.response?.data);
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

  // Function to export events as PDF
  const exportEventsPdf = async () => {
    try {
      setLoadingPdf(true);
      const apiKey = import.meta.env.VITE_RENDERIZE_API_KEY;
      
      if (!apiKey) {
        throw new Error("Renderize API key is missing. Please check your environment variables.");
      }
      
      const client = createClient({ 
        apiKey,
        baseApiUrl: '/renderize-api' // Use the proxy defined in vite.config.js
      });
      
      // Create HTML content for the PDF with professional styling
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
              
              body { 
                font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif; 
                margin: 40px; 
                color: #333;
                line-height: 1.6;
              }
              
              h1 { 
                color: #ff4a17; 
                text-align: center; 
                margin-bottom: 10px;
                font-size: 28px;
                font-weight: 700;
              }
              
              .company-name {
                text-align: center;
                font-size: 16px;
                color: #555;
                margin-bottom: 30px;
                font-weight: 500;
              }
              
              .report-info {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 1px dashed #ddd;
              }
              
              .filters-info {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #ff4a17;
                margin-bottom: 30px;
                font-size: 14px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              }
              
              .filters-info strong {
                color: #444;
              }
              
              .filter-label {
                display: inline-block;
                margin-right: 15px;
                color: #666;
              }
              
              .filter-value {
                font-weight: 500;
                color: #333;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-size: 12px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.05);
                border-radius: 8px;
                overflow: hidden;
              }
              
              th {
                background-color: #ff4a17;
                color: white;
                text-align: left;
                padding: 14px 10px;
                font-weight: 500;
                letter-spacing: 0.5px;
                font-size: 13px;
              }
              
              td {
                padding: 12px 10px;
                border-bottom: 1px solid #eee;
              }
              
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              
              tr:hover {
                background-color: #f5f5f5;
              }
              
              tr:last-child td {
                border-bottom: none;
              }
              
              .status-badge {
                padding: 5px 10px;
                border-radius: 20px;
                font-size: 11px;
                display: inline-block;
                text-transform: capitalize;
                font-weight: 500;
              }
              
              .upcoming { 
                background-color: #e3f2fd; 
                color: #0d47a1; 
                border: 1px solid #bbdefb;
              }
              
              .completed { 
                background-color: #e8f5e9; 
                color: #1b5e20; 
                border: 1px solid #c8e6c9;
              }
              
              .canceled, .cancelled { 
                background-color: #ffebee; 
                color: #b71c1c; 
                border: 1px solid #ffcdd2;
              }
              
              .in_progress, .ongoing { 
                background-color: #fff8e1; 
                color: #f57f17; 
                border: 1px solid #ffecb3;
              }
              
              .postponed { 
                background-color: #f3e5f5; 
                color: #7b1fa2; 
                border: 1px solid #e1bee7;
              }
              
              .price-free {
                color: #4caf50;
                font-weight: 500;
              }
              
              .price-paid {
                color: #ff4a17;
                font-weight: 500;
              }
              
              .footer {
                margin-top: 40px;
                text-align: center;
                color: #666;
                font-size: 12px;
                border-top: 1px solid #eee;
                padding-top: 20px;
              }
              
              .footer-logo {
                font-size: 16px;
                font-weight: 700;
                color: #ff4a17;
                margin-bottom: 5px;
              }
              
              .page-number {
                position: absolute;
                bottom: 20px;
                right: 20px;
                font-size: 10px;
                color: #999;
              }
              
              .event-name {
                font-weight: 500;
                color: #333;
              }
            </style>
          </head>
          <body>
            <h1>Events Report</h1>
            <div class="company-name">EventSphere Management Platform</div>
            
            <div class="report-info">
              <p>Generated on ${new Date().toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})} 
              at ${new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</p>
            </div>
            
            <div class="filters-info">
              <strong>Filters Applied:</strong><br>
              <span class="filter-label">Status:</span> <span class="filter-value">${statusFilter === "all" ? "All" : statusFilter}</span>
              <span class="filter-label">Type:</span> <span class="filter-value">${typeFilter === "all" ? "All" : typeFilter}</span>
              <span class="filter-label">Search Term:</span> <span class="filter-value">${searchTerm ? `"${searchTerm}"` : "None"}</span>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Capacity</th>
                </tr>
              </thead>
              <tbody>
                ${filteredEvents.map(event => `
                  <tr>
                    <td><span class="event-name">${event.event_name}</span></td>
                    <td>${formatDate(event.event_date)}</td>
                    <td>${event.location}</td>
                    <td>${event.event_type}</td>
                    <td>
                      <span class="status-badge ${event.status}">
                        ${event.status}
                      </span>
                    </td>
                    <td>${event.price > 0 ? `<span class="price-paid">₹${event.price}</span>` : '<span class="price-free">Free</span>'}</td>
                    <td>${event.capacity || 'Unlimited'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <div class="footer-logo">EventSphere</div>
              <p>This report was generated from EventSphere Admin Dashboard</p>
              <p>Showing ${filteredEvents.length} of ${events.length} total events</p>
            </div>
            
            <div class="page-number">Page 1</div>
          </body>
        </html>
      `;
      
      // Generate PDF
      try {
        const pdf = await client.renderPdf({ 
          html, 
          format: 'a4',
          margin: { top: 20, bottom: 20, left: 20, right: 20 }
        });
        
        // Create a blob and download
        const blob = new Blob([pdf], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EventSphere_Events_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success("Events PDF has been generated");
      } catch (renderError) {
        console.error("PDF rendering error:", renderError);
        toast.error(`PDF generation failed: ${renderError.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error generating events PDF:", error);
      toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    } finally {
      setLoadingPdf(false);
    }
  };

  // Fetch participants for an event
  const fetchParticipants = async (eventId) => {
    setLoadingParticipants(true);
    try {
      const response = await api.get(`/events/participants/?event=${eventId}`);
      console.log("Raw participants data:", response.data);
      
      // Map and normalize the participant data
      const normalizedParticipants = response.data.map(participant => {
        // Check if user exists and normalize user data
        const userData = participant.user || {};
        
        // Create a normalized participant object with defaults for missing data
        return {
          ...participant,
          id: participant.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
          event: participant.event || eventId,
          status: participant.status || "Registered",
          attended: !!participant.attended,
          // Use a safe date that's definitely in the past if missing or invalid
          registered_at: isValidDate(participant.registered_at) ? participant.registered_at : 
                        (isValidDate(participant.created_at) ? participant.created_at : new Date(Date.now() - 86400000).toISOString()),
          user: {
            id: userData.id || 0,
            first_name: userData.first_name || "Guest",
            last_name: userData.last_name || "User",
            email: userData.email || "guest@example.com",
            phone_number: userData.phone_number || "Not provided"
          }
        };
      });
      
      console.log("Normalized participants:", normalizedParticipants);
      setParticipants(normalizedParticipants);
      
      // Calculate statistics based on normalized data
      calculateEventStatistics(normalizedParticipants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants");
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };
  
  // Helper function to validate dates
  const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    // Check if date is valid and not in the future
    return !isNaN(date.getTime()) && date <= now;
  };

  // Calculate and set event statistics based on participant data
  const calculateEventStatistics = (participantData) => {
    const registered = participantData.length;
    const attended = participantData.filter(p => p.attended).length;
    // Use current event data for max_participants if available
    const maxParticipants = selectedEvent?.max_participants || 0;
    const registrationRate = maxParticipants > 0 
      ? Math.round((registered / maxParticipants) * 100) 
      : 0;
    
    // Calculate revenue based on price and payment status
    let revenue = 0;
    if (selectedEvent?.is_paid && selectedEvent?.price) {
      // In a production environment, we'd calculate this from actual payments
      // Here we're estimating based on registrations
      revenue = attended * selectedEvent.price;
    }
    
    // Update the event statistics state
    setEventStats({
      totalRegistered: registered,
      totalAttended: attended,
      registrationRate: registrationRate,
      revenue: revenue
    });
  };

  // Update the toggle attendance function
  const toggleAttendance = async (participantId) => {
    setAttendanceLoading(true);
    
    try {
      // Find the participant in our state
      const participant = participants.find(p => p.id === participantId);
      if (!participant) {
        throw new Error('Participant not found');
      }
      
      // Toggle the attended status (opposite of current)
      const newAttendedStatus = !participant.attended;
      
      // Call API to update attendance
      const response = await api.patch(`/events/participants/${participantId}/`, {
        attended: newAttendedStatus
      });
      
      if (response.status === 200) {
        // Update local state with the response data (or toggle current state if response is not as expected)
        const updatedParticipants = participants.map(p => {
          if (p.id === participantId) {
            return {
              ...p,
              attended: response.data?.attended ?? newAttendedStatus,
              status: response.data?.attended ? 'Attended' : 'Registered'
            };
          }
          return p;
        });
        
        // Update state
        setParticipants(updatedParticipants);
        
        // Recalculate statistics
        calculateEventStatistics(updatedParticipants);
        
        // Show success message
        toast.success(`Attendance ${newAttendedStatus ? 'confirmed' : 'removed'} for participant`);
      } else {
        throw new Error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
      toast.error('Failed to update attendance status');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Update to handle venue selection
  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    setFormData(prev => ({
      ...prev,
      venue: venue.name,
      venue_id: venue.id
    }));
  };

  // Format date for display with more robust handling
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Ensure we're working with a string
      const dateStr = String(dateString);
      
      // Try to parse the date
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date format received: ${dateStr}`);
        return 'N/A';
      }
      
      // Check if it's a future date (likely invalid)
      const now = new Date();
      if (date > now) {
        console.warn(`Future date detected, may be incorrect: ${dateStr}`);
        // Return current date instead of future date
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(now);
      }
      
      // Format the date using toLocaleDateString for better localization
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
      
    } catch (error) {
      console.error("Date formatting error:", error);
      return 'N/A';
    }
  };

  // Add this function after formatDate
  const createSampleParticipants = (eventId, count = 1) => {
    // Create sample participant data
    return Array(count).fill(0).map((_, index) => {
      const isAttended = Math.random() > 0.5;
      const registrationDate = new Date();
      registrationDate.setDate(registrationDate.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days
      
      return {
        id: `sample-${index}`,
        event: eventId,
        status: isAttended ? 'attended' : 'registered',
        attended: isAttended,
        registered_at: registrationDate.toISOString(),
        created_at: registrationDate.toISOString(),
        user: {
          id: `sample-user-${index}`,
          first_name: `Sample`,
          last_name: `User ${index + 1}`,
          email: `sample${index + 1}@example.com`,
          phone: `+1234567890${index}`
        }
      };
    });
  };

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
          
          <button 
            className={styles.exportButton}
            onClick={exportEventsPdf}
            disabled={loadingPdf}
          >
            <FaDownload /> {loadingPdf ? 'Generating...' : 'Export'}
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
        <div className={styles.modalBackdrop} style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px'
        }}>
          <div className={styles.modal} style={{ 
            maxWidth: '850px', 
            width: '95%', 
            maxHeight: '90vh', 
            overflowY: 'auto',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            padding: '0',
            backgroundColor: '#fff',
            transition: 'all 0.3s ease',
            position: 'relative',
            margin: '0 auto'
          }}>
            <div className={styles.modalHeader} style={{
              borderTopLeftRadius: '10px',
              borderTopRightRadius: '10px',
              background: 'linear-gradient(135deg, #6c5ce7, #8e44ad)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
              borderBottom: 'none',
              boxShadow: '0 2px 10px rgba(108, 92, 231, 0.2)'
            }}>
              <h2 style={{ margin: 0, fontWeight: '600', fontSize: '1.5rem' }}>
                {selectedEvent ? "Edit Event" : "Add New Event"}
              </h2>
              <button 
                className={styles.closeModalButton}
                onClick={() => setIsModalOpen(false)}
                title="Close Modal"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  padding: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
              {/* Basic Information Section */}
              <div className={styles.formSection} style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 className={styles.sectionTitle} style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#6c5ce7',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e5e5'
                }}>Basic Information</h3>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{
                    fontWeight: '500',
                    marginBottom: '6px',
                    display: 'block',
                    color: '#444'
                  }}>Event Name</label>
                  <input
                    type="text"
                    name="event_name"
                    className={styles.formControl}
                    value={formData.event_name}
                    onChange={handleInputChange}
                    required
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      width: '100%',
                      transition: 'border 0.2s ease',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div className={styles.formRow} style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{
                      fontWeight: '500',
                      marginBottom: '6px',
                      display: 'block',
                      color: '#444'
                    }}>Event Type</label>
                    <select
                      name="event_type"
                      className={styles.formControl}
                      value={formData.event_type}
                      onChange={handleInputChange}
                      required
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        width: '100%',
                        transition: 'border 0.2s ease',
                        backgroundColor: '#fff',
                        fontSize: '1rem',
                        appearance: 'none'
                      }}
                    >
                      {PREDEFINED_EVENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                      {!PREDEFINED_EVENT_TYPES.some(type => type.value === "other") && (
                        <option value="other">Other</option>
                      )}
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{
                      fontWeight: '500',
                      marginBottom: '6px',
                      display: 'block',
                      color: '#444'
                    }}>Status</label>
                    <select
                      name="status"
                      className={styles.formControl}
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        width: '100%',
                        transition: 'border 0.2s ease',
                        backgroundColor: '#fff',
                        fontSize: '1rem',
                        appearance: 'none'
                      }}
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
                    <label className={styles.formLabel} style={{
                      fontWeight: '500',
                      marginBottom: '6px',
                      display: 'block',
                      color: '#444'
                    }}>Custom Event Type</label>
                    <input
                      type="text"
                      name="custom_event_type"
                      className={styles.formControl}
                      value={formData.custom_event_type}
                      onChange={handleInputChange}
                      placeholder="Enter custom event type"
                      required
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        width: '100%',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                )}
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{
                    fontWeight: '500',
                    marginBottom: '6px',
                    display: 'block',
                    color: '#444'
                  }}>Description</label>
                  <textarea
                    name="description"
                    className={styles.formControl}
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      width: '100%',
                      resize: 'vertical',
                      fontSize: '1rem',
                      minHeight: '80px'
                    }}
                  />
                </div>
              </div>
              
              {/* Date and Time Section */}
              <div className={styles.formSection} style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 className={styles.sectionTitle} style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#6c5ce7',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e5e5'
                }}>Date and Time</h3>
                
                <div className={styles.formRow} style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{
                      fontWeight: '500',
                      marginBottom: '6px',
                      display: 'block',
                      color: '#444'
                    }}>Event Date</label>
                    <input
                      type="date"
                      name="event_date"
                      className={styles.formControl}
                      value={formData.event_date ? formData.event_date.split('T')[0] : ''}
                      onChange={handleInputChange}
                      required
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        width: '100%',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{
                      fontWeight: '500',
                      marginBottom: '6px',
                      display: 'block',
                      color: '#444'
                    }}>Event Time</label>
                    <input
                      type="time"
                      name="event_time"
                      className={styles.formControl}
                      value={formData.event_time}
                      onChange={handleInputChange}
                      required
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        width: '100%',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Options Section */}
              <div className={styles.formSection} style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 className={styles.sectionTitle} style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#6c5ce7',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e5e5'
                }}>Registration Options</h3>
                
                <div className={styles.optionsGroup} style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div className={styles.option} style={{
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <label className={styles.checkboxLabel} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      marginRight: '16px'
                    }}>
                      <input 
                        type="checkbox" 
                        name="is_paid"
                        checked={formData.is_paid}
                        onChange={(e) => setFormData({...formData, is_paid: e.target.checked})}
                        style={{
                          marginRight: '8px',
                          width: '18px',
                          height: '18px',
                          accentColor: '#6c5ce7'
                        }}
                      />
                      <span>Paid Event</span>
                    </label>
                  </div>
                  
                  <div className={styles.option} style={{
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <label className={styles.checkboxLabel} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      marginRight: '16px'
                    }}>
                      <input 
                        type="checkbox" 
                        name="rsvp_required"
                        checked={formData.rsvp_required}
                        onChange={(e) => setFormData({...formData, rsvp_required: e.target.checked})}
                        style={{
                          marginRight: '8px',
                          width: '18px',
                          height: '18px',
                          accentColor: '#6c5ce7'
                        }}
                      />
                      <span>Require RSVP</span>
                    </label>
                  </div>
                  
                  <div className={styles.option} style={{
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <label className={styles.checkboxLabel} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="checkbox" 
                        name="limited_capacity"
                        checked={formData.limited_capacity}
                        onChange={(e) => setFormData({...formData, limited_capacity: e.target.checked})}
                        style={{
                          marginRight: '8px',
                          width: '18px',
                          height: '18px',
                          accentColor: '#6c5ce7'
                        }}
                      />
                      <span>Limit Capacity</span>
                    </label>
                  </div>
                </div>
                
                <div className={styles.formRow} style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {formData.is_paid && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{
                        fontWeight: '500',
                        marginBottom: '6px',
                        display: 'block',
                        color: '#444'
                      }}>Price (₹)</label>
                      <input
                        type="number"
                        name="price"
                        className={styles.formControl}
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required={formData.is_paid}
                        style={{
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          width: '100%',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                  )}
                  
                  {formData.limited_capacity && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{
                        fontWeight: '500',
                        marginBottom: '6px',
                        display: 'block',
                        color: '#444'
                      }}>Maximum Attendees</label>
                      <input
                        type="number"
                        name="capacity"
                        className={styles.formControl}
                        value={formData.capacity}
                        onChange={handleInputChange}
                        min="1"
                        required={formData.limited_capacity}
                        style={{
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          width: '100%',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Venue Section */}
              <div className={styles.formSection} style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 className={styles.sectionTitle} style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#6c5ce7',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e5e5'
                }}>Venue</h3>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{
                    fontWeight: '500',
                    marginBottom: '6px',
                    display: 'block',
                    color: '#444'
                  }}>{selectedVenue ? 'Selected Venue' : 'Location/Venue'}</label>
                  <input
                    type="text"
                    name="venue"
                    className={styles.formControl}
                    value={formData.venue}
                    onChange={handleInputChange}
                    placeholder="Enter venue or location"
                    required
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      width: '100%',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                {venues.length > 0 && (
                  <div className={styles.venuesSection} style={{ marginTop: '16px' }}>
                    <label className={styles.formLabel} style={{
                      fontWeight: '500',
                      marginBottom: '12px',
                      display: 'block',
                      color: '#444'
                    }}>Select from available venues:</label>
                    
                    <div className={styles.venuesGrid} style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                      gap: '16px',
                      marginTop: '8px'
                    }}>
                      {venues.slice(0, 6).map(venue => (
                        <div 
                          key={venue.id}
                          className={styles.venueCard}
                          style={{
                            border: selectedVenue?.id === venue.id ? '2px solid #6c5ce7' : '1px solid #ddd',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: selectedVenue?.id === venue.id ? '#f0f0ff' : '#fff',
                            boxShadow: selectedVenue?.id === venue.id ? '0 2px 8px rgba(108, 92, 231, 0.2)' : 'none'
                          }}
                          onClick={() => handleVenueSelect(venue)}
                        >
                          <div style={{
                            height: '90px',
                            backgroundImage: `url(${venue.image_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }} />
                          <div style={{ padding: '10px' }}>
                            <h5 style={{ fontSize: '0.9rem', margin: '0 0 4px 0', fontWeight: '600', color: selectedVenue?.id === venue.id ? '#6c5ce7' : '#333' }}>{venue.name}</h5>
                            <p style={{ fontSize: '0.8rem', margin: '0', color: '#666' }}>
                              Capacity: {venue.capacity}<br />
                              ₹{venue.price_per_hour}/hr
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {venues.length > 6 && (
                        <div className={styles.moreVenuesLink} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px dashed #ccc',
                          borderRadius: '8px',
                          padding: '10px',
                          fontSize: '0.9rem',
                          color: '#6c5ce7',
                          cursor: 'pointer',
                          height: '100%'
                        }}>
                          +{venues.length - 6} more venues
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className={styles.modalFooter} style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '32px',
                padding: '16px 0 8px 0',
                borderTop: '1px solid #eee',
              }}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    background: 'white',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.primaryButton}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6c5ce7, #8e44ad)',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(108, 92, 231, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {selectedEvent ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event View Modal */}
      {isViewModalOpen && viewEvent && (
        <div className={styles.modalBackdrop}>
          <div className={`${styles.modal} ${styles.viewModal}`} style={{ maxWidth: '800px', width: '90%' }}>
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

            {/* Event Statistics Section */}
            <div className={styles.eventStatsSection}>
              <h4>Event Statistics</h4>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <h5>Registrations</h5>
                  <p>{eventStats.totalRegistered} / {viewEvent.max_participants || "∞"}</p>
                </div>
                <div className={styles.statItem}>
                  <h5>Attendance</h5>
                  <p>{eventStats.totalAttended} ({eventStats.totalRegistered > 0 ? 
                    Math.round((eventStats.totalAttended/eventStats.totalRegistered)*100) : 0}%)</p>
                </div>
                <div className={styles.statItem}>
                  <h5>Capacity Filled</h5>
                  <p>{eventStats.registrationRate}%</p>
                </div>
                <div className={styles.statItem}>
                  <h5>Revenue</h5>
                  <p>{formatCurrency(eventStats.revenue)}</p>
                </div>
              </div>
            </div>
            
            {/* Participants Section */}
            <div className={styles.participantsSection}>
              <h4 className={styles.sectionTitle} style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#6c5ce7',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e5e5e5'
              }}>Participants</h4>
              
              {loadingParticipants ? (
                <div className={styles.loadingParticipants}>
                  <Spinner animation="border" variant="primary" />
                  <p className={styles.loadingText}>Loading participants...</p>
                </div>
              ) : participants.length === 0 ? (
                <div className={styles.noParticipants}>
                  <p>No participants registered for this event yet.</p>
                </div>
              ) : (
                <div className={styles.participantsGrid}>
                  <table className={styles.participantsTable} style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ 
                        backgroundColor: '#f8f9fa',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        <th style={{padding: '12px', textAlign: 'left'}}>Name</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Email</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Phone</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Registration Date</th>
                        <th style={{padding: '12px', textAlign: 'center'}}>Status</th>
                        <th style={{padding: '12px', textAlign: 'center'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant, index) => {
                        // Safely extract user data with fallbacks
                        const user = participant.user || {};
                        const firstName = user.first_name || 'Guest';
                        const lastName = user.last_name || '';
                        const fullName = `${firstName} ${lastName}`.trim() || 'Guest User';
                        const email = user.email || 'No email provided';
                        const phone = user.phone_number || 'No phone provided';
                        const isAttended = !!participant.attended;
                        
                        return (
                          <tr key={participant.id || index} style={{
                            borderBottom: '1px solid #dee2e6',
                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                          }}>
                            <td style={{padding: '10px', textAlign: 'left'}}>{fullName}</td>
                            <td style={{padding: '10px', textAlign: 'left'}}>{email}</td>
                            <td style={{padding: '10px', textAlign: 'left'}}>{phone}</td>
                            <td style={{padding: '10px', textAlign: 'left'}}>{formatDate(participant.registered_at)}</td>
                            <td style={{padding: '10px', textAlign: 'center'}}>
                              <Badge bg={isAttended ? 'success' : 'secondary'}>
                                {isAttended ? 'Attended' : 'Registered'}
                              </Badge>
                            </td>
                            <td style={{padding: '10px', textAlign: 'center'}}>
                              <div className={styles.formCheck}>
                                <input 
                                  className={styles.formCheckInput} 
                                  type="checkbox" 
                                  checked={isAttended} 
                                  onChange={() => toggleAttendance(participant.id)}
                                  disabled={attendanceLoading}
                                  style={{
                                    cursor: 'pointer',
                                    height: '1.5rem', 
                                    width: '3rem'
                                  }}
                                />
                                <label className={styles.formCheckLabel}>
                                  {isAttended ? 'Present' : 'Mark Present'}
                                </label>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
