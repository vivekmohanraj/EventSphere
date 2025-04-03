import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FaImage, FaCalendar, FaClock, FaTrash, FaInfoCircle, FaTags, FaFolder, FaCheck } from "react-icons/fa";
import api from "../utils/api";
import styles from "../assets/css/eventCreation.module.css";
import Modal from "react-bootstrap/Modal";

const EventCreation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVenueDetails, setShowVenueDetails] = useState(false);
  const [venueAvailability, setVenueAvailability] = useState({});
  
  // Initialize tags with default values 
  const [tags, setTags] = useState([
    { id: 1, name: 'Technology' },
    { id: 2, name: 'Business' },
    { id: 3, name: 'Education' },
    { id: 4, name: 'Entertainment' },
    { id: 5, name: 'Food & Drink' },
    { id: 6, name: 'Health & Wellness' },
    { id: 7, name: 'Music' },
    { id: 8, name: 'Sports & Fitness' },
    { id: 9, name: 'Networking' },
    { id: 10, name: 'Family Friendly' }
  ]);
  const [selectedTags, setSelectedTags] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });

  const isPaid = watch("is_paid");
  const eventDate = watch("event_date");
  const limitedCapacity = watch("limited_capacity");
  const EVENT_TYPES = [
    { value: "conference", label: "Conference" },
    { value: "workshop", label: "Workshop" },
    { value: "seminar", label: "Seminar" },
    { value: "concert", label: "Concert" },
    { value: "birthday", label: "Birthday Party" },
    { value: "wedding", label: "Wedding" },
    { value: "corporate", label: "Corporate Event" },
    { value: "other", label: "Other" },
  ];

  const [formData, setFormData] = useState({
    organizer_info: '',
    organizer_website: '',
    organizer_email: '',
    organizer_phone: '',
    organizer_social: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: ''
    }
  });

  // Get user from localStorage instead of auth context
  const [user, setUser] = useState(null);
  useEffect(() => {
    const userFromStorage = JSON.parse(localStorage.getItem('user'));
    setUser(userFromStorage);
  }, []);
  
  const [unavailableVenues, setUnavailableVenues] = useState([]);
  const [venueDetailsModal, setVenueDetailsModal] = useState(false);
  const [selectedVenueDetails, setSelectedVenueDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [bookingHours, setBookingHours] = useState(3);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsRes = await api.get('/events/tags/');
        if (tagsRes.data && tagsRes.data.length > 0) {
          // If we get valid data from API, use it
          setTags(tagsRes.data);
        } else {
          // If API returns empty array, quietly use defaults
          console.log('Using default tags (empty API response)');
        }
      } catch (error) {
        // Only log detailed errors if not a 404
        if (error.response?.status !== 404) {
          console.error('Error loading tags:', error);
        } else {
          console.log('Tags endpoint not available, using default tags');
        }
      }
    };
    
    fetchTags();
    fetchVenues();
  }, []);

  // Fetch venues from backend
  const fetchVenues = async () => {
    try {
      setLoadingVenues(true);
      // Try to fetch from actual venue endpoint
      const response = await api.get('/events/venues/');
      setVenues(response.data);
    } catch (error) {
      // Only log error details in development mode, not for 404 errors
      if (error.response?.status !== 404) {
        console.error('Error fetching venues:', error);
      } else {
        // For 404, just note that we're using fallback data without error details
        console.log('Venues endpoint not available, using sample data');
      }
      
      // If the endpoint doesn't exist or fails, use sample data
      setVenues([
        {
          id: 1,
          name: 'Corporate Executive Center',
          address: '123 Business Park, Financial District',
          capacity: 300,
          price_per_hour: 5000,
          description: 'Professional venue with advanced presentation technology, perfect for conferences, seminars, and corporate meetings.',
          image_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1469&q=80',
          features: ['Conference Tables', 'Stage', 'Projectors', 'Microphones', 'Wi-Fi', 'Catering Available', 'Parking']
        },
        {
          id: 2,
          name: 'Workshop Studio',
          address: '456 Creative Lane, Arts District',
          capacity: 50,
          price_per_hour: 2500,
          description: 'Flexible space designed for interactive workshops and small seminars. Includes workstations and creative breakout areas.',
          image_url: 'https://images.stockcake.com/public/b/5/f/b5fd8cec-afa5-4237-b1e7-f9569d27e14c/busy-tech-workshop-stockcake.jpg',
          features: ['Workstations', 'Whiteboards', 'Materials Storage', 'Natural Lighting', 'Video Recording']
        },
        {
          id: 3,
          name: 'Grand Ballroom',
          address: '789 Celebration Avenue, City Center',
          capacity: 400,
          price_per_hour: 7500,
          description: 'Elegant ballroom with crystal chandeliers, perfect for weddings, large corporate events, and formal celebrations.',
          image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80',
          features: ['Dance Floor', 'Stage', 'Professional Lighting', 'Bridal Suite', 'Full-Service Bar', 'Catering Kitchen']
        },
        {
          id: 4,
          name: 'Rooftop Concert Space',
          address: '101 Skyline Drive, Entertainment District',
          capacity: 200,
          price_per_hour: 6000,
          description: 'Urban rooftop venue with state-of-the-art sound system and panoramic city views, ideal for concerts and music events.',
          image_url: 'https://images.stockcake.com/public/0/3/0/030a274e-47e8-487e-9129-544289c369a3_large/sunset-rooftop-concert-stockcake.jpg',
          features: ['Professional Sound System', 'Lighting Rig', 'Green Room', 'Bar Service', 'Weather Protection']
        },
        {
          id: 5,
          name: 'Kids Party Palace',
          address: '222 Fun Street, Family Zone',
          capacity: 80,
          price_per_hour: 3000,
          description: 'Colorful and safe space designed for children\'s birthday parties with entertainment options and themed decoration packages.',
          image_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
          features: ['Play Area', 'Theme Decorations', 'Entertainment Options', 'Party Rooms', 'Catering for Kids']
        },
        {
          id: 6,
          name: 'Garden Terrace',
          address: '333 Park Lane, Green Hills',
          capacity: 150,
          price_per_hour: 4000,
          description: 'Beautiful outdoor venue with lush gardens and pergola, perfect for weddings, birthday celebrations, and garden parties.',
          image_url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1469&q=80',
          features: ['Outdoor Space', 'Wedding Arch', 'Garden Lighting', 'Weather Backup Plan', 'Scenic Photo Spots']
        }
      ]);
    } finally {
      setLoadingVenues(false);
    }
  };

  // Check venue availability when date changes
  useEffect(() => {
    if (eventDate) {
      checkVenueAvailability(eventDate);
    }
  }, [eventDate]);

  const checkVenueAvailability = async (date) => {
    try {
      // In a real app, this would be an API call to check availability
      // For demo purposes, we'll simulate random availability
      const availability = {};
      venues.forEach(venue => {
        // Random availability (80% chance of being available)
        availability[venue.id] = Math.random() > 0.2;
      });
      setVenueAvailability(availability);
    } catch (error) {
      console.error('Error checking venue availability:', error);
    }
  };

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    setValue('venue', venue.name);
    setValue('venue_id', venue.id);
  };

  const handleVenueDetailsClick = (venue) => {
    setSelectedVenue(venue);
    setShowVenueDetails(true);
  };

  const isVenueAvailable = (venueId) => {
    return venueAvailability[venueId] !== false; // Default to available if not checked
  };

  const handleTagChange = (tagId) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      }
      return [...prev, tagId];
    });
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} exceeds the 5MB file size limit`);
        return false;
      }
      return true;
    });

    setSelectedPhotos((prev) => [...prev, ...validFiles]);

    // Create previews for new files
    const newPreviews = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      photoPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [photoPreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    const platform = name.split('.')[1]; // Get platform from name (e.g., "organizer_social.facebook" -> "facebook")
    
    setFormData(prev => ({
      ...prev,
      organizer_social: {
        ...prev.organizer_social,
        [platform]: value
      }
    }));
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Format data for API
      const eventData = {
        ...data,
        tags: selectedTags,
        venue: selectedVenue ? selectedVenue.name : data.custom_venue,
        venue_id: selectedVenue ? selectedVenue.id : null,
        organizer_social: {
          facebook: data.facebook_url || "",
          twitter: data.twitter_url || "",
          instagram: data.instagram_url || "",
          linkedin: data.linkedin_url || "",
        },
      };
      
      // Create the event
      const response = await api.post("/events/", eventData);
      const createdEvent = response.data;
      setEventData(createdEvent);
      
      // Handle photo uploads if any
      if (photoPreviews.length > 0) {
        for (const preview of photoPreviews) {
          const photoData = new FormData();
          photoData.append("event", createdEvent.id);
          photoData.append("photo_url", preview.file);
          await api.post("/events/photos/", photoData);
        }
      }
      
      // Check if payment is required (for coordinators)
      if (user?.user_role === "coordinator" && createdEvent.payment_required) {
        // If payment is required, create a payment
        if (selectedVenue) {
          const paymentResponse = await api.post("/payments/", {
            event: createdEvent.id,
            venue: selectedVenue.id,
            booking_hours: bookingHours
          });
          
          setPaymentData(paymentResponse.data);
          // Show payment modal
          setShowPaymentModal(true);
        } else {
          // If no venue is selected, create a minimum payment or use a default venue
          const paymentResponse = await api.post("/payments/", {
            event: createdEvent.id,
            booking_hours: 1
          });
          
          setPaymentData(paymentResponse.data);
          // Show payment modal
          setShowPaymentModal(true);
        }
      } else {
        // If no payment is required, show success message and redirect
        toast.success("Event created successfully!");
        navigate(`/events/${createdEvent.id}`);
      }
    } catch (error) {
      console.error("Event creation error:", error);
      toast.error(error.response?.data?.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePaymentSuccess = async (paymentId, orderId, signature) => {
    try {
      // Verify payment with backend
      await api.post(`/payments/verify/`, {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        payment_id: paymentData.id
      });
      
      toast.success("Payment successful! Event created.");
      setShowPaymentModal(false);
      
      // Navigate to event details page
      navigate(`/events/${eventData.id}`);
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Payment verification failed. Please contact support.");
    }
  };
  
  const handlePaymentFailure = (error) => {
    console.error("Payment failed:", error);
    toast.error("Payment failed. Your event is saved as draft.");
    
    // Close payment modal
    setShowPaymentModal(false);
    
    // Navigate to dashboard to see draft events
    navigate("/dashboard");
  };
  
  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      
      script.onload = () => {
        resolve(true);
      };
      
      script.onerror = () => {
        resolve(false);
        toast.error("Razorpay SDK failed to load");
      };
      
      document.body.appendChild(script);
    });
  };
  
  const openRazorpayCheckout = async () => {
    const res = await initializeRazorpay();
    
    if (!res) {
      toast.error("Razorpay SDK failed to load");
      return;
    }
    
    const options = {
      key: paymentData.payment_details.key_id,
      amount: paymentData.amount * 100, // Amount in paise
      currency: paymentData.payment_details.currency || "INR",
      name: "EventSphere",
      description: `Payment for event: ${eventData.event_name}`,
      order_id: paymentData.razorpay_order_id,
      handler: function (response) {
        handlePaymentSuccess(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );
      },
      prefill: {
        name: user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
        email: user?.email || '',
        contact: user?.phone || ""
      },
      theme: {
        color: "#6c5ce7"
      },
      modal: {
        ondismiss: function() {
          toast.warning("Payment canceled. Your event is saved as draft.");
          navigate("/dashboard");
        }
      }
    };
    
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  return (<>
    <div className={styles.dummy}></div>
    <div className={styles.pageContainer}>
      <div className={styles.createEventContainer}>
        <div className={styles.formWrapper}>
          <div className={styles.formHeader}>
            <h1>Create New Event</h1>
            <p>Fill in the details below to create your event</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Basic Information Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Basic Information</h3>
              
              <div className={styles.formGroup}>
                <label>Event Name <span className={styles.required}>*</span></label>
                <input
                  {...register("event_name", {
                    required: "Event name is required",
                    maxLength: {
                      value: 255,
                      message: "Event name cannot exceed 255 characters"
                    }
                  })}
                  placeholder="Enter a clear and descriptive name"
                  className={errors.event_name ? styles.inputError : ""}
                />
                {errors.event_name && (
                  <span className={styles.error}>
                    {errors.event_name.message}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Event Type <span className={styles.required}>*</span></label>
                <select
                  {...register("event_type", {
                    required: "Event type is required",
                  })}
                  className={errors.event_type ? styles.inputError : ""}
                >
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.event_type && (
                  <span className={styles.error}>
                    {errors.event_type.message}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Tags</label>
                {tags && tags.length > 0 ? (
                  <div className={styles.tagsGrid}>
                    {tags.map(tag => (
                      <div 
                        key={tag.id} 
                        className={`${styles.tagOption} ${selectedTags.includes(tag.id) ? styles.selectedTag : ''}`}
                        onClick={() => handleTagChange(tag.id)}
                      >
                        <label className={styles.tagLabel}>
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag.id)}
                            onChange={() => {}} // Handled by parent div's onClick
                            onClick={(e) => e.stopPropagation()} // Prevent double toggle when clicking checkbox directly
                          />
                          <span className={styles.tagText}>{tag.name}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.loadingTags}>Loading tag options...</div>
                )}
                <div className={styles.helpText}>
                  <FaTags />
                  <span>Select relevant tags to help people find your event</span>
                </div>
                {selectedTags.length > 0 && (
                  <div className={styles.selectedTagsCount}>
                    <FaCheck />
                    {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  {...register("description")}
                  placeholder="Provide details about your event, including what attendees can expect"
                  rows="4"
                />
                <small className={styles.helpText}>
                  <FaInfoCircle /> A detailed description helps attendees understand what to expect
                </small>
              </div>

              <div className={styles.formGroup}>
                <label>Target Audience</label>
                <textarea
                  {...register("audience")}
                  placeholder="Who is this event for? (e.g., Students, Professionals, All ages)"
                  rows="2"
                />
              </div>
            </div>

            {/* Date and Time Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Date and Time</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Event Date <span className={styles.required}>*</span></label>
                  <div className={styles.inputWithIcon}>
                    <FaCalendar className={styles.inputIcon} />
                    <input
                      type="date"
                      {...register("event_date", {
                        required: "Event date is required",
                      })}
                      className={errors.event_date ? styles.inputError : ""}
                    />
                  </div>
                  {errors.event_date && (
                    <span className={styles.error}>
                      {errors.event_date.message}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Event Time <span className={styles.required}>*</span></label>
                  <div className={styles.inputWithIcon}>
                    <FaClock className={styles.inputIcon} />
                    <input
                      type="time"
                      {...register("event_time", {
                        required: "Event time is required",
                      })}
                      className={errors.event_time ? styles.inputError : ""}
                    />
                  </div>
                  {errors.event_time && (
                    <span className={styles.error}>
                      {errors.event_time.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Registration Options Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Registration Options</h3>
              
              <div className={styles.optionsGroup}>
                <div className={styles.option}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" {...register("is_paid")} />
                    <span className={styles.checkboxText}>This is a paid event</span>
                  </label>
                </div>

                <div className={styles.option}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" {...register("rsvp_required")} />
                    <span className={styles.checkboxText}>Require RSVP</span>
                  </label>
                </div>
                
                <div className={styles.option}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" {...register("limited_capacity")} />
                    <span className={styles.checkboxText}>Limit number of attendees</span>
                  </label>
                </div>
              </div>

              {isPaid && (
                <div className={styles.formGroup}>
                  <label>Price (₹) <span className={styles.required}>*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("price", {
                      required: isPaid ? "Price is required for paid events" : false,
                      min: { value: 0, message: "Price cannot be negative" },
                      validate: value => 
                        !isPaid || (value && parseFloat(value) > 0) || "Price must be greater than zero"
                    })}
                    placeholder="Enter ticket price"
                    className={errors.price ? styles.inputError : ""}
                  />
                  {errors.price && (
                    <span className={styles.error}>{errors.price.message}</span>
                  )}
                </div>
              )}
              
              {limitedCapacity && (
                <div className={styles.formGroup}>
                  <label>Maximum Attendees <span className={styles.required}>*</span></label>
                  <input
                    type="number"
                    {...register("max_participants", {
                      required: limitedCapacity ? "Maximum attendees is required" : false,
                      min: { value: 1, message: "Maximum attendees must be at least 1" },
                      validate: value => 
                        !limitedCapacity || (value && parseInt(value) > 0) || "Maximum attendees must be greater than zero"
                    })}
                    placeholder="Enter maximum number of attendees"
                    className={errors.max_participants ? styles.inputError : ""}
                  />
                  {errors.max_participants && (
                    <span className={styles.error}>{errors.max_participants.message}</span>
                  )}
                  <small className={styles.helpText}>
                    <FaInfoCircle /> Once this limit is reached, registrations will automatically close
                  </small>
                </div>
              )}
            </div>

            {/* Event Photos Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Event Photos</h3>
              
              <div className={styles.photoUploadSection}>
                <div className={styles.photoUpload}>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png"
                    onChange={handlePhotoChange}
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className={styles.uploadButton}>
                    <FaImage /> Choose Photos
                  </label>
                  <p className={styles.uploadInfo}>
                    Upload up to 5 images (JPG, PNG, max 5MB each)
                  </p>
                </div>

                {photoPreviews.length > 0 && (
                  <div className={styles.previewGrid}>
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className={styles.previewItem}>
                        <img src={preview.url} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className={styles.removePhoto}
                          title="Remove photo"
                        >
                          <FaTrash />
                        </button>
                        <span className={styles.photoName}>{preview.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Venue Selection Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Venue Selection</h3>
              
              {!eventDate && (
                <div className={styles.venueWarning}>
                  <FaInfoCircle />
                  <span>Please select an event date first to check venue availability</span>
                </div>
              )}
              
              {loadingVenues ? (
                <div className={styles.venueLoading}>Loading venues...</div>
              ) : (
                <div className={styles.venuesGrid}>
                  {venues.map((venue) => (
                    <div 
                      key={venue.id} 
                      className={`${styles.venueCard} ${selectedVenue?.id === venue.id ? styles.selectedVenue : ''} ${!isVenueAvailable(venue.id) && eventDate ? styles.unavailableVenue : ''}`}
                      onClick={() => isVenueAvailable(venue.id) && handleVenueSelect(venue)}
                    >
                      <div 
                        className={styles.venueImage}
                        style={{ backgroundImage: `url(${venue.image_url})` }}
                      >
                        {eventDate && (
                          <span className={`${styles.availabilityTag} ${isVenueAvailable(venue.id) ? styles.availableTag : styles.unavailableTag}`}>
                            {isVenueAvailable(venue.id) ? 'Available' : 'Unavailable'}
                          </span>
                        )}
                      </div>
                      <div className={styles.venueInfo}>
                        <h4>{venue.name}</h4>
                        <div className={styles.venueDetails}>
                          <p><strong>Capacity:</strong> {venue.capacity} people</p>
                          <p><strong>Price:</strong> ₹{venue.price_per_hour}/hour</p>
                        </div>
                        <div className={styles.venueActions}>
                          <button 
                            type="button" 
                            className={styles.venueDetailsBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVenueDetailsClick(venue);
                            }}
                          >
                            View Details
                          </button>
                          {isVenueAvailable(venue.id) && (
                            <button 
                              type="button" 
                              className={styles.selectVenueBtn}
                              onClick={() => handleVenueSelect(venue)}
                            >
                              {selectedVenue?.id === venue.id ? 'Selected' : 'Select'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedVenue && (
                <div className={styles.selectedVenueInfo}>
                  <h4>Selected Venue: {selectedVenue.name}</h4>
                  <input
                    type="hidden"
                    {...register("venue")}
                    value={selectedVenue.name}
                  />
                  <input
                    type="hidden"
                    {...register("venue_id")}
                    value={selectedVenue.id}
                  />
                </div>
              )}
            </div>

            {/* Venue Details Modal */}
            {showVenueDetails && selectedVenue && (
              <div className={styles.venueModalBackdrop}>
                <div className={styles.venueModal}>
                  <button 
                    className={styles.closeBtn}
                    onClick={() => setShowVenueDetails(false)}
                  >
                    &times;
                  </button>
                  <div 
                    className={styles.venueModalHeader}
                    style={{ backgroundImage: `url(${selectedVenue.image_url})` }}
                  >
                    <h3>{selectedVenue.name}</h3>
                  </div>
                  <div className={styles.venueModalContent}>
                    <div className={styles.venueModalSection}>
                      <h4>Details</h4>
                      <p>{selectedVenue.description}</p>
                      <p><strong>Address:</strong> {selectedVenue.address}</p>
                      <p><strong>Capacity:</strong> {selectedVenue.capacity} people</p>
                      <p><strong>Price:</strong> ₹{selectedVenue.price_per_hour} per hour</p>
                    </div>
                    <div className={styles.venueModalSection}>
                      <h4>Features & Amenities</h4>
                      <div className={styles.featuresList}>
                        {selectedVenue.features.map((feature, index) => (
                          <span key={index} className={styles.featureTag}>{feature}</span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.venueModalActions}>
                      <button 
                        type="button" 
                        className={styles.selectVenueModalBtn}
                        onClick={() => {
                          handleVenueSelect(selectedVenue);
                          setShowVenueDetails(false);
                        }}
                        disabled={!isVenueAvailable(selectedVenue.id)}
                      >
                        {isVenueAvailable(selectedVenue.id) 
                          ? (selectedVenue.id === selectedVenue?.id ? 'Selected' : 'Select This Venue')
                          : 'Unavailable On Selected Date'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organizer Information Section */}
            <div className={styles.formSection}>
              <h3>Organizer Information</h3>
              <div className={styles.formGroup}>
                <label htmlFor="organizer_info">About the Organizer</label>
                <textarea
                  id="organizer_info"
                  name="organizer_info"
                  value={formData.organizer_info}
                  onChange={handleChange}
                  placeholder="Tell attendees about the organizer..."
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="organizer_website">Website</label>
                <input
                  type="url"
                  id="organizer_website"
                  name="organizer_website"
                  value={formData.organizer_website}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="organizer_email">Contact Email</label>
                <input
                  type="email"
                  id="organizer_email"
                  name="organizer_email"
                  value={formData.organizer_email}
                  onChange={handleChange}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="organizer_phone">Contact Phone</label>
                <input
                  type="tel"
                  id="organizer_phone"
                  name="organizer_phone"
                  value={formData.organizer_phone}
                  onChange={handleChange}
                />
              </div>
              
              <h4>Social Media Links</h4>
              <div className={styles.socialLinks}>
                {Object.entries(formData.organizer_social).map(([platform, url]) => (
                  <div key={platform} className={styles.formGroup}>
                    <label htmlFor={`social_${platform}`}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</label>
                    <input
                      type="url"
                      id={`social_${platform}`}
                      name={`organizer_social.${platform}`}
                      value={url}
                      onChange={handleSocialChange}
                      placeholder={`${platform} URL`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.submitSection}>
              <button
                type="submit"
                className={styles.submitButton}
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className={styles.spinnerSmall}></div>
                    Processing...
                  </>
                ) : (
                  "Create Event"
                )}
              </button>
              <Link to="/dashboard" className={styles.cancelButton}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    {/* Payment Modal */}
    <Modal
      show={showPaymentModal}
      onHide={() => {
        setShowPaymentModal(false);
        navigate("/dashboard");
      }}
      centered
      className={styles.paymentModal}
    >
      <Modal.Header closeButton>
        <Modal.Title>Complete Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={styles.paymentDetails}>
          <h4>Your event has been created as a draft</h4>
          <p>To publish your event, please complete the payment:</p>
          
          <div className={styles.paymentSummary}>
            <div className={styles.paymentItem}>
              <span>Event Name:</span>
              <span>{eventData?.event_name}</span>
            </div>
            {selectedVenue && (
              <div className={styles.paymentItem}>
                <span>Venue:</span>
                <span>{selectedVenue.name}</span>
              </div>
            )}
            <div className={styles.paymentItem}>
              <span>Booking Duration:</span>
              <div className={styles.bookingHoursControl}>
                <button 
                  type="button" 
                  onClick={() => setBookingHours(Math.max(1, bookingHours - 1))}
                  className={styles.hourButton}
                >
                  -
                </button>
                <span>{bookingHours} hour{bookingHours !== 1 ? 's' : ''}</span>
                <button 
                  type="button" 
                  onClick={() => setBookingHours(bookingHours + 1)}
                  className={styles.hourButton}
                >
                  +
                </button>
              </div>
            </div>
            <div className={styles.paymentTotal}>
              <span>Total Amount:</span>
              <span>₹{paymentData?.amount || '0.00'}</span>
            </div>
          </div>
          
          <div className={styles.paymentActions}>
            <button 
              className={styles.payNowButton}
              onClick={openRazorpayCheckout}
            >
              Pay Now
            </button>
            <button 
              className={styles.payLaterButton}
              onClick={() => {
                toast.info("Your event is saved as draft. You can complete payment later.");
                setShowPaymentModal(false);
                navigate("/dashboard");
              }}
            >
              Pay Later
            </button>
          </div>
          
          <div className={styles.paymentNote}>
            <p>
              <small>
                Note: Your event will remain in draft status until payment is completed.
                You can view your draft events in your dashboard.
              </small>
            </p>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  </>);
};

export default EventCreation;