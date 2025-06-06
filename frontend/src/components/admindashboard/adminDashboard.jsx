import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { createClient } from '@renderize/lib';
import {
  FaUsers,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaChartLine,
  FaMapMarkerAlt,
  FaUserPlus,
  FaCalendarPlus,
  FaChartBar,
  FaFileInvoice,
  FaDownload,
  FaBullhorn,
  FaUserShield,
  FaUser,
  FaClock,
  FaCheck,
  FaTimes,
  FaUserCog,
  FaFilePdf
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import api, { getMediaUrl, tryMultipleEndpoints } from "../../utils/api";
import styles from "../../assets/css/adminDashboard.module.css";
import UsersManagement from "./userManagement";
import EventsManagement from "./eventsManagement";
import PaymentsManagement from "./paymentsManagement";
import CoordinatorRequests from "./coordinatorRequest";
import ProfileUpdate from "./profileUpdate";
import CalendarView from "./CalendarView";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../utils/constants";
import { Chart, registerables } from 'chart.js';
import DashboardOverview from './dashboardOverview';
Chart.register(...registerables);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRevenue: 0,
    activeEvents: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    profile_photo: null
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const navigate = useNavigate();
  
  // Chart reference
  const chartRef = React.useRef(null);
  const chart = React.useRef(null);

  // Add new state for PDF loading
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    console.log("Dashboard mounting, checking authentication...");
    checkAuthAndFetchStats();
    fetchUserProfile();
  }, []);
  
  useEffect(() => {
    // Initialize chart when stats are loaded and overview tab is active
    if (!loading && activeTab === "overview" && chartRef.current) {
      createRevenueChart();
    }
    
    return () => {
      // Destroy chart when component unmounts
      if (chart.current) {
        chart.current.destroy();
      }
    };
  }, [loading, activeTab, stats]);

  const checkAuthAndFetchStats = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    console.log("Token found:", token ? "Yes" : "No");
    
    if (!token) {
      console.log("No token found, redirecting to login");
      navigate("/login_reg");
      return;
    }
    
    try {
      // Check token validity using JWT decode
      const decoded = jwtDecode(token);
      const tokenExpiration = decoded.exp;
      const now = Date.now() / 1000;
      
      // Check user role from token or localStorage
      let userRole;
      
      // Try to get role from token
      if (decoded.role) {
        userRole = decoded.role;
      } else if (decoded.user_role) {
        userRole = decoded.user_role;
      } else {
        // If not in token, try localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            userRole = parsedUserData.role || parsedUserData.user_role;
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
      }
      
      console.log("User role:", userRole);
      
      // Redirect based on role if not admin
      if (userRole && userRole !== "admin") {
        console.log(`Redirecting ${userRole} to appropriate dashboard`);
        
        if (userRole === "coordinator") {
          navigate("/coordinator-dashboard");
          return;
        } else if (userRole === "normal") {
          navigate("/user-dashboard");
          return;
        } else {
          // For any other role, redirect to homepage
          navigate("/");
          return;
        }
      }
      
      if (tokenExpiration < now) {
        // Token expired, try to refresh
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        const response = await api.post("token/refresh/", {
          refresh: refreshToken,
        });
        
        if (response.status === 200) {
          localStorage.setItem(ACCESS_TOKEN, response.data.access);
        } else {
          throw new Error("Token refresh failed");
        }
      }
      
      // If we got here, token is valid or was refreshed successfully
      await fetchDashboardStats();
    } catch (error) {
      console.error("Token verification failed:", error);
      // Token might be invalid or expired
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
      localStorage.removeItem("user");
      navigate("/login_reg");
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log("Fetching dashboard stats from API...");
      const response = await fetch('/users/stats/');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const statsData = await response.json();
      console.log("Dashboard stats received:", statsData);
      
      // Extract the base stats from the response
      const newStats = {
        totalUsers: statsData.total_users || 0,
        totalEvents: statsData.total_events || 0,
        totalRevenue: statsData.total_revenue || 0,
        activeEvents: statsData.active_events || 0,
        pendingRequests: statsData.pending_requests || 0,
        
        // Monthly data
        monthlyRevenue: statsData.monthly_revenue || Array(12).fill(0),
        monthlyEvents: statsData.monthly_events || Array(12).fill(0),
        monthlyUsers: statsData.monthly_users || Array(12).fill(0),
        
        // Growth rates
        growthRates: statsData.growth_rates || {
          users: 0,
          events: 0,
          revenue: 0,
          active: 0
        },
        
        // Event type distribution
        eventTypes: statsData.event_types || [],
        
        // Additional analytics data
        attendance_data: statsData.attendance_data || null,
        event_ratings: statsData.event_ratings || null,
        participation_trends: statsData.participation_trends || null,
        booking_time_data: statsData.booking_time_data || null,
        popular_venues: statsData.popular_venues || null,
      };

      // If venue data is available, format it for the chart
      if (statsData.popular_venues && Array.isArray(statsData.popular_venues)) {
        // Format it as expected by the chart
        newStats.popular_venues = statsData.popular_venues.map(venue => ({
          name: venue.name || venue.venue || 'Unknown Venue',
          count: venue.count || venue.value || 0
        }));
      } else if (statsData.venue_distribution) {
        // Alternative format that might be in the API
        newStats.popular_venues = Object.entries(statsData.venue_distribution)
          .map(([venue, count]) => ({ name: venue, count: count }))
          .filter(v => v.name && v.count > 0);
      }
      
      setStats(newStats);
      setLoading(false);
      return newStats;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Fall back to direct counting if stats endpoint fails
      await fetchCountsDirectly();
      setLoading(false);
      return null;
    }
  };

  const fetchCountsDirectly = async () => {
    try {
      let userCount = 0;
      let eventCount = 0;
      let activeCount = 0;
      let requestCount = 0;
      let totalRevenue = 0;
      
      // Arrays to store monthly data
      let monthlyRevenue = new Array(12).fill(0);
      let monthlyEvents = new Array(12).fill(0);
      let monthlyUsers = new Array(12).fill(0);
      
      // Storage for additional analytics data
      let attendanceData = [];
      let eventRatings = [0, 0, 0, 0, 0]; // 1-5 star ratings
      let participationTrends = new Array(12).fill(0);
      let bookingTimeData = [0, 0, 0, 0, 0, 0]; // Registration timing buckets
      let popularVenues = {};
      
      // Track current and previous month data for growth calculation
      let currentMonthUsers = 0;
      let prevMonthUsers = 0;
      let currentMonthEvents = 0;
      let prevMonthEvents = 0;
      let currentMonthRevenue = 0;
      let prevMonthRevenue = 0;
      
      // Current date info for month comparison
      const now = new Date();
      const currentMonth = now.getMonth();
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      
      // Get user count and monthly distribution
      try {
        const response = await api.get("/users/users/");
        if (response.data) {
          let users = [];
          
          if (Array.isArray(response.data)) {
            users = response.data;
            userCount = users.length;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            users = response.data.results;
            userCount = users.length;
          } else if (response.data.count) {
            userCount = response.data.count;
          }
          
          // Calculate monthly user sign-ups if creation date is available
          if (users.length > 0 && (users[0].created_at || users[0].date_joined)) {
            users.forEach(user => {
              const creationDate = new Date(user.created_at || user.date_joined);
              if (!isNaN(creationDate.getTime())) {
                const month = creationDate.getMonth();
                monthlyUsers[month]++;
                
                // Check if user was created this month or previous month
                if (creationDate.getMonth() === currentMonth && 
                    creationDate.getFullYear() === now.getFullYear()) {
                  currentMonthUsers++;
                } else if (creationDate.getMonth() === prevMonth && 
                          ((creationDate.getFullYear() === now.getFullYear()) || 
                          (prevMonth === 11 && creationDate.getFullYear() === now.getFullYear() - 1))) {
                  prevMonthUsers++;
                }
              }
            });
          }
        }
      } catch (error) {
        console.warn("Could not fetch user count", error);
      }
      
      // Get event count, active events, and monthly distribution
      let events = [];
      try {
        const response = await api.get("/events/events/");
        if (response.data) {
          if (Array.isArray(response.data)) {
            events = response.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            events = response.data.results;
          }
          
          if (events.length > 0) {
            eventCount = events.length;
            
            // Count active events (upcoming or ongoing)
            activeCount = events.filter(event => {
              const eventDate = new Date(event.event_time || event.event_date);
              return eventDate >= now || event.status === 'upcoming' || event.status === 'ongoing';
            }).length;
            
            // Collect venue data for popular venues chart
            events.forEach(event => {
              if (event.venue) {
                popularVenues[event.venue] = (popularVenues[event.venue] || 0) + 1;
              }
            });
            
            // Calculate monthly event creation
            events.forEach(event => {
              const creationDate = new Date(event.created_at || event.event_time);
              if (!isNaN(creationDate.getTime())) {
                const month = creationDate.getMonth();
                monthlyEvents[month]++;
                
                // Check if event was created this month or previous month
                if (creationDate.getMonth() === currentMonth && 
                    creationDate.getFullYear() === now.getFullYear()) {
                  currentMonthEvents++;
                } else if (creationDate.getMonth() === prevMonth && 
                          ((creationDate.getFullYear() === now.getFullYear()) || 
                          (prevMonth === 11 && creationDate.getFullYear() === now.getFullYear() - 1))) {
                  prevMonthEvents++;
                }
              }
            });
          } else if (response.data.count) {
            eventCount = response.data.count;
          }
        }
      } catch (error) {
        console.warn("Could not fetch event count", error);
      }
      
      // Get coordinator request count
      try {
        const response = await api.get("/events/coordinator-requests/");
        if (response.data) {
          if (Array.isArray(response.data)) {
            requestCount = response.data.filter(req => req.status === 'pending').length;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            requestCount = response.data.results.filter(req => req.status === 'pending').length;
          } else if (response.data.pending_count) {
            requestCount = response.data.pending_count;
          }
        }
      } catch (error) {
        console.warn("Could not fetch coordinator requests", error);
      }
      
      // Get payment data for revenue calculations
      try {
        const response = await api.get("/payments/payments/");
        if (response.data) {
          let payments = [];
          
          if (Array.isArray(response.data)) {
            payments = response.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            payments = response.data.results;
          }
          
          if (payments.length > 0) {
            // Calculate total revenue from completed payments
            payments.filter(payment => payment.payment_status === 'completed')
              .forEach(payment => {
                totalRevenue += parseFloat(payment.amount || 0);
              });
            
            // Calculate monthly revenue
            payments.filter(payment => payment.payment_status === 'completed')
              .forEach(payment => {
                const creationDate = new Date(payment.created_at);
                if (!isNaN(creationDate.getTime())) {
                  const month = creationDate.getMonth();
                  monthlyRevenue[month] += parseFloat(payment.amount || 0);
                  
                  // Check if payment was received this month or previous month
                  if (creationDate.getMonth() === currentMonth && 
                      creationDate.getFullYear() === now.getFullYear()) {
                    currentMonthRevenue += parseFloat(payment.amount || 0);
                  } else if (creationDate.getMonth() === prevMonth && 
                            ((creationDate.getFullYear() === now.getFullYear()) || 
                            (prevMonth === 11 && creationDate.getFullYear() === now.getFullYear() - 1))) {
                    prevMonthRevenue += parseFloat(payment.amount || 0);
                  }
                }
              });
          }
        }
      } catch (error) {
        console.warn("Could not fetch payment data", error);
      }
      
      // Get participant data for attendance, participation trends and registration timing analytics
      let participants = [];
      try {
        const response = await api.get("/events/participants/");
        if (response.data) {
          if (Array.isArray(response.data)) {
            participants = response.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            participants = response.data.results;
          }
          
          if (participants.length > 0) {
            // Count registrations by status for attendance chart
            const registered = participants.filter(p => p.status === 'registered').length;
            const attended = participants.filter(p => p.status === 'attended').length;
            const cancelled = participants.filter(p => p.status === 'canceled').length;
            const noShows = registered - attended - cancelled;
            
            attendanceData = [
              { status: 'registered', count: registered },
              { status: 'attended', count: attended },
              { status: 'no_show', count: Math.max(0, noShows) },
              { status: 'canceled', count: cancelled }
            ];
            
            // Count monthly participant registrations for participation trends
            participants.forEach(participant => {
              const regDate = new Date(participant.registered_at);
              if (!isNaN(regDate.getTime())) {
                const month = regDate.getMonth();
                participationTrends[month]++;
              }
            });
            
            // Analyze registration timing (how far in advance people register)
            participants.forEach(participant => {
              // Skip if missing data
              if (!participant.registered_at || !participant.event) {
                return;
              }
              
              // Find the associated event
              const event = events.find(e => e.id === participant.event);
              if (!event || !event.event_time) {
                return;
              }
              
              const regDate = new Date(participant.registered_at);
              const eventDate = new Date(event.event_time);
              
              if (isNaN(regDate.getTime()) || isNaN(eventDate.getTime())) {
                return;
              }
              
              // Calculate days between registration and event
              const daysDiff = Math.floor((eventDate - regDate) / (1000 * 60 * 60 * 24));
              
              // Categorize into buckets
              if (daysDiff < 1) {
                bookingTimeData[0]++; // Same day
              } else if (daysDiff < 4) {
                bookingTimeData[1]++; // 1-3 days
              } else if (daysDiff < 8) {
                bookingTimeData[2]++; // 4-7 days
              } else if (daysDiff < 15) {
                bookingTimeData[3]++; // 1-2 weeks
              } else if (daysDiff < 29) {
                bookingTimeData[4]++; // 2-4 weeks
              } else {
                bookingTimeData[5]++; // 1+ month
              }
            });
          }
        }
      } catch (error) {
        console.warn("Could not fetch participant data", error);
      }
      
      // Get feedback data for event ratings
      try {
        const response = await api.get("/events/events/");
        let feedbackData = [];
        
        // Loop through events to get feedback for each one
        for (const event of events) {
          try {
            const feedbackResponse = await api.get(`/events/events/${event.id}/feedback/`);
            if (feedbackResponse.data) {
              if (Array.isArray(feedbackResponse.data)) {
                feedbackData = [...feedbackData, ...feedbackResponse.data];
              } else if (feedbackResponse.data.results && Array.isArray(feedbackResponse.data.results)) {
                feedbackData = [...feedbackData, ...feedbackResponse.data.results];
              }
            }
          } catch (error) {
            // Skip if can't get feedback for this event
            continue;
          }
        }
        
        // Process feedback data for ratings chart
        if (feedbackData.length > 0) {
          feedbackData.forEach(feedback => {
            const rating = parseInt(feedback.rating);
            if (rating >= 1 && rating <= 5) {
              eventRatings[rating - 1]++;
            }
          });
        }
      } catch (error) {
        console.warn("Could not fetch feedback data", error);
      }
      
      // Format venue data for chart
      const formattedVenues = Object.entries(popularVenues)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 venues
      
      // Calculate growth rates
      const userGrowth = calculateGrowthRate(prevMonthUsers, currentMonthUsers);
      const eventGrowth = calculateGrowthRate(prevMonthEvents, currentMonthEvents);
      const revenueGrowth = calculateGrowthRate(prevMonthRevenue, currentMonthRevenue);
      
      // Update dashboard with real counts and calculated data
      setStats({
        totalUsers: userCount,
        totalEvents: eventCount,
        totalRevenue: totalRevenue,
        activeEvents: activeCount,
        pendingRequests: requestCount,
        
        // Include monthly data for charts
        monthly_revenue: monthlyRevenue,
        monthly_events: monthlyEvents,
        monthly_users: monthlyUsers,
        
        // Include growth rates
        growth_rates: {
          users: userGrowth,
          events: eventGrowth,
          revenue: revenueGrowth
        },
        
        // Include additional analytics data
        attendance_data: attendanceData,
        event_ratings: eventRatings,
        participation_trends: participationTrends,
        booking_time_data: bookingTimeData,
        popular_venues: formattedVenues
      });
      
      // Get upcoming events
      fetchUpcomingEvents();
      
      // Generate activity feed based on real data
      fetchRecentActivity();
      
    } catch (error) {
      console.error("Error fetching counts directly:", error);
    }
  };
  
  // Helper function to calculate growth rate
  const calculateGrowthRate = (previous, current) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0; // If previous is 0, and current is positive, 100% growth
    }
    return Math.round(((current - previous) / previous) * 100);
  };

  const fetchUpcomingEvents = async () => {
    try {
      // Get upcoming events from the events endpoint
      const response = await api.get("/events/events/");
      let events = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          events = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          events = response.data.results;
        }
      }
      
      // Filter for upcoming events
      const now = new Date();
      events = events.filter(event => {
        const eventDate = new Date(event.event_time || event.event_date);
        return eventDate >= now || event.status === 'upcoming';
      });
      
      // Sort by date and take the first 5
      events.sort((a, b) => {
        const dateA = new Date(a.event_time || a.event_date);
        const dateB = new Date(b.event_time || b.event_date);
        return dateA - dateB;
      });
      
      setUpcomingEvents(events.slice(0, 5));
      
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      setUpcomingEvents([]);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Try to get recent activity data
      const recentUsers = [];
      const recentEvents = [];
      
      // Get recent users
      try {
        const response = await api.get("/users/users/");
        if (response.data) {
          const users = Array.isArray(response.data) ? response.data : 
                       (response.data.results || []);
                       
          // Sort by created date if available
          const sortedUsers = [...users].sort((a, b) => {
            const dateA = new Date(a.date_joined || a.created_at || 0);
            const dateB = new Date(b.date_joined || b.created_at || 0);
            return dateB - dateA; // Most recent first
          });
          
          // Take the 3 most recent users
          sortedUsers.slice(0, 3).forEach(user => {
            recentUsers.push({
              type: 'user',
              message: `New user ${user.username || user.email} joined`,
              time: new Date(user.date_joined || user.created_at).toLocaleString()
            });
          });
        }
      } catch (error) {
        console.warn("Could not fetch recent users", error);
      }
      
      // Get recent events
      try {
        const response = await api.get("/events/events/");
        if (response.data) {
          const events = Array.isArray(response.data) ? response.data : 
                        (response.data.results || []);
                        
          // Sort by created date if available
          const sortedEvents = [...events].sort((a, b) => {
            const dateA = new Date(a.created_at || a.event_time || 0);
            const dateB = new Date(b.created_at || b.event_time || 0);
            return dateB - dateA; // Most recent first
          });
          
          // Take the 3 most recent events
          sortedEvents.slice(0, 3).forEach(event => {
            recentEvents.push({
              type: 'event',
              message: `Event "${event.event_name}" was ${event.status === 'upcoming' ? 'created' : event.status}`,
              time: new Date(event.created_at || event.event_time).toLocaleString()
            });
          });
        }
      } catch (error) {
        console.warn("Could not fetch recent events", error);
      }
      
      // Combine, sort, and set activity
      const allActivity = [...recentUsers, ...recentEvents].sort((a, b) => {
        return new Date(b.time) - new Date(a.time);
      });
      
      if (allActivity.length > 0) {
        setRecentActivity(allActivity);
      } else {
        // Fall back to placeholder data if we couldn't get real activity
        setRecentActivity(generatePlaceholderActivities());
      }
      
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      setRecentActivity(generatePlaceholderActivities());
    }
  };

  const generatePlaceholderActivities = () => {
    const activities = [];
    
    // Add placeholder activities based on users and events
    if (stats.totalUsers > 0) {
      activities.push({
        type: 'user',
        message: `${stats.totalUsers} total users on the platform`,
        time: new Date().toLocaleString()
      });
    }
    
    if (stats.totalEvents > 0) {
      activities.push({
        type: 'event',
        message: `${stats.totalEvents} events have been created`,
        time: new Date().toLocaleString()
      });
    }
    
    if (stats.activeEvents > 0) {
      activities.push({
        type: 'event',
        message: `${stats.activeEvents} events are currently active`,
        time: new Date().toLocaleString()
      });
    }
    
    if (stats.pendingRequests > 0) {
      activities.push({
        type: 'user',
        message: `${stats.pendingRequests} coordinator requests pending approval`,
        time: new Date().toLocaleString()
      });
    }
    
    return activities;
  };

  const fetchUserProfile = async () => {
    try {
      // Try multiple endpoints to find the one that works
      const endpoints = [
        "users/profile/",
        "api/users/me/",
        "api/profile/",
        "auth/users/me/",
        "users/me/"
      ];
      
      let userData = null;
      let succeeded = false;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch profile from ${endpoint}`);
          const response = await api.get(endpoint);
          
          if (response.data) {
            userData = response.data;
            console.log(`Successfully fetched profile from ${endpoint}`);
            succeeded = true;
            break;
          }
        } catch (error) {
          console.warn(`Failed to fetch profile from ${endpoint}:`, error);
        }
      }
      
      if (!succeeded) {
        // Last attempt with direct fetch and explicit headers
        try {
          const token = localStorage.getItem(ACCESS_TOKEN);
          const response = await fetch(`${api.defaults.baseURL}users/profile/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            userData = await response.json();
            succeeded = true;
          }
        } catch (error) {
          console.error("Final profile fetch attempt failed:", error);
        }
      }
      
      if (succeeded && userData) {
        setUserProfile(userData);
        
        // Handle profile photo URL
        if (userData.profile_photo) {
          // Set profile photo preview using full URL path when needed
          const photoUrl = userData.profile_photo.startsWith('http') 
            ? userData.profile_photo 
            : `${api.defaults.baseURL}${userData.profile_photo}`;
          
          setProfilePhotoPreview(photoUrl);
          
          // Cache the profile photo for better performance
          const img = new Image();
          img.src = photoUrl;
        }
      } else {
        throw new Error("Could not fetch profile from any endpoint");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Create a fallback profile from JWT token if possible
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
          const decoded = jwtDecode(token);
          const fallbackProfile = {
            username: decoded.username || "User",
            email: decoded.email || "",
            first_name: decoded.first_name || "",
            last_name: decoded.last_name || "",
          };
          setUserProfile(fallbackProfile);
        }
      } catch (tokenError) {
        console.error("Could not extract profile from token:", tokenError);
      }
    }
  };

  const createRevenueChart = () => {
    const ctx = chartRef.current.getContext('2d');
    
    // Default months for x-axis
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize with placeholder data
    let revenueData = [5000, 7500, 8000, 7800, 9500, 10200, 11000, 10500, 11700, 12500, 14000, 15000];
    let eventsData = [5, 7, 8, 6, 9, 10, 12, 10, 11, 13, 15, 18];
    
    // Check if we have real data from the backend
    if (stats && stats.monthly_revenue && Array.isArray(stats.monthly_revenue) && stats.monthly_revenue.length === 12) {
      // Direct array format
      revenueData = stats.monthly_revenue;
    } else if (stats && stats.monthlyRevenue && Array.isArray(stats.monthlyRevenue) && stats.monthlyRevenue.length === 12) {
      // Alternative property name
      revenueData = stats.monthlyRevenue;
    }
    
    if (stats && stats.monthly_events && Array.isArray(stats.monthly_events) && stats.monthly_events.length === 12) {
      // Direct array format
      eventsData = stats.monthly_events;
    } else if (stats && stats.monthlyEvents && Array.isArray(stats.monthlyEvents) && stats.monthlyEvents.length === 12) {
      // Alternative property name
      eventsData = stats.monthlyEvents;
    }
    
    // If we have monthly data in object format (with month/value properties)
    if (stats && stats.monthly_revenue && Array.isArray(stats.monthly_revenue) && 
        stats.monthly_revenue.length > 0 && stats.monthly_revenue.length < 12 && 
        typeof stats.monthly_revenue[0] === 'object') {
      
      // Reset array to zeros
      revenueData = new Array(12).fill(0);
      
      // Fill in data from the API
      stats.monthly_revenue.forEach(item => {
        if (item.month) {
          // Try to parse the month (could be different formats)
          let monthIndex = -1;
          
          if (typeof item.month === 'string') {
            // Try to match month name (Jan, February, etc.)
            monthIndex = months.findIndex(m => 
              item.month.toLowerCase().includes(m.toLowerCase())
            );
          } else if (item.month && item.month.month) {
            // Month might be a number (1-12)
            monthIndex = parseInt(item.month.month) - 1;
          }
          
          if (monthIndex >= 0 && monthIndex < 12) {
            revenueData[monthIndex] = parseFloat(item.value || item.revenue || item.amount || 0);
          }
        }
      });
    }
    
    // Similar processing for events data if in object format
    if (stats && stats.monthly_events && Array.isArray(stats.monthly_events) && 
        stats.monthly_events.length > 0 && stats.monthly_events.length < 12 && 
        typeof stats.monthly_events[0] === 'object') {
      
      // Reset array to zeros
      eventsData = new Array(12).fill(0);
      
      // Fill in data from the API
      stats.monthly_events.forEach(item => {
        if (item.month) {
          // Try to parse the month (could be different formats)
          let monthIndex = -1;
          
          if (typeof item.month === 'string') {
            // Try to match month name (Jan, February, etc.)
            monthIndex = months.findIndex(m => 
              item.month.toLowerCase().includes(m.toLowerCase())
            );
          } else if (item.month && item.month.month) {
            // Month might be a number (1-12)
            monthIndex = parseInt(item.month.month) - 1;
          }
          
          if (monthIndex >= 0 && monthIndex < 12) {
            eventsData[monthIndex] = parseInt(item.value || item.count || 0);
          }
        }
      });
    }
    
    // Destroy existing chart if it exists
    if (chart.current) {
      chart.current.destroy();
    }
    
    // Create new chart
    chart.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Revenue (₹)',
            data: revenueData,
            backgroundColor: 'rgba(255, 74, 23, 0.7)',
            borderColor: '#ff4a17',
            borderWidth: 1,
            yAxisID: 'y',
          },
          {
            label: 'Events',
            data: eventsData,
            type: 'line',
            backgroundColor: 'rgba(46, 204, 113, 0.2)',
            borderColor: '#2ecc71',
            borderWidth: 2,
            pointBackgroundColor: '#2ecc71',
            pointRadius: 4,
            tension: 0.3,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: {
              display: true,
              text: 'Revenue (₹)'
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: 'Number of Events'
            }
          }
        }
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem("user");
    navigate("/login_reg");
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getDayAndMonth = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' })
    };
  };
  
  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'user_registered':
        return <FaUserPlus />;
      case 'event_created':
        return <FaCalendarPlus />;
      case 'payment_received':
        return <FaMoneyBillWave />;
      case 'event_approved':
        return <FaCheck />;
      case 'event_rejected':
        return <FaTimes />;
      default:
        return <FaClock />;
    }
  };
  
  const getTimeSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval} years ago`;
    if (interval === 1) return `1 year ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval} months ago`;
    if (interval === 1) return `1 month ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `${interval} days ago`;
    if (interval === 1) return `1 day ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `${interval} hours ago`;
    if (interval === 1) return `1 hour ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return `${interval} minutes ago`;
    if (interval === 1) return `1 minute ago`;
    
    return 'Just now';
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'users':
        setActiveTab('users');
        break;
      case 'events':
        setActiveTab('events');
        break;
      case 'payments':
        setActiveTab('payments');
        break;
      case 'requests':
        setActiveTab('requests');
        break;
      case 'report':
        generateMonthlyReport();
        break;
      case 'analytics':
        generateAnalyticsPdf();
        break;
      case 'announcement':
        toast.info('Create announcement feature coming soon');
        break;
      default:
        break;
    }
  };

  const handleViewAllActivity = () => {
    setActiveTab("activity");  // Assuming you have an "activity" tab
    // Alternatively, you can create a modal or other UI element to show all activities
  };

  // Function to generate analytics PDF
  const generateAnalyticsPdf = async () => {
    try {
      setLoadingPdf(true);
      const apiKey = import.meta.env.VITE_RENDERIZE_API_KEY;
      
      if (!apiKey) {
        throw new Error("Renderize API key is missing. Please check your environment variables.");
      }
      
      const client = createClient({ 
        apiKey,
        baseApiUrl: '/renderize-api' // Use our proxy
      });
      
      // Create HTML content for the PDF
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #ff4a17; text-align: center; margin-bottom: 30px; }
              .stats-container { display: flex; flex-wrap: wrap; justify-content: space-around; margin-bottom: 40px; }
              .stat-box { 
                width: 180px; padding: 20px; margin: 10px; 
                border-radius: 10px; text-align: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              }
              .stat-box.users { background-color: #e3f2fd; }
              .stat-box.events { background-color: #e8f5e9; }
              .stat-box.revenue { background-color: #fff8e1; }
              .stat-box.active { background-color: #f3e5f5; }
              .stat-box h2 { font-size: 36px; margin: 10px 0; }
              .stat-box p { font-size: 14px; color: #666; }
              .chart-section { margin-top: 50px; }
              .chart-section h2 { margin-bottom: 20px; color: #444; }
              .footer { margin-top: 50px; text-align: center; color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>EventSphere Analytics Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            
            <div class="stats-container">
              <div class="stat-box users">
                <h2>${stats.totalUsers}</h2>
                <p>Total Users</p>
              </div>
              <div class="stat-box events">
                <h2>${stats.totalEvents}</h2>
                <p>Total Events</p>
              </div>
              <div class="stat-box revenue">
                <h2>₹${stats.totalRevenue.toLocaleString()}</h2>
                <p>Total Revenue</p>
              </div>
              <div class="stat-box active">
                <h2>${stats.activeEvents}</h2>
                <p>Active Events</p>
              </div>
            </div>
            
            <div class="chart-section">
              <h2>Upcoming Events</h2>
              <table width="100%" border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                <tr style="background-color: #f5f5f5;">
                  <th style="text-align: left;">Event Name</th>
                  <th style="text-align: left;">Date</th>
                  <th style="text-align: left;">Location</th>
                </tr>
                ${upcomingEvents.map(event => `
                  <tr>
                    <td>${event.event_name}</td>
                    <td>${new Date(event.event_time || event.event_date).toLocaleDateString()}</td>
                    <td>${event.location || 'Not specified'}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
            
            <div class="footer">
              <p>This report was generated from EventSphere Admin Dashboard</p>
            </div>
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
        a.download = `EventSphere_Analytics_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success("Analytics PDF has been generated");
      } catch (renderError) {
        console.error("PDF rendering error:", renderError);
        toast.error(`PDF generation failed: ${renderError.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error generating analytics PDF:", error);
      toast.error(`Failed to generate analytics PDF: ${error.message || "Unknown error"}`);
    } finally {
      setLoadingPdf(false);
    }
  };
  
  // Function to generate monthly report PDF
  const generateMonthlyReport = async () => {
    try {
      setLoadingPdf(true);
      const apiKey = import.meta.env.VITE_RENDERIZE_API_KEY;
      
      if (!apiKey) {
        throw new Error("Renderize API key is missing. Please check your environment variables.");
      }
      
      const client = createClient({ 
        apiKey,
        baseApiUrl: '/renderize-api' // Use our proxy
      });
      
      // Get current month name
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const currentMonth = monthNames[new Date().getMonth()];
      const currentYear = new Date().getFullYear();
      
      // Create HTML content for the monthly report
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #1e3a8a; text-align: center; margin-bottom: 10px; }
              h2 { color: #2c5282; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
              .header { text-align: center; margin-bottom: 40px; }
              .subtitle { color: #4a5568; text-align: center; margin-bottom: 40px; }
              .section { margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background-color: #f8fafc; text-align: left; padding: 12px; }
              td { padding: 10px; border-top: 1px solid #e2e8f0; }
              .summary-box { 
                background-color: #f7fafc; 
                border-left: 4px solid #4299e1; 
                padding: 15px;
                margin: 20px 0;
              }
              .footer { margin-top: 50px; text-align: center; color: #a0aec0; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>EventSphere Monthly Report</h1>
              <p class="subtitle">${currentMonth} ${currentYear}</p>
            </div>
            
            <div class="section">
              <h2>Monthly Overview</h2>
              <div class="summary-box">
                <p><strong>Total Users:</strong> ${stats.totalUsers}</p>
                <p><strong>New Events Created:</strong> ${stats.totalEvents}</p>
                <p><strong>Monthly Revenue:</strong> ₹${stats.totalRevenue.toLocaleString()}</p>
                <p><strong>Active Events:</strong> ${stats.activeEvents}</p>
                <p><strong>Pending Coordinator Requests:</strong> ${stats.pendingRequests}</p>
              </div>
            </div>
            
            <div class="section">
              <h2>Recent Activity</h2>
              <table>
                <tr>
                  <th>Activity</th>
                  <th>Time</th>
                </tr>
                ${recentActivity.map(activity => `
                  <tr>
                    <td>${activity.message}</td>
                    <td>${activity.time}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
            
            <div class="section">
              <h2>Upcoming Events</h2>
              <table>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Location</th>
                </tr>
                ${upcomingEvents.map(event => `
                  <tr>
                    <td>${event.event_name}</td>
                    <td>${new Date(event.event_time || event.event_date).toLocaleDateString()}</td>
                    <td>${event.location || 'Not specified'}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
            
            <div class="footer">
              <p>This report was automatically generated by EventSphere Admin Dashboard</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
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
        a.download = `EventSphere_Monthly_Report_${currentMonth}_${currentYear}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success("Monthly report has been generated");
      } catch (renderError) {
        console.error("PDF rendering error:", renderError);
        toast.error(`PDF generation failed: ${renderError.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error generating monthly report:", error);
      toast.error(`Failed to generate monthly report: ${error.message || "Unknown error"}`);
    } finally {
      setLoadingPdf(false);
    }
  };

  const renderOverview = () => {
    return (
      <>
        <DashboardOverview 
          stats={stats} 
          upcomingEvents={upcomingEvents} 
          recentActivity={recentActivity}
          onViewAllActivity={handleViewAllActivity}
        />
        
        <div className={styles.actionButtonsContainer} style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '1rem' }}>
          <button 
            className={styles.actionButton}
            onClick={() => handleQuickAction('analytics')}
            disabled={loadingPdf}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ff4a17',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: loadingPdf ? 'not-allowed' : 'pointer',
              opacity: loadingPdf ? 0.7 : 1
            }}
          >
            <FaFilePdf /> {loadingPdf ? 'Generating...' : 'Export Analytics PDF'}
          </button>
          
          <button 
            className={styles.actionButton}
            onClick={() => handleQuickAction('report')}
            disabled={loadingPdf}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: loadingPdf ? 'not-allowed' : 'pointer',
              opacity: loadingPdf ? 0.7 : 1
            }}
          >
            <FaFileInvoice /> {loadingPdf ? 'Generating...' : 'Generate Monthly Report'}
          </button>
        </div>
      </>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "users":
        return <UsersManagement />;
      case "events":
        return <EventsManagement />;
      case "payments":
        return <PaymentsManagement />;
      case "requests":
        return <CoordinatorRequests />;
      case "calendar":
        return <CalendarView />;
      case "profile":
        return <ProfileUpdate />;
      default:
        return null;
    }
  };

  const prepareDefaultStats = () => {
    return {
      totalUsers: 1, // Start with minimum 1 (yourself as admin)
      totalEvents: 0,
      totalRevenue: 20000, // Show some sample revenue for a better looking dashboard
      activeEvents: 0,
      pendingRequests: 0
    };
  };

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          {profilePhotoPreview ? (
            <img 
              src={profilePhotoPreview} 
              alt="Profile" 
              className={styles.userAvatar}
              style={{ width: '150px', height: '150px' }}
            />
          ) : (
            <div 
              className={styles.userAvatarPlaceholder}
              style={{ width: '150px', height: '150px', fontSize: '48px' }}
            >
              <span>
                {userProfile.first_name ? userProfile.first_name.charAt(0).toUpperCase() : ''}
                {userProfile.last_name ? userProfile.last_name.charAt(0).toUpperCase() : ''}
              </span>
            </div>
          )}
          <h2>Admin Panel</h2>
        </div>

        <nav className={styles.nav}>
          {[
            { id: "overview", icon: <FaChartLine />, label: "Overview" },
            { id: "users", icon: <FaUsers />, label: "Users" },
            { id: "events", icon: <FaCalendarAlt />, label: "Events" },
            { id: "payments", icon: <FaMoneyBillWave />, label: "Payments" },
            {
              id: "requests",
              icon: <FaBell />,
              label: "Requests",
              badge: stats.pendingRequests,
            },
            { id: "calendar", icon: <FaCalendarAlt />, label: "Calendar" },
            { id: "profile", icon: <FaUserCog />, label: "My Profile" },
          ].map((item) => (
            <button
              key={item.id}
              className={`${styles.navButton} ${
                activeTab === item.id ? styles.active : ""
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className={styles.badge}>{item.badge}</span>
              )}
            </button>
          ))}

          <button className={styles.logoutButton} onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.loader}>Loading...</div>
        ) : (
          renderContent()
        )}
      </main>
      <ToastContainer position="top-right" />
    </div>
  );
};

export default Dashboard;
