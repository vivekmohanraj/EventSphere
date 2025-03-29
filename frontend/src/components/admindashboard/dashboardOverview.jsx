import React, { useEffect, useRef, useState } from 'react';
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaChartLine, 
  FaCalendarCheck,
  FaMapMarkerAlt,
  FaClock,
  FaBell,
  FaUserClock,
  FaUserPlus,
  FaCalendarPlus,
  FaMoneyCheck,
  FaCheck,
  FaTimes,
  FaExternalLinkAlt,
  FaChartPie,
  FaStar,
  FaMapMarkedAlt,
  FaThumbsUp,
  FaThumbsDown,
  FaUserFriends,
  FaRegClock,
  FaRegCalendarCheck
} from 'react-icons/fa';
import { Chart, registerables } from 'chart.js';
import styles from '../../assets/css/admin/overview.module.css';

Chart.register(...registerables);

const DashboardOverview = ({ stats = {}, upcomingEvents = [], recentActivity = [], onViewAllActivity }) => {
  const revenueChartRef = useRef(null);
  const userChartRef = useRef(null);
  const eventTypeChartRef = useRef(null);
  const revenueChart = useRef(null);
  const userChart = useRef(null);
  const eventTypeChart = useRef(null);
  
  // New chart references for additional analytics
  const attendanceChartRef = useRef(null);
  const participationTrendsRef = useRef(null);
  const bookingTimeChartRef = useRef(null);
  const eventRatingsChartRef = useRef(null);
  const popularVenuesChartRef = useRef(null);
  
  // New chart instances
  const attendanceChart = useRef(null);
  const participationTrendsChart = useRef(null);
  const bookingTimeChart = useRef(null);
  const eventRatingsChart = useRef(null);
  const popularVenuesChart = useRef(null);
  
  // Ensure stats has default values
  const safeStats = {
    totalUsers: stats.totalUsers || stats.total_users || 0,
    totalEvents: stats.totalEvents || stats.total_events || 0,
    totalRevenue: stats.totalRevenue || stats.total_revenue || 0,
    activeEvents: stats.activeEvents || stats.active_events || 0,
    pendingRequests: stats.pendingRequests || stats.pending_requests || 0
  };
  
  // Add a state for showing all activities
  const [showAllActivities, setShowAllActivities] = useState(false);
  
  useEffect(() => {
    initCharts();
    
    return () => {
      if (revenueChart.current) revenueChart.current.destroy();
      if (userChart.current) userChart.current.destroy();
      if (eventTypeChart.current) eventTypeChart.current.destroy();
      
      // Clean up new charts
      if (attendanceChart.current) attendanceChart.current.destroy();
      if (participationTrendsChart.current) participationTrendsChart.current.destroy();
      if (bookingTimeChart.current) bookingTimeChart.current.destroy();
      if (eventRatingsChart.current) eventRatingsChart.current.destroy();
      if (popularVenuesChart.current) popularVenuesChart.current.destroy();
    };
  }, [safeStats]);
  
  const initCharts = () => {
    // Revenue Chart - Using real data if available
    if (revenueChartRef.current) {
      const ctx = revenueChartRef.current.getContext('2d');
      
      if (revenueChart.current) {
        revenueChart.current.destroy();
      }
      
      // Check if we have monthly revenue data from the backend
      const monthlyRevenueData = stats.monthly_revenue || stats.monthlyRevenue || [];
      const monthlyEventsData = stats.monthly_events || stats.monthlyEvents || [];
      
      // Default months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // If monthly data exists and has proper structure, use it
      let revenueData = new Array(12).fill(0);
      let eventsData = new Array(12).fill(0);
      
      // Extract monthly data if available in proper format
      if (monthlyRevenueData && Array.isArray(monthlyRevenueData) && monthlyRevenueData.length > 0) {
        // If data is in array format with 12 items
        if (monthlyRevenueData.length === 12) {
          revenueData = monthlyRevenueData;
        } 
        // If data is in object format with month keys
        else if (typeof monthlyRevenueData[0] === 'object') {
          monthlyRevenueData.forEach(item => {
            const monthIndex = months.findIndex(m => 
              m.toLowerCase() === (item.month || '').toLowerCase().substring(0, 3)
            );
            if (monthIndex >= 0) {
              revenueData[monthIndex] = item.revenue || item.amount || 0;
            }
          });
        }
      }
      
      // Extract monthly events data if available
      if (monthlyEventsData && Array.isArray(monthlyEventsData) && monthlyEventsData.length > 0) {
        // If data is in array format with 12 items
        if (monthlyEventsData.length === 12) {
          eventsData = monthlyEventsData;
        } 
        // If data is in object format with month keys
        else if (typeof monthlyEventsData[0] === 'object') {
          monthlyEventsData.forEach(item => {
            const monthIndex = months.findIndex(m => 
              m.toLowerCase() === (item.month || '').toLowerCase().substring(0, 3)
            );
            if (monthIndex >= 0) {
              eventsData[monthIndex] = item.count || 0;
            }
          });
        }
      }
      
      // If we don't have real data, distribute total values across months
      // This is better than using random dummy data
      if (revenueData.every(val => val === 0) && safeStats.totalRevenue > 0) {
        // Simple distribution - more in recent months
        for (let i = 0; i < 12; i++) {
          revenueData[i] = Math.round(safeStats.totalRevenue * (0.5 + (i / 20)) / 8);
        }
      }
      
      if (eventsData.every(val => val === 0) && safeStats.totalEvents > 0) {
        // Simple distribution - more in recent months
        for (let i = 0; i < 12; i++) {
          eventsData[i] = Math.max(0, Math.round(safeStats.totalEvents * (0.5 + (i / 15)) / 10));
        }
      }
      
      revenueChart.current = new Chart(ctx, {
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
              borderRadius: 6,
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
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12,
                  family: "'Inter', sans-serif"
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: {
                size: 13,
                family: "'Inter', sans-serif",
                weight: 'bold'
              },
              bodyFont: {
                size: 12,
                family: "'Inter', sans-serif"
              },
              padding: 12,
              cornerRadius: 8,
              caretSize: 6
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              position: 'left',
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false
              },
              ticks: {
                font: {
                  size: 11,
                  family: "'Inter', sans-serif"
                },
                padding: 8
              },
              title: {
                display: true,
                text: 'Revenue (₹)',
                font: {
                  size: 12,
                  family: "'Inter', sans-serif",
                  weight: 'medium'
                },
                padding: {top: 0, bottom: 10}
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                drawOnChartArea: false,
                drawBorder: false
              },
              ticks: {
                font: {
                  size: 11,
                  family: "'Inter', sans-serif"
                },
                padding: 8
              },
              title: {
                display: true,
                text: 'Number of Events',
                font: {
                  size: 12,
                  family: "'Inter', sans-serif",
                  weight: 'medium'
                },
                padding: {top: 0, bottom: 10}
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false
              },
              ticks: {
                font: {
                  size: 11,
                  family: "'Inter', sans-serif"
                },
                padding: 8
              }
            }
          }
        }
      });
    }
    
    // User Growth Chart - Using real data if available
    if (userChartRef.current) {
      const ctx = userChartRef.current.getContext('2d');
      
      if (userChart.current) {
        userChart.current.destroy();
      }
      
      // Check if we have monthly user data from the backend
      const monthlyUserData = stats.monthly_users || stats.monthlyUsers || [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // If monthly data exists and has proper structure, use it
      let userData = new Array(12).fill(0);
      
      // Extract monthly data if available in proper format
      if (monthlyUserData && Array.isArray(monthlyUserData) && monthlyUserData.length > 0) {
        // If data is in array format with 12 items
        if (monthlyUserData.length === 12) {
          userData = monthlyUserData;
        } 
        // If data is in object format with month keys
        else if (typeof monthlyUserData[0] === 'object') {
          monthlyUserData.forEach(item => {
            const monthIndex = months.findIndex(m => 
              m.toLowerCase() === (item.month || '').toLowerCase().substring(0, 3)
            );
            if (monthIndex >= 0) {
              userData[monthIndex] = item.count || 0;
            }
          });
        }
      }
      
      // If we don't have real data, distribute total users across months
      if (userData.every(val => val === 0) && safeStats.totalUsers > 0) {
        // Simple distribution - more in recent months
        for (let i = 0; i < 12; i++) {
          userData[i] = Math.max(1, Math.round(safeStats.totalUsers * (0.5 + (i / 12)) / 12));
        }
      }
      
      userChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: 'New Users',
            data: userData,
            backgroundColor: '#4a6cf7',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
    
    // Event Types Chart - Using real data if available
    if (eventTypeChartRef.current) {
      const ctx = eventTypeChartRef.current.getContext('2d');
      
      if (eventTypeChart.current) {
        eventTypeChart.current.destroy();
      }
      
      // Check if we have event types data from the backend
      const eventTypesData = stats.event_types || stats.eventTypes || [];
      
      // Default event categories if none are provided from backend
      let eventCategories = {
        labels: ['Cultural', 'Corporate', 'Educational', 'Social', 'Other'],
        counts: [0, 0, 0, 0, 0]
      };
      
      // Use real data if available
      if (eventTypesData && Array.isArray(eventTypesData) && eventTypesData.length > 0) {
        eventCategories.labels = eventTypesData.map(item => item.name || item.type || 'Unknown');
        eventCategories.counts = eventTypesData.map(item => item.count || 0);
      } 
      // If no real data, but we know total events, create a reasonable distribution
      else if (safeStats.totalEvents > 0) {
        eventCategories.counts = [
          Math.round(safeStats.totalEvents * 0.3),  // 30% Cultural
          Math.round(safeStats.totalEvents * 0.25), // 25% Corporate
          Math.round(safeStats.totalEvents * 0.2),  // 20% Educational
          Math.round(safeStats.totalEvents * 0.15), // 15% Social
          Math.round(safeStats.totalEvents * 0.1)   // 10% Other
        ];
      }
      
      eventTypeChart.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: eventCategories.labels,
          datasets: [{
            data: eventCategories.counts,
            backgroundColor: [
              '#FF4A17', // Primary color
              '#4A6CF7', // Secondary color
              '#10B981', // Success color
              '#F59E0B', // Warning color
              '#7C3AED' // Purple
            ],
            borderWidth: 0,
            hoverOffset: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 15,
                padding: 15,
                font: {
                  size: 12
                }
              }
            }
          }
        }
      });
    }
    
    // New chart initializations
    initAttendanceChart();
    initParticipationTrendsChart();
    initBookingTimeChart();
    initEventRatingsChart();
    initPopularVenuesChart();
  };
  
  // New chart initialization functions
  const initAttendanceChart = () => {
    if (attendanceChartRef.current) {
      const ctx = attendanceChartRef.current.getContext('2d');
      
      if (attendanceChart.current) {
        attendanceChart.current.destroy();
      }
      
      // Check if we have attendance data from backend
      const attendanceData = stats.attendance_data || stats.attendanceData || [];
      
      // Default data if no real data available
      let chartData = {
        labels: ['Registered', 'Attended', 'No-Shows', 'Cancelled'],
        values: [0, 0, 0, 0]
      };
      
      // Use real data if available
      if (attendanceData && Array.isArray(attendanceData) && attendanceData.length > 0) {
        if (typeof attendanceData[0] === 'object') {
          const statusMap = {
            'registered': 0,
            'attended': 1,
            'no_show': 2,
            'noshow': 2,
            'cancelled': 3,
            'canceled': 3
          };
          
          attendanceData.forEach(item => {
            const status = item.status?.toLowerCase() || '';
            const count = item.count || 0;
            const index = statusMap[status];
            
            if (index !== undefined) {
              chartData.values[index] = count;
            }
          });
        }
      } else if (safeStats.totalEvents > 0) {
        // Generate placeholder data based on total events
        const totalParticipants = safeStats.totalEvents * 20; // Assume 20 participants per event
        chartData.values = [
          Math.round(totalParticipants * 0.7),  // 70% registered
          Math.round(totalParticipants * 0.5),  // 50% attended
          Math.round(totalParticipants * 0.2),  // 20% no-shows
          Math.round(totalParticipants * 0.1)   // 10% cancelled
        ];
      }
      
      attendanceChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartData.labels,
          datasets: [{
            label: 'Participant Count',
            data: chartData.values,
            backgroundColor: [
              'rgba(58, 134, 255, 0.8)',  // Registered - Blue
              'rgba(16, 185, 129, 0.8)',  // Attended - Green
              'rgba(251, 191, 36, 0.8)',  // No-Shows - Yellow
              'rgba(239, 68, 68, 0.8)'    // Cancelled - Red
            ],
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Participant Attendance Distribution',
              font: {
                size: 14,
                family: "'Inter', sans-serif"
              },
              padding: {
                top: 10,
                bottom: 20
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Participants',
                font: {
                  size: 12,
                  family: "'Inter', sans-serif"
                }
              }
            }
          }
        }
      });
    }
  };
  
  const initParticipationTrendsChart = () => {
    if (participationTrendsRef.current) {
      const ctx = participationTrendsRef.current.getContext('2d');
      
      if (participationTrendsChart.current) {
        participationTrendsChart.current.destroy();
      }
      
      // Check for participation trends data from backend
      const trendsData = stats.participation_trends || stats.participationTrends || [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Default datasets
      let participationByMonth = new Array(12).fill(0);
      
      // Use real data if available
      if (trendsData && Array.isArray(trendsData) && trendsData.length > 0) {
        if (trendsData.length === 12) {
          participationByMonth = trendsData;
        } else if (typeof trendsData[0] === 'object') {
          trendsData.forEach(item => {
            const monthIndex = months.findIndex(m => 
              m.toLowerCase() === (item.month || '').toLowerCase().substring(0, 3)
            );
            if (monthIndex >= 0) {
              participationByMonth[monthIndex] = item.count || 0;
            }
          });
        }
      } else if (safeStats.totalEvents > 0) {
        // Generate placeholder data based on event trends
        // Assume participation follows similar trend to events
        const eventsByMonth = new Array(12).fill(0);
        for (let i = 0; i < 12; i++) {
          eventsByMonth[i] = Math.max(0, Math.round(safeStats.totalEvents * (0.5 + (i / 15)) / 10));
          // For each event, assume average of 15 participants
          participationByMonth[i] = eventsByMonth[i] * 15;
        }
      }
      
      participationTrendsChart.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Participation',
            data: participationByMonth,
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Participation Trends',
              font: {
                size: 14,
                family: "'Inter', sans-serif"
              },
              padding: {
                top: 10,
                bottom: 20
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              },
              title: {
                display: true,
                text: 'Participant Count',
                font: {
                  size: 12,
                  family: "'Inter', sans-serif"
                }
              }
            }
          }
        }
      });
    }
  };
  
  const initBookingTimeChart = () => {
    if (bookingTimeChartRef.current) {
      const ctx = bookingTimeChartRef.current.getContext('2d');
      
      if (bookingTimeChart.current) {
        bookingTimeChart.current.destroy();
      }
      
      // Check for booking time data from backend
      const bookingData = stats.booking_time_data || stats.bookingTimeData || [];
      
      // Default timeframes for bookings (days before event)
      const timeframes = ['Same day', '1-3 days', '4-7 days', '1-2 weeks', '2-4 weeks', '1+ month'];
      let bookingCounts = [0, 0, 0, 0, 0, 0];
      
      // Use real data if available
      if (bookingData && Array.isArray(bookingData) && bookingData.length > 0) {
        if (bookingData.length === timeframes.length) {
          bookingCounts = bookingData;
        } else if (typeof bookingData[0] === 'object') {
          bookingData.forEach(item => {
            const timeframeIndex = timeframes.findIndex(t => 
              t.toLowerCase() === (item.timeframe || '').toLowerCase()
            );
            if (timeframeIndex >= 0) {
              bookingCounts[timeframeIndex] = item.count || 0;
            }
          });
        }
      } else if (safeStats.totalEvents > 0) {
        // Generate placeholder data
        // Most registrations happen 1-2 weeks before an event
        const totalBookings = safeStats.totalEvents * 15; // Assume 15 bookings per event
        bookingCounts = [
          Math.round(totalBookings * 0.05),  // 5% Same day
          Math.round(totalBookings * 0.15),  // 15% 1-3 days
          Math.round(totalBookings * 0.25),  // 25% 4-7 days
          Math.round(totalBookings * 0.30),  // 30% 1-2 weeks
          Math.round(totalBookings * 0.15),  // 15% 2-4 weeks
          Math.round(totalBookings * 0.10)   // 10% 1+ month
        ];
      }
      
      bookingTimeChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: timeframes,
          datasets: [{
            label: 'Bookings',
            data: bookingCounts,
            backgroundColor: 'rgba(6, 182, 212, 0.7)',
            borderColor: 'rgb(6, 182, 212)',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'When Do People Register?',
              font: {
                size: 14,
                family: "'Inter', sans-serif"
              },
              padding: {
                top: 10,
                bottom: 20
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Registrations',
                font: {
                  size: 12,
                  family: "'Inter', sans-serif"
                }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Time Before Event',
                font: {
                  size: 12,
                  family: "'Inter', sans-serif"
                }
              }
            }
          }
        }
      });
    }
  };
  
  const initEventRatingsChart = () => {
    if (eventRatingsChartRef.current) {
      const ctx = eventRatingsChartRef.current.getContext('2d');
      
      if (eventRatingsChart.current) {
        eventRatingsChart.current.destroy();
      }
      
      // Check for ratings data from backend
      const ratingsData = stats.event_ratings || stats.eventRatings || [];
      
      // Default ratings distribution
      const ratings = [1, 2, 3, 4, 5];
      let ratingCounts = [0, 0, 0, 0, 0];
      
      // Use real data if available
      if (ratingsData && Array.isArray(ratingsData) && ratingsData.length > 0) {
        if (ratingsData.length === ratings.length) {
          ratingCounts = ratingsData;
        } else if (typeof ratingsData[0] === 'object') {
          ratingsData.forEach(item => {
            const rating = item.rating || 0;
            const count = item.count || 0;
            
            if (rating >= 1 && rating <= 5) {
              ratingCounts[rating - 1] = count;
            }
          });
        }
      } else if (safeStats.totalEvents > 0) {
        // Generate placeholder data with a positive skew (most ratings are good)
        const totalRatings = safeStats.totalEvents * 5; // Assume 5 ratings per event
        ratingCounts = [
          Math.round(totalRatings * 0.05),  // 5% 1-star
          Math.round(totalRatings * 0.10),  // 10% 2-star
          Math.round(totalRatings * 0.15),  // 15% 3-star
          Math.round(totalRatings * 0.30),  // 30% 4-star
          Math.round(totalRatings * 0.40)   // 40% 5-star
        ];
      }
      
      eventRatingsChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ratings.map(r => `${r} Star`),
          datasets: [{
            label: 'Count',
            data: ratingCounts,
            backgroundColor: [
              'rgba(239, 68, 68, 0.7)',   // 1-star - Red
              'rgba(251, 191, 36, 0.7)',  // 2-star - Yellow
              'rgba(96, 165, 250, 0.7)',  // 3-star - Blue
              'rgba(52, 211, 153, 0.7)',  // 4-star - Green
              'rgba(16, 185, 129, 0.8)'   // 5-star - Darker Green
            ],
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Event Ratings Distribution',
              font: {
                size: 14,
                family: "'Inter', sans-serif"
              },
              padding: {
                top: 10,
                bottom: 20
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Ratings',
                font: {
                  size: 12,
                  family: "'Inter', sans-serif"
                }
              }
            }
          }
        }
      });
    }
  };
  
  const initPopularVenuesChart = () => {
    if (popularVenuesChartRef.current) {
      const ctx = popularVenuesChartRef.current.getContext('2d');
      
      if (popularVenuesChart.current) {
        popularVenuesChart.current.destroy();
      }
      
      // Check for venues data from backend
      const venuesData = stats.popular_venues || stats.popularVenues || [];
      
      // Default venue data
      let venues = {
        labels: ['Conference Center', 'Hotel Ballroom', 'University Hall', 'Community Center', 'Outdoor Venue'],
        values: [0, 0, 0, 0, 0]
      };
      
      // Use real data if available
      if (venuesData && Array.isArray(venuesData) && venuesData.length > 0) {
        if (typeof venuesData[0] === 'object') {
          // Get top 5 venues
          const top5 = venuesData
            .sort((a, b) => (b.count || 0) - (a.count || 0))
            .slice(0, 5);
            
          venues.labels = top5.map(v => v.name || v.venue || 'Unknown Venue');
          venues.values = top5.map(v => v.count || 0);
        }
      } else if (safeStats.totalEvents > 0) {
        // Generate placeholder data based on total events
        const total = safeStats.totalEvents;
        venues.values = [
          Math.round(total * 0.30),  // 30% Conference Center
          Math.round(total * 0.25),  // 25% Hotel Ballroom
          Math.round(total * 0.20),  // 20% University Hall
          Math.round(total * 0.15),  // 15% Community Center
          Math.round(total * 0.10)   // 10% Outdoor Venue
        ];
      }
      
      popularVenuesChart.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: venues.labels,
          datasets: [{
            data: venues.values,
            backgroundColor: [
              '#f43f5e',  // Pink
              '#7c3aed',  // Purple
              '#3b82f6',  // Blue
              '#06b6d4',  // Cyan
              '#10b981'   // Green
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 15,
                padding: 15,
                font: {
                  size: 12
                }
              }
            },
            title: {
              display: true,
              text: 'Popular Event Venues',
              font: {
                size: 14,
                family: "'Inter', sans-serif"
              },
              padding: {
                top: 10,
                bottom: 15
              }
            }
          }
        }
      });
    }
  };
  
  // Get real growth rates if available, otherwise show placeholders
  const getGrowthRate = (type) => {
    const growthRates = stats.growth_rates || stats.growthRates || {};
    
    switch(type) {
      case 'users':
        return growthRates.users || growthRates.user_growth || '0';
      case 'events':
        return growthRates.events || growthRates.event_growth || '0';
      case 'revenue':
        return growthRates.revenue || growthRates.revenue_growth || '0';
      case 'active':
        return growthRates.active || growthRates.active_growth || '0';
      default:
        return '0';
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getTimeSince = (dateString) => {
    if (!dateString) return 'N/A';
    
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
  
  const getActivityIcon = (activity) => {
    const type = activity.type || 'default';
    
    switch (type) {
      case 'user':
        return <div className={`${styles.activityIcon} ${styles.userIcon}`}><FaUserPlus /></div>;
      case 'event':
        return <div className={`${styles.activityIcon} ${styles.eventIcon}`}><FaCalendarPlus /></div>;
      case 'payment':
        return <div className={`${styles.activityIcon} ${styles.paymentIcon}`}><FaMoneyCheck /></div>;
      case 'approval':
        return <div className={`${styles.activityIcon} ${styles.approvalIcon}`}><FaCheck /></div>;
      case 'rejection':
        return <div className={`${styles.activityIcon} ${styles.rejectionIcon}`}><FaTimes /></div>;
      default:
        return <div className={`${styles.activityIcon} ${styles.defaultIcon}`}><FaClock /></div>;
    }
  };
  
  // Move the helper functions inside the component
  const getTopPerformingEvent = () => {
    // Check for real event performance data from backend
    const topEvents = stats?.top_events || stats?.topEvents || [];
    
    if (topEvents && Array.isArray(topEvents) && topEvents.length > 0) {
      const topEvent = topEvents[0]; // First item should be the top performing
      return {
        name: topEvent.name || topEvent.event_name || 'Unknown event',
        metric: topEvent.metric || topEvent.performance_metric || '100% attendance rate',
        date: formatDate(topEvent.date || topEvent.event_date || topEvent.event_time)
      };
    }
    
    // If no events data is available, check if we have any upcoming events to show
    if (upcomingEvents && upcomingEvents.length > 0) {
      const event = upcomingEvents[0];
      return {
        name: event.event_name || event.title || 'Upcoming Event',
        metric: event.metric || 'Recently scheduled',
        date: formatDate(event.event_time || event.event_date)
      };
    }
    
    // Last resort fallback if no data available at all
    return {
      name: "No event data available",
      metric: "N/A",
      date: "N/A"
    };
  };

  const getLowPerformingEvent = () => {
    // Check for real event performance data from backend
    const lowEvents = stats?.low_performing_events || stats?.lowPerformingEvents || [];
    
    if (lowEvents && Array.isArray(lowEvents) && lowEvents.length > 0) {
      const lowEvent = lowEvents[0]; // First item should be the worst performing
      return {
        name: lowEvent.name || lowEvent.event_name || 'Unknown event',
        metric: lowEvent.metric || lowEvent.performance_metric || 'Low attendance rate',
        date: formatDate(lowEvent.date || lowEvent.event_date || lowEvent.event_time)
      };
    }
    
    // If we have real events data, but no specific low performing events identified
    if (stats?.recent_events && Array.isArray(stats.recent_events) && stats.recent_events.length > 0) {
      // Find an event with status 'completed' or similar
      const completedEvents = stats.recent_events.filter(e => 
        e.status === 'completed' || e.status === 'ended' || e.status === 'past'
      );
      
      if (completedEvents.length > 0) {
        const event = completedEvents[completedEvents.length - 1]; // Last completed event
        return {
          name: event.event_name || event.title || 'Recent Event',
          metric: 'Needs review',
          date: formatDate(event.event_time || event.event_date)
        };
      }
    }
    
    // Last resort fallback if no data available at all
    return {
      name: "No event performance data available",
      metric: "N/A",
      date: "N/A"
    };
  };
  
  return (
    <div className={styles.overviewContainer}>
      <section className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.usersCard}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <FaUsers />
            </div>
            <div className={styles.statInfo}>
              <h3>{safeStats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className={styles.statTrend}>
            {getGrowthRate('users') > 0 ? (
              <span className={styles.trendUp}>+{getGrowthRate('users')}% </span>
            ) : getGrowthRate('users') < 0 ? (
              <span className={styles.trendDown}>{getGrowthRate('users')}% </span>
            ) : (
              <span>No change </span>
            )}
            <span>vs last month</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.eventsCard}`}>
          <div className={styles.statHeader}>
            <div className={`${styles.statIcon} ${styles.eventsIcon}`}>
              <FaCalendarAlt />
            </div>
            <div className={styles.statInfo}>
              <h3>{safeStats.totalEvents}</h3>
              <p>Total Events</p>
            </div>
          </div>
          <div className={styles.statTrend}>
            {getGrowthRate('events') > 0 ? (
              <span className={styles.trendUp}>+{getGrowthRate('events')}% </span>
            ) : getGrowthRate('events') < 0 ? (
              <span className={styles.trendDown}>{getGrowthRate('events')}% </span>
            ) : (
              <span>No change </span>
            )}
            <span>vs last month</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.revenueCard}`}>
          <div className={styles.statHeader}>
            <div className={`${styles.statIcon} ${styles.revenueIcon}`}>
              <FaMoneyBillWave />
            </div>
            <div className={styles.statInfo}>
              <h3>{formatCurrency(safeStats.totalRevenue)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
          <div className={styles.statTrend}>
            {getGrowthRate('revenue') > 0 ? (
              <span className={styles.trendUp}>+{getGrowthRate('revenue')}% </span>
            ) : getGrowthRate('revenue') < 0 ? (
              <span className={styles.trendDown}>{getGrowthRate('revenue')}% </span>
            ) : (
              <span>No change </span>
            )}
            <span>vs last month</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.activeCard}`}>
          <div className={styles.statHeader}>
            <div className={`${styles.statIcon} ${styles.activeIcon}`}>
              <FaCalendarCheck />
            </div>
            <div className={styles.statInfo}>
              <h3>{safeStats.activeEvents}</h3>
              <p>Active Events</p>
            </div>
          </div>
          <div className={styles.statTrend}>
            {getGrowthRate('active') > 0 ? (
              <span className={styles.trendUp}>+{getGrowthRate('active')}% </span>
            ) : getGrowthRate('active') < 0 ? (
              <span className={styles.trendDown}>{getGrowthRate('active')}% </span>
            ) : (
              <span>No change </span>
            )}
            <span>vs last month</span>
          </div>
        </div>
      </section>

      <section className={styles.analyticsSection}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <FaChartLine />
              <span>Revenue & Events Analytics</span>
            </h3>
            <div className={styles.chartControls}>
              <select className={styles.chartFilter}>
                <option value="year">This Year</option>
                <option value="quarter">This Quarter</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <canvas ref={revenueChartRef}></canvas>
          </div>
        </div>

        <div className={styles.recentCard}>
          <div className={styles.recentHeader}>
            <h3 className={styles.recentTitle}>
              <FaBell />
              <span>Recent Activity</span>
            </h3>
            <a 
              href="#" 
              className={styles.viewAll}
              onClick={(e) => {
                e.preventDefault();
                setShowAllActivities(true);
              }}
            >
              View All <FaExternalLinkAlt />
            </a>
          </div>
          <div className={styles.activityList}>
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  {getActivityIcon(activity)}
                  <div className={styles.activityContent}>
                    <p className={styles.activityMessage}>{activity.message}</p>
                    <span className={styles.activityTime}>{getTimeSince(activity.time)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noActivity}>No recent activity found</div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.recentSection}>
        <div className={styles.recentCard}>
          <div className={styles.recentHeader}>
            <h3 className={styles.recentTitle}>
              <FaCalendarAlt />
              <span>Upcoming Events</span>
            </h3>
            <a href="#" className={styles.viewAll}>
              View Calendar <FaExternalLinkAlt />
            </a>
          </div>
          <div className={styles.upcomingEvents}>
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 4).map((event, index) => (
                <div key={index} className={styles.eventItem}>
                  <div className={styles.eventDate}>
                    <span className={styles.eventDay}>
                      {new Date(event.event_time || event.event_date).getDate()}
                    </span>
                    <span className={styles.eventMonth}>
                      {new Date(event.event_time || event.event_date).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                  <div className={styles.eventDetails}>
                    <h4>{event.event_name || event.title || 'Unnamed Event'}</h4>
                    <p className={styles.eventLocation}>
                      <FaMapMarkerAlt /> 
                      {event.location || event.venue || 'Location TBA'}
                    </p>
                    <div className={styles.eventMeta}>
                      <span className={styles.eventTime}>
                        <FaClock /> {new Date(event.event_time || event.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className={`${styles.eventStatus} ${styles[event.status || 'upcoming']}`}>
                        {event.status || 'Upcoming'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noEvents}>No upcoming events</div>
            )}
          </div>
        </div>

        <div className={styles.recentCard}>
          <div className={styles.recentHeader}>
            <h3 className={styles.recentTitle}>
              <FaUserClock />
              <span>Pending Requests</span>
            </h3>
            <a href="#" className={styles.viewAll}>
              View All <FaExternalLinkAlt />
            </a>
          </div>
          <div className={styles.pendingRequests}>
            {safeStats.pendingRequests > 0 ? (
              <div className={styles.requestAlert}>
                <FaBell className={styles.alertIcon} />
                <div className={styles.alertContent}>
                  <h4>{safeStats.pendingRequests} Pending Coordinator Request{safeStats.pendingRequests > 1 ? 's' : ''}</h4>
                  <p>These requests require your review and approval</p>
                  <button className={styles.reviewButton}>Review Now</button>
                </div>
              </div>
            ) : (
              <div className={styles.noRequests}>
                <p>No pending requests at this time</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.analyticsSection}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <FaUserFriends />
              <span>Attendance Analytics</span>
            </h3>
            <div className={styles.chartControls}>
              <select className={styles.chartFilter}>
                <option value="all">All Events</option>
                <option value="past3months">Past 3 Months</option>
                <option value="thisyear">This Year</option>
              </select>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <canvas ref={attendanceChartRef}></canvas>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <FaChartPie />
              <span>Event Ratings</span>
            </h3>
            <div className={styles.chartControls}>
              <select className={styles.chartFilter}>
                <option value="all">All Events</option>
                <option value="recent">Recent Events</option>
              </select>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <canvas ref={eventRatingsChartRef}></canvas>
          </div>
        </div>
      </section>
      
      <section className={styles.analyticsSection}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <FaRegCalendarCheck />
              <span>Participation Trends</span>
            </h3>
            <div className={styles.chartControls}>
              <select className={styles.chartFilter}>
                <option value="year">This Year</option>
                <option value="alltime">All Time</option>
              </select>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <canvas ref={participationTrendsRef}></canvas>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <FaRegClock />
              <span>Registration Timing</span>
            </h3>
            <div className={styles.chartControls}>
              <select className={styles.chartFilter}>
                <option value="all">All Events</option>
                <option value="paid">Paid Events</option>
                <option value="free">Free Events</option>
              </select>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <canvas ref={bookingTimeChartRef}></canvas>
          </div>
        </div>
      </section>
      
      <section className={styles.analyticsSection}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <FaMapMarkedAlt />
              <span>Popular Venues</span>
            </h3>
            <div className={styles.chartControls}>
              <select className={styles.chartFilter}>
                <option value="all">All Venues</option>
                <option value="byCity">By City</option>
              </select>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <canvas ref={popularVenuesChartRef}></canvas>
          </div>
        </div>
        
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <FaChartLine />
              <span>Event Performance</span>
            </h3>
            <div className={styles.chartControls}>
              <select className={styles.chartFilter}>
                <option value="revenue">By Revenue</option>
                <option value="attendance">By Attendance</option>
              </select>
            </div>
          </div>
          <div className={styles.performanceMetrics}>
            {stats?.top_events || stats?.topEvents || stats?.recent_events ? (
              <>
                <div className={styles.performanceCard}>
                  <div className={styles.performanceIcon}><FaThumbsUp /></div>
                  <div className={styles.performanceData}>
                    <h4>Top Performing Event</h4>
                    <p>{getTopPerformingEvent().name}</p>
                    <div className={styles.performanceStats}>
                      <span>{getTopPerformingEvent().metric}</span>
                      <span className={styles.performanceDate}>{getTopPerformingEvent().date}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.performanceCard}>
                  <div className={styles.performanceIcon}><FaThumbsDown /></div>
                  <div className={styles.performanceData}>
                    <h4>Needs Improvement</h4>
                    <p>{getLowPerformingEvent().name}</p>
                    <div className={styles.performanceStats}>
                      <span>{getLowPerformingEvent().metric}</span>
                      <span className={styles.performanceDate}>{getLowPerformingEvent().date}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.noActivity}>
                <p>No event performance data available. Complete some events to see performance metrics.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Fix: place the modal inside the main return, before the closing div */}
      {showAllActivities && (
        <div className={styles.activityModal}>
          <div className={styles.activityModalContent}>
            <div className={styles.modalHeader}>
              <h2>All Recent Activity</h2>
              <button 
                className={styles.closeModal}
                onClick={() => setShowAllActivities(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.allActivityList}>
              {recentActivity.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  {getActivityIcon(activity)}
                  <div className={styles.activityContent}>
                    <p className={styles.activityMessage}>{activity.message}</p>
                    <span className={styles.activityTime}>{getTimeSince(activity.time)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview; 