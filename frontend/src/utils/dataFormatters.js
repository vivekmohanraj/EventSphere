// Data formatters for handling various API response structures

// User data normalizer
export const normalizeUserData = (userData) => {
  if (!userData) return null;
  
  // Handle conversion of user_role values for frontend
  let userRole = userData.user_role || userData.user_type || 'user';
  
  // Handle legacy 'normal' value, convert to 'user'
  if (userRole === 'normal') {
    userRole = 'user';
  }
  
  return {
    id: userData.id,
    username: userData.username || '',
    email: userData.email || '',
    first_name: userData.first_name || '',
    last_name: userData.last_name || '',
    phone: userData.phone || '',
    user_type: userRole, // For frontend consistency we still use user_type
    is_active: userData.is_active === undefined ? true : userData.is_active,
    coordinator_request: userData.coordinator_request || false,
    date_joined: userData.created_at || userData.date_joined || new Date().toISOString(),
    profile_photo: userData.profile_photo || null
  };
};

// Event data normalizer - improved to handle backend structure
export const normalizeEventData = (eventData) => {
  if (!eventData) return null;
  
  console.log("Normalizing event data:", eventData);
  
  // Try to extract location from any possible field
  let location = '';
  if (eventData.location) {
    location = eventData.location;
  } else if (eventData.venue) {
    location = eventData.venue;
  } else if (eventData.address) {
    location = eventData.address;
  }
  
  // Determine event date from various possible fields
  let eventDate = new Date().toISOString();
  let originalEventTime = null;
  
  if (eventData.event_time) {
    eventDate = eventData.event_time;
    originalEventTime = eventData.event_time;
  } else if (eventData.event_date) {
    eventDate = eventData.event_date;
  } else if (eventData.start_date) {
    eventDate = eventData.start_date;
  } else if (eventData.start_time) {
    eventDate = eventData.start_time;
  }
  
  // Convert date string to ISO format if needed
  try {
    if (eventDate && typeof eventDate === 'string' && !eventDate.includes('T')) {
      // If it's just a date without time
      eventDate = new Date(eventDate).toISOString();
    }
  } catch (e) {
    console.warn("Date conversion error:", e);
  }
  
  // Normalize status - handle both "cancelled" (UK spelling) and "canceled" (US spelling)
  let status = eventData.status || 'upcoming';
  if (status === 'cancelled') {
    status = 'canceled'; // Convert to backend expected value
  }
  
  return {
    id: eventData.id,
    event_name: eventData.event_name || eventData.name || eventData.title || '',
    description: eventData.description || eventData.content || '',
    event_date: eventDate,
    event_time: originalEventTime || eventDate, // Keep original event_time for API consistency
    location: location,
    event_type: eventData.event_type || eventData.type || 'conference',
    capacity: parseInt(eventData.capacity) || 0,
    price: parseFloat(eventData.price) || 0,
    is_paid: eventData.is_paid || parseFloat(eventData.price) > 0,
    status: status,
    created_by: eventData.created_by || null,
    created_at: eventData.created_at || new Date().toISOString()
  };
};

// Payment data normalizer
export const normalizePaymentData = (paymentData) => {
  if (!paymentData) return null;
  
  return {
    id: paymentData.id,
    transaction_id: paymentData.transaction_id || '',
    user_name: paymentData.coordinator ? 
      `${paymentData.coordinator.first_name || ''} ${paymentData.coordinator.last_name || ''}`.trim() : 
      'Unknown User',
    user_email: paymentData.coordinator ? paymentData.coordinator.email : '',
    event_name: paymentData.event ? paymentData.event.event_name : 'Unknown Event',
    amount: parseFloat(paymentData.amount) || 0,
    date: paymentData.created_at || new Date().toISOString(),
    status: paymentData.payment_status || 'pending',
    payment_method: paymentData.payment_method || 'Online'
  };
};

// Format date for display
export const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleString();
  } catch (e) {
    return dateString;
  }
};

// Format currency for display
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}; 