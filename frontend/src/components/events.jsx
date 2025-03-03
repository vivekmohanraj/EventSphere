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
} from "react-icons/fa";
import { ACCESS_TOKEN } from "../utils/constants"; // Add this import

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      navigate("/login_reg");
      return;
    }
    fetchEvents();
  }, [navigate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/events/");
      // Ensure we're getting an array of events
      const eventsList = Array.isArray(response.data) ? response.data : [];
      setEvents(eventsList);
    } catch (error) {
      console.error("Error fetching events:", error.response?.data);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login_reg");
      } else {
        toast.error("Failed to fetch events. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCoordinatorClick = () => {
    const userData = localStorage.getItem("user"); // Assuming you store user type in session
    const user = JSON.parse(userData);
    console.log(user.role);
    if (user.role === "coordinator" || user.role === "admin") {
      navigate("/create-event");
    } else {
      setShowModal(true);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (!event) return false; // Skip null or undefined events

    const matchesSearch = event.event_name
      ?.toLowerCase()
      ?.includes(searchTerm.toLowerCase());

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

      {/* Add Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        className={styles.coordinatorModal}
      >
        <Modal.Body className={styles.modalBody}>
          <h4>Coordinator Access Required</h4>
          <p>
            Only event coordinators can create and manage events. Want to become
            an event coordinator?
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
              Cancel
            </button>
          </div>
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
                className={filter === "ongoing" ? styles.active : ""}
                onClick={() => setFilter("ongoing")}
              >
                Ongoing
              </button>
            </div>
          </div>

          <div className={styles.eventsGrid}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={styles.eventCard}
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  <div className={styles.eventImage}>
                    <img
                      src={event.photos[0]?.photo_url || "/default-event.jpg"}
                      alt={event.event_name}
                    />
                    <div className={styles.eventStatus}>
                      <span className={styles[event.status]}>
                        {event.status}
                      </span>
                    </div>
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
                        {new Date(event.event_time).toLocaleTimeString()}
                      </p>
                      <p>
                        <FaTicketAlt />
                        {event.is_paid ? `₹${event.price}` : "Free"}
                      </p>
                    </div>
                    <p className={styles.eventDescription}>
                      {event.description.slice(0, 100)}...
                    </p>
                    <Link
                      to={`/events/${event.id}`}
                      className={styles.viewDetails}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
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
