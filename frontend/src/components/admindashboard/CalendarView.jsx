import React, { useState, useEffect } from 'react';
import { 
  FaCalendarAlt, 
  FaChevronLeft, 
  FaChevronRight, 
  FaPlus, 
  FaEllipsisH,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaArrowLeft
} from 'react-icons/fa';
import api from '../../utils/api';
import styles from '../../assets/css/calendar.module.css';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // 'month', 'week', or 'day'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
  });
  
  // Get current year and month
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);
  
  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Calculate the date range for fetching events based on view
      let startDate, endDate;
      
      if (view === 'month') {
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
      } else if (view === 'week') {
        const firstDayOfWeek = new Date(currentDate);
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        firstDayOfWeek.setDate(diff);
        
        startDate = firstDayOfWeek;
        endDate = new Date(firstDayOfWeek);
        endDate.setDate(endDate.getDate() + 6);
      } else { // day view
        startDate = new Date(currentYear, currentMonth, currentDate.getDate());
        endDate = new Date(currentYear, currentMonth, currentDate.getDate());
      }
      
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      console.log(`Fetching events from ${formattedStartDate} to ${formattedEndDate}`);
      
      // Try multiple endpoints
      const endpoints = [
        'events/',
        'api/events/',
        'events/events/',
        `events/?start_date=${formattedStartDate}&end_date=${formattedEndDate}`,
        `api/events/?start_date=${formattedStartDate}&end_date=${formattedEndDate}`,
        `events/events/?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
      ];
      
      let fetchedEvents = [];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await api.get(endpoint);
          console.log(`Response from ${endpoint}:`, response.data);
          
          if (response.data) {
            if (Array.isArray(response.data)) {
              fetchedEvents = response.data;
              break;
            } else if (response.data.results && Array.isArray(response.data.results)) {
              fetchedEvents = response.data.results;
              break;
            } else if (typeof response.data === 'object') {
              // Try to find an array in the response
              for (const key in response.data) {
                if (Array.isArray(response.data[key])) {
                  fetchedEvents = response.data[key];
                  break;
                }
              }
              if (fetchedEvents.length > 0) break;
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch events from ${endpoint}`, error);
        }
      }
      
      console.log('Fetched events:', fetchedEvents);
      
      // Manually filter events if API doesn't support date filtering
      if (fetchedEvents.length > 0) {
        // Filter events that fall within our date range
        const filteredEvents = fetchedEvents.filter(event => {
          const eventDate = new Date(event.event_time || event.event_date || event.date || event.start_date);
          if (isNaN(eventDate.getTime())) return false; // Skip invalid dates
          return eventDate >= startDate && eventDate <= endDate;
        });
        
        console.log('Filtered events:', filteredEvents);
        setEvents(filteredEvents);
      } else {
        setEvents([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      setLoading(false);
    }
  };
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Navigation functions
  const goToPreviousMonth = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else { // day view
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };
  
  const goToNextMonth = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else { // day view
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Function to handle date selection
  const handleDateClick = (day) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(selectedDate);
    // If in month view, switch to day view
    if (view === 'month') {
      setCurrentDate(selectedDate);
      setView('day');
    }
  };
  
  // Function to check if a date has events
  const getEventsForDate = (day) => {
    return events.filter(event => {
      // Try multiple possible date fields
      const eventDate = new Date(
        event.event_time || 
        event.event_date || 
        event.date || 
        event.start_date || 
        event.created_at
      );
      
      if (isNaN(eventDate.getTime())) return false; // Skip invalid dates
      
      if (view === 'month') {
        return (
          eventDate.getDate() === day &&
          eventDate.getMonth() === currentMonth &&
          eventDate.getFullYear() === currentYear
        );
      } else if (view === 'week') {
        // For week view, get first and last day of current week
        const firstDayOfWeek = new Date(currentDate);
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        firstDayOfWeek.setDate(diff);
        
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
        
        return eventDate >= firstDayOfWeek && eventDate <= lastDayOfWeek;
      } else { // day view
        return (
          eventDate.getDate() === currentDate.getDate() &&
          eventDate.getMonth() === currentDate.getMonth() &&
          eventDate.getFullYear() === currentDate.getFullYear()
        );
      }
    });
  };
  
  // Render month calendar
  const renderMonthCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    
    // Create array for days
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateEvents = getEventsForDate(day);
      const isToday = 
        day === new Date().getDate() && 
        currentMonth === new Date().getMonth() && 
        currentYear === new Date().getFullYear();
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`${styles.day} ${isToday ? styles.today : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className={styles.dayNumber}>{day}</div>
          <div className={styles.dayEvents}>
            {dateEvents.slice(0, 3).map((event, index) => (
              <div 
                key={`event-${day}-${index}`} 
                className={styles.eventDot}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
              >
                <span className={styles.eventTitle}>
                  {event.event_name || event.name || event.title || "Untitled Event"}
                </span>
              </div>
            ))}
            {dateEvents.length > 3 && (
              <div className={styles.moreEvents}>+{dateEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className={styles.monthGrid}>
        <div className={styles.dayHeader}>Sun</div>
        <div className={styles.dayHeader}>Mon</div>
        <div className={styles.dayHeader}>Tue</div>
        <div className={styles.dayHeader}>Wed</div>
        <div className={styles.dayHeader}>Thu</div>
        <div className={styles.dayHeader}>Fri</div>
        <div className={styles.dayHeader}>Sat</div>
        {days}
      </div>
    );
  };
  
  // Render week view
  const renderWeekView = () => {
    // Get the first day of the week from current date
    const firstDayOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    firstDayOfWeek.setDate(diff);
    
    const weekDays = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Create array for days of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(date.getDate() + i);
      
      const dateEvents = events.filter(event => {
        const eventDate = new Date(
          event.event_time || 
          event.event_date || 
          event.date || 
          event.start_date || 
          event.created_at
        );
        
        if (isNaN(eventDate.getTime())) return false; // Skip invalid dates
        
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      });
      
      const isToday = 
        date.getDate() === new Date().getDate() && 
        date.getMonth() === new Date().getMonth() && 
        date.getFullYear() === new Date().getFullYear();
      
      weekDays.push(
        <div 
          key={`weekday-${i}`} 
          className={`${styles.weekDay} ${isToday ? styles.today : ''}`}
          onClick={() => {
            setCurrentDate(date);
            setView('day');
          }}
        >
          <div className={styles.weekDayHeader}>
            <div className={styles.weekDayName}>{dayNames[i]}</div>
            <div className={styles.weekDayDate}>
              {date.getDate()} {date.toLocaleString('default', { month: 'short' })}
            </div>
          </div>
          <div className={styles.weekDayEvents}>
            {dateEvents.map((event, index) => (
              <div 
                key={`event-${i}-${index}`} 
                className={styles.weekEvent}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
              >
                <div className={styles.weekEventTime}>
                  {new Date(
                    event.event_time || 
                    event.event_date || 
                    event.date || 
                    event.start_date || 
                    event.created_at
                  ).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className={styles.weekEventTitle}>
                  {event.event_name || event.name || event.title || "Untitled Event"}
                </div>
              </div>
            ))}
            {dateEvents.length === 0 && (
              <div className={styles.noWeekEvents}>No events</div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className={styles.weekGrid}>
        {weekDays}
      </div>
    );
  };
  
  // Render day view
  const renderDayView = () => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(
        event.event_time || 
        event.event_date || 
        event.date || 
        event.start_date || 
        event.created_at
      );
      
      if (isNaN(eventDate.getTime())) return false; // Skip invalid dates
      
      return (
        eventDate.getDate() === currentDate.getDate() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
    
    // Sort events by time
    dayEvents.sort((a, b) => {
      const timeA = new Date(
        a.event_time || 
        a.event_date || 
        a.date || 
        a.start_date || 
        a.created_at
      );
      
      const timeB = new Date(
        b.event_time || 
        b.event_date || 
        b.date || 
        b.start_date || 
        b.created_at
      );
      
      return timeA - timeB;
    });
    
    return (
      <div className={styles.dayView}>
        <div className={styles.dayViewHeader}>
          <h3 className={styles.dayViewTitle}>
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </h3>
          <button 
            className={styles.backButton}
            onClick={() => setView('month')}
          >
            <FaArrowLeft /> Back to Month
          </button>
        </div>
        
        <div className={styles.dayViewEvents}>
          {dayEvents.length === 0 ? (
            <div className={styles.noDayEvents}>No events scheduled for this day</div>
          ) : (
            dayEvents.map((event, index) => {
              const eventDate = new Date(
                event.event_time || 
                event.event_date || 
                event.date || 
                event.start_date || 
                event.created_at
              );
              
              return (
                <div 
                  key={`day-event-${index}`} 
                  className={styles.dayEvent}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className={styles.dayEventTime}>
                    {eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className={styles.dayEventContent}>
                    <h4 className={styles.dayEventTitle}>
                      {event.event_name || event.name || event.title || "Untitled Event"}
                    </h4>
                    <div className={styles.dayEventMeta}>
                      {(event.location || event.venue) && (
                        <div className={styles.dayEventLocation}>
                          <FaMapMarkerAlt />
                          <span>{event.location || event.venue}</span>
                        </div>
                      )}
                      {event.description && (
                        <div className={styles.dayEventDescription}>
                          {event.description.substring(0, 100)}
                          {event.description.length > 100 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };
  
  // Render upcoming events list
  const renderUpcomingEvents = () => {
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(
        a.event_time || 
        a.event_date || 
        a.date || 
        a.start_date || 
        a.created_at
      );
      
      const dateB = new Date(
        b.event_time || 
        b.event_date || 
        b.date || 
        b.start_date || 
        b.created_at
      );
      
      return dateA - dateB;
    });
    
    // Get only future events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingEvents = sortedEvents.filter(event => {
      const eventDate = new Date(
        event.event_time || 
        event.event_date || 
        event.date || 
        event.start_date || 
        event.created_at
      );
      
      if (isNaN(eventDate.getTime())) return false; // Skip invalid dates
      
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    }).slice(0, 5);
    
    return (
      <div className={styles.upcomingEventsSection}>
        <h3 className={styles.upcomingTitle}>Upcoming Events</h3>
        {upcomingEvents.length === 0 ? (
          <div className={styles.noEvents}>No upcoming events</div>
        ) : (
          <div className={styles.upcomingList}>
            {upcomingEvents.map((event, index) => {
              const eventDate = new Date(
                event.event_time || 
                event.event_date || 
                event.date || 
                event.start_date || 
                event.created_at
              );
              
              if (isNaN(eventDate.getTime())) return null; // Skip invalid dates
              
              return (
                <div 
                  key={`upcoming-${index}`} 
                  className={styles.upcomingEvent}
                  onClick={() => {
                    setCurrentDate(eventDate);
                    setSelectedEvent(event);
                    setView('day');
                  }}
                >
                  <div className={styles.eventDate}>
                    <div className={styles.eventMonth}>
                      {eventDate.toLocaleString('default', { month: 'short' })}
                    </div>
                    <div className={styles.eventDay}>
                      {eventDate.getDate()}
                    </div>
                  </div>
                  <div className={styles.eventDetails}>
                    <h4 className={styles.eventTitle}>{event.event_name || event.name || event.title || "Untitled Event"}</h4>
                    <div className={styles.eventMeta}>
                      <div className={styles.eventTime}>
                        <FaClock />
                        <span>{eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      {(event.location || event.venue) && (
                        <div className={styles.eventLocation}>
                          <FaMapMarkerAlt />
                          <span>{event.location || event.venue}</span>
                        </div>
                      )}
                      {event.participants && (
                        <div className={styles.eventAttendees}>
                          <FaUsers />
                          <span>{Array.isArray(event.participants) ? event.participants.length : event.participants} attendees</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.eventActions}>
                    <button className={styles.eventMoreBtn}>
                      <FaEllipsisH />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  
  // Render event details modal
  const renderEventDetailsModal = () => {
    if (!selectedEvent) return null;
    
    const eventDate = new Date(
      selectedEvent.event_time || 
      selectedEvent.event_date || 
      selectedEvent.date || 
      selectedEvent.start_date || 
      selectedEvent.created_at
    );
    
    return (
      <div className={styles.eventModalBackdrop} onClick={() => setSelectedEvent(null)}>
        <div className={styles.eventModal} onClick={e => e.stopPropagation()}>
          <div className={styles.eventModalHeader}>
            <h3>{selectedEvent.event_name || selectedEvent.name || selectedEvent.title || "Untitled Event"}</h3>
            <button className={styles.closeModalBtn} onClick={() => setSelectedEvent(null)}>×</button>
          </div>
          <div className={styles.eventModalBody}>
            <div className={styles.eventModalInfo}>
              <div className={styles.eventModalDetail}>
                <FaCalendarAlt />
                <span>{eventDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
              <div className={styles.eventModalDetail}>
                <FaClock />
                <span>{eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              {(selectedEvent.location || selectedEvent.venue) && (
                <div className={styles.eventModalDetail}>
                  <FaMapMarkerAlt />
                  <span>{selectedEvent.location || selectedEvent.venue}</span>
                </div>
              )}
              {selectedEvent.participants && (
                <div className={styles.eventModalDetail}>
                  <FaUsers />
                  <span>{Array.isArray(selectedEvent.participants) ? selectedEvent.participants.length : selectedEvent.participants} attendees</span>
                </div>
              )}
            </div>
            {selectedEvent.description && (
              <div className={styles.eventModalDescription}>
                <h4>Description</h4>
                <p>{selectedEvent.description}</p>
              </div>
            )}
          </div>
          <div className={styles.eventModalFooter}>
            <button 
              className={styles.closeBtn}
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </button>
            {selectedEvent.url && (
              <a 
                href={selectedEvent.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.viewDetailsBtn}
              >
                View Details
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Add this function to handle the form input changes
  const handleNewEventChange = (e) => {
    const { name, value } = e.target;
    setNewEventData({
      ...newEventData,
      [name]: value
    });
  };
  
  // Add this function to handle form submission
  const handleAddEvent = async (e) => {
    e.preventDefault();
    
    try {
      // Format the date and time for the API
      const eventDateTime = new Date(`${newEventData.date}T${newEventData.start_time}`);
      
      const eventData = {
        title: newEventData.title,
        event_date: newEventData.date,
        start_time: newEventData.start_time,
        end_time: newEventData.end_time || null,
        location: newEventData.location,
        description: newEventData.description,
        event_time: eventDateTime.toISOString(),
      };
      
      // Try multiple endpoints for creating events
      const endpoints = [
        'events/',
        'api/events/',
        'events/events/'
      ];
      
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          await api.post(endpoint, eventData);
          success = true;
          break;
        } catch (error) {
          console.warn(`Failed to create event at ${endpoint}`, error);
        }
      }
      
      if (success) {
        // Clear form data and close modal
        setNewEventData({
          title: '',
          date: '',
          start_time: '',
          end_time: '',
          location: '',
          description: '',
        });
        setShowAddEventModal(false);
        
        // Refresh events list
        fetchEvents();
        
        // Show success message
        alert('Event created successfully!');
      } else {
        alert('Failed to create event. Please try again.');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('An error occurred while creating the event');
    }
  };
  
  // Add Event Modal Render function
  const renderAddEventModal = () => {
    // Get today's date in YYYY-MM-DD format for the date input min value
    const today = new Date().toISOString().split('T')[0];
    
    // If a date is selected, use it as the default date, otherwise use today
    const defaultDate = selectedDate 
      ? new Date(selectedDate).toISOString().split('T')[0] 
      : today;
    
    return (
      <div className={styles.eventModalBackdrop} onClick={() => setShowAddEventModal(false)}>
        <div className={styles.eventModal} onClick={e => e.stopPropagation()}>
          <div className={styles.eventModalHeader}>
            <h3><FaPlus style={{ marginRight: '8px' }} /> Add New Event</h3>
            <button className={styles.closeModalBtn} onClick={() => setShowAddEventModal(false)}>×</button>
          </div>
          
          <form onSubmit={handleAddEvent}>
            <div className={styles.eventModalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Event Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newEventData.title}
                  onChange={handleNewEventChange}
                  className={styles.formInput}
                  required
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={newEventData.date || defaultDate}
                    min={today}
                    onChange={handleNewEventChange}
                    className={styles.formInput}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="start_time">Start Time *</label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={newEventData.start_time}
                    onChange={handleNewEventChange}
                    className={styles.formInput}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="end_time">End Time</label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={newEventData.end_time}
                    onChange={handleNewEventChange}
                    className={styles.formInput}
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newEventData.location}
                  onChange={handleNewEventChange}
                  className={styles.formInput}
                  placeholder="Event location (optional)"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newEventData.description}
                  onChange={handleNewEventChange}
                  className={styles.formTextarea}
                  rows="4"
                  placeholder="Event description (optional)"
                ></textarea>
              </div>
            </div>
            
            <div className={styles.eventModalFooter}>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowAddEventModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.viewDetailsBtn}
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <div className={styles.calendarTitle}>
          <FaCalendarAlt className={styles.calendarIcon} />
          <h2>Events Calendar</h2>
        </div>
        
        <div className={styles.calendarControls}>
          <div className={styles.calendarNav}>
            <button onClick={goToPreviousMonth} className={styles.navButton}>
              <FaChevronLeft />
            </button>
            <button onClick={goToToday} className={styles.todayButton}>
              Today
            </button>
            <button onClick={goToNextMonth} className={styles.navButton}>
              <FaChevronRight />
            </button>
          </div>
          
          <div className={styles.currentMonth}>
            {view === 'month' && new Intl.DateTimeFormat('en-US', { 
              month: 'long',
              year: 'numeric'
            }).format(currentDate)}
            
            {view === 'week' && `Week of ${new Date(currentDate).toLocaleDateString('en-US', { 
              month: 'short',
              day: 'numeric'
            })}`}
            
            {view === 'day' && new Intl.DateTimeFormat('en-US', { 
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }).format(currentDate)}
          </div>
        </div>
        
        <div className={styles.calendarActions}>
          <button 
            className={styles.addEventButton}
            onClick={() => setShowAddEventModal(true)}
          >
            <FaPlus />
            <span>Add Event</span>
          </button>
        </div>
      </div>
      
      <div className={styles.calendarViewToggle}>
        <button 
          className={`${styles.viewButton} ${view === 'month' ? styles.activeView : ''}`}
          onClick={() => setView('month')}
        >
          Month
        </button>
        <button 
          className={`${styles.viewButton} ${view === 'week' ? styles.activeView : ''}`}
          onClick={() => setView('week')}
        >
          Week
        </button>
        <button 
          className={`${styles.viewButton} ${view === 'day' ? styles.activeView : ''}`}
          onClick={() => setView('day')}
        >
          Day
        </button>
      </div>
      
      <div className={styles.calendarContent}>
        <div className={styles.calendarMain}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <div>Loading events...</div>
            </div>
          ) : (
            <>
              {view === 'month' && renderMonthCalendar()}
              {view === 'week' && renderWeekView()}
              {view === 'day' && renderDayView()}
            </>
          )}
        </div>
        
        <div className={styles.sidebarContent}>
          {renderUpcomingEvents()}
        </div>
      </div>
      
      {selectedEvent && renderEventDetailsModal()}
      {showAddEventModal && renderAddEventModal()}
    </div>
  );
};

export default CalendarView; 