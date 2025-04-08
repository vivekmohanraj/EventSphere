import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "react-bootstrap/Modal";
import api from "../utils/api";
import styles from "../assets/css/eventList.module.css";
import {
  FaCalendar,
  FaClock,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaCheck,
  FaUserCheck,
  FaSync,
} from "react-icons/fa";
import { ACCESS_TOKEN } from "../utils/constants"; // Add this import

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [userParticipations, setUserParticipations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Setup a regular refresh interval for events
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      navigate("/login_reg");
      return;
    }
    
    // Initial fetch
    fetchEvents();
    fetchUserParticipations();
    
    // Set up refresh interval - fetch events every 60 seconds
    const intervalId = setInterval(() => {
      fetchEvents(false); // The false parameter indicates a background refresh
    }, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [navigate]);

  const fetchEvents = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const response = await api.get("/api/events/");
      // Ensure we're getting an array of events
      const eventsList = Array.isArray(response.data) ? response.data : [];
      
      // Remove duplicate events by ID
      const uniqueEventsMap = new Map();
      eventsList.forEach(event => {
        if (event && event.id) {
          // Only keep the first occurrence of each event ID
          if (!uniqueEventsMap.has(event.id)) {
            uniqueEventsMap.set(event.id, event);
          }
        }
      });
      
      // Convert back to array
      const uniqueEvents = Array.from(uniqueEventsMap.values());
      console.log(`Filtered ${eventsList.length - uniqueEvents.length} duplicate events`);
      
      // Update event status client-side based on event date
      const updatedEvents = uniqueEvents.map(event => {
        // Normalize status - handle both 'canceled' and 'cancelled' spellings
        let normalizedStatus = event.status;
        if (normalizedStatus === 'cancelled') {
          normalizedStatus = 'canceled';
        }
        
        // If the event is 'upcoming' but its date has passed, mark it as 'completed'
        if (normalizedStatus === 'upcoming') {
          const eventDateTime = new Date(event.event_time);
          const currentTime = new Date();
          
          if (eventDateTime < currentTime) {
            return {
              ...event,
              status: 'completed',
              clientSideStatus: 'completed'
            };
          }
        }
        
        return {
          ...event,
          status: normalizedStatus,
          clientSideStatus: normalizedStatus
        };
      });
      
      setEvents(updatedEvents);
      
      if (!showLoadingState && !refreshing) {
        toast.info("Events refreshed", { autoClose: 1000 });
      }
    } catch (error) {
      console.error("Error fetching events:", error.response?.data);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login_reg");
      } else if (showLoadingState) {
        // Only show error toast if this is an initial load, not a background refresh
        toast.error("Failed to fetch events. Please try again.");
      }
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchEvents(false);
    fetchUserParticipations();
  };

  const fetchUserParticipations = async () => {
    try {
      const response = await api.get("/api/events/participants/my_participations/");
      setUserParticipations(response.data);
    } catch (error) {
      console.error("Error fetching user participations:", error);
      // Don't show error toast as this is not critical
    }
  };

  const isUserRegistered = (eventId) => {
    return userParticipations.some(
      participation => 
        participation.event === eventId && 
        ["registered", "attended"].includes(participation.status)
    );
  };

  // Map event status to CSS class and display text
  const getStatusInfo = (status) => {
    const statusMap = {
      'upcoming': { class: 'upcoming', text: 'Upcoming' },
      'completed': { class: 'completed', text: 'Completed' },
      'canceled': { class: 'canceled', text: 'Canceled' },
      'cancelled': { class: 'canceled', text: 'Canceled' },
      'postponed': { class: 'postponed', text: 'Postponed' },
      'ongoing': { class: 'ongoing', text: 'Ongoing' }
    };

    return statusMap[status] || { class: 'upcoming', text: 'Upcoming' };
  };

  const handleCoordinatorClick = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        toast.error("Please login to continue");
        navigate("/login_reg");
        return;
      }
      
      const user = JSON.parse(userData);
      
      if (user.role === "coordinator" || user.role === "admin") {
        navigate("/create-event");
      } else {
        // Check if user has already submitted a request
        checkCoordinatorRequestStatus();
      }
    } catch (error) {
      console.error("Error accessing user data:", error);
      toast.error("An error occurred. Please try again later.");
    }
  };

  const checkCoordinatorRequestStatus = async () => {
    try {
      // Try to get the user profile to check coordinator_request status
      const response = await api.get("/users/profile/");
      
      if (response.data.coordinator_request) {
        // Request is already pending
        setRequestSubmitted(true);
      }
      
      // Show the modal regardless
      setShowModal(true);
    } catch (error) {
      console.error("Error checking coordinator request status:", error);
      // If we can't check, just show the modal
      setShowModal(true);
    }
  };

  const submitCoordinatorRequest = async () => {
    try {
      setRequestSubmitting(true);
      await api.post("/users/coordinator-request/");
      setRequestSubmitted(true);
      toast.success("Coordinator request submitted successfully!");
    } catch (error) {
      console.error("Error submitting coordinator request:", error);
      toast.error("Failed to submit your request. Please try again later.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (!event) return false; // Skip null or undefined events

    const matchesSearch = event.event_name
      ?.toLowerCase()
      ?.includes(searchTerm.toLowerCase());

    // New filter for registered events
    if (filter === "registered") {
      return matchesSearch && isUserRegistered(event.id);
    }

    const matchesFilter =
      filter === "all" ||
      (event.status && event.status.toLowerCase() === filter.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.dummy}></div>

      <div className={styles.coordinatorCta}>
        <div className={styles.ctaContent}>
          <div>
            <h3>Want to coordinate an event?</h3>
            <p>
              Join as an event coordinator and start organizing amazing events
            </p>
          </div>
          <button onClick={handleCoordinatorClick} className={styles.ctaButton}>
            Coordinate an event
          </button>
        </div>
      </div>

      {/* Coordinator Request Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        className={styles.coordinatorModal}
      >
        <Modal.Body className={styles.modalBody}>
          <h4>Coordinator Access Required</h4>
          
          {requestSubmitted ? (
            <>
              <p>
                Your coordinator request has been submitted and is pending approval. 
                You'll be notified once an admin reviews your request.
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate("/dashboard");
                  }}
                  className={styles.primaryBtn}
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className={styles.secondaryBtn}
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                Only event coordinators can create and manage events. Would you like to 
                request coordinator privileges?
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={submitCoordinatorRequest}
                  className={styles.primaryBtn}
                  disabled={requestSubmitting}
                >
                  {requestSubmitting ? "Submitting..." : "Request Coordinator Role"}
                </button>
                <div className={styles.secondaryActions}>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      navigate("/dashboard");
                    }}
                    className={styles.secondaryBtn}
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className={styles.secondaryBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      <section className={styles.eventsSection}>
        <div className="container">
          <div className={styles.sectionTitle} data-aos="fade-up">
            <h2>Available Events</h2>
            <p>Discover Amazing Events</p>
          </div>

          <div className={styles.filterContainer} data-aos="fade-up">
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={handleRefresh}
                className={styles.refreshButton}
                disabled={refreshing}
                title="Refresh Events"
              >
                <FaSync className={refreshing ? styles.spinning : ''} />
              </button>
            </div>
            <div className={styles.filterButtons}>
              <button
                className={filter === "all" ? styles.active : ""}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={filter === "upcoming" ? styles.active : ""}
                onClick={() => setFilter("upcoming")}
              >
                Upcoming
              </button>
              <button
                className={filter === "completed" ? styles.active : ""}
                onClick={() => setFilter("completed")}
              >
                Completed
              </button>
              <button
                className={filter === "canceled" ? styles.active : ""}
                onClick={() => setFilter("canceled")}
              >
                Canceled
              </button>
              <button
                className={filter === "registered" ? styles.active : ""}
                onClick={() => setFilter("registered")}
              >
                My Events
              </button>
            </div>
          </div>

          <div className={styles.eventsGrid}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => {
                const statusInfo = getStatusInfo(event.clientSideStatus || event.status);
                
                return (
                  <div
                    key={event.id}
                    className={styles.eventCard}
                    data-aos="fade-up"
                    data-aos-delay="100"
                  >
                    <div className={styles.eventImage}>
                      <img
                        src={event.photos?.[0]?.photo_url || "/default-event.jpg"}
                        alt={event.event_name}
                      />
                      <div className={styles.eventStatus}>
                        <span className={styles[statusInfo.class]}>
                          {statusInfo.text}
                        </span>
                      </div>
                      {isUserRegistered(event.id) && (
                        <div className={styles.enrolledBadge}>
                          <FaUserCheck /> Enrolled
                        </div>
                      )}
                    </div>
                    <div className={styles.eventContent}>
                      <h3>{event.event_name}</h3>
                      <div className={styles.eventDetails}>
                        <p>
                          <FaCalendar />
                          {new Date(event.event_time).toLocaleDateString()}
                        </p>
                        <p>
                          <FaClock />
                          {new Date(event.event_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p>
                          <FaTicketAlt />
                          {event.is_paid ? `₹${event.price}` : "Free"}
                        </p>
                      </div>
                      <p className={styles.eventDescription}>
                        {event.description ? `${event.description.slice(0, 100)}...` : 'No description available'}
                      </p>
                      <Link
                        to={`/events/${event.id}`}
                        className={styles.viewDetails}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.noEvents}>
                <h3>No events found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>

          {filteredEvents.length === 0 && (
            <div className={styles.noEvents}>
              <h3>No events found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default EventList;
