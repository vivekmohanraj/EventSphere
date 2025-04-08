import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FaImage, FaCalendar, FaClock, FaTrash, FaInfoCircle, FaTags, FaFolder, FaCheck } from "react-icons/fa";
import api from "../utils/api";
import styles from "../assets/css/eventCreation.module.css";
import Modal from "react-bootstrap/Modal";
import { AiOutlineCalendar } from "react-icons/ai";
import axios from "axios";
import { ACCESS_TOKEN } from "../utils/constants";

// Define API URL constant at the top level of the file - ensure no trailing slash
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const EventCreation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVenueDetails, setShowVenueDetails] = useState(false);
  const [venueAvailability, setVenueAvailability] = useState({});
  const [bookingHours, setBookingHours] = useState(3);
  const [participantFee, setParticipantFee] = useState(50); // INR per participant
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [calculatedPayment, setCalculatedPayment] = useState({
    baseFee: 1000, // Base fee for event creation
    venueFee: 0,   // Calculated from venue price * hours
    participantFee: 0, // Calculated from participant count * fee
    totalAmount: 0
  });
  
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

  const { register, handleSubmit, formState, getValues, watch, setValue } = useForm({
    defaultValues: {
      event_name: "",
      event_type: "",
      description: "",
      event_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD
      event_time: "18:00", // Default time
      venue: "",
      is_paid: false,
      price: "",
      max_participants: "",
      organizer_info: "",
      organizer_website: "",
      organizer_email: "",
      organizer_phone: "",
      facebook_url: "",
      twitter_url: "",
      instagram_url: "",
      linkedin_url: ""
    }
  });
  
  const { errors } = formState;

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

  // Constants
  const COORDINATOR_ROLE = "coordinator"; // Role constant for coordinators

  // Get user from localStorage instead of auth context
  const [user, setUser] = useState(null);
  const [showCoordinatorPaymentAlert, setShowCoordinatorPaymentAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const userFromStorage = JSON.parse(localStorage.getItem('user'));
    setUser(userFromStorage);
    
    // Show payment alert for coordinators
    if (userFromStorage?.user_role === COORDINATOR_ROLE) {
      setShowCoordinatorPaymentAlert(true);
      
      // Preload Razorpay SDK for coordinators
      console.log("User is a coordinator, preloading Razorpay SDK...");
      initializeRazorpay()
        .then(() => console.log("Razorpay SDK preloaded successfully"))
        .catch(err => console.warn("Failed to preload Razorpay SDK:", err));
    }
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsRes = await api.get('/api/events/tags/');
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
      const response = await api.get('/api/events/venues/');
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

    // Set the first valid file as the imageFile for the event banner
    if (validFiles.length > 0) {
      setImageFile(validFiles[0]);
    }

    setSelectedPhotos((prev) => [...prev, ...validFiles]);

    // Create previews for new files
    const newPreviews = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      file: file, // Store the actual file object for later upload
    }));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    // If removing the current imageFile, set it to null
    if (selectedPhotos[index] === imageFile) {
      setImageFile(null);
    }
    
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

  // Calculate payment when relevant factors change
  useEffect(() => {
    const maxParticipants = getValues('max_participants') || 0;
    const baseParticipantCount = parseInt(maxParticipants) || 50; // Default to 50 if not specified
    
    // Calculate venue fee
    const venueHourlyRate = selectedVenue ? selectedVenue.price_per_hour : 0;
    const venueFee = venueHourlyRate * bookingHours;
    
    // Calculate participant fee (only if event has limited capacity)
    const participantTotal = limitedCapacity ? baseParticipantCount * participantFee : 0;
    
    // Calculate total
    const baseFee = 1000; // Base fee for event creation
    const totalAmount = baseFee + venueFee + participantTotal;
    
    console.log('Payment Calculation:', {
      baseFee,
      venueFee,
      participantTotal,
      totalAmount,
      bookingHours,
      venueHourlyRate: selectedVenue?.price_per_hour
    });
    
    setCalculatedPayment({
      baseFee,
      venueFee,
      participantFee: participantTotal,
      totalAmount
    });
    
    // If payment data exists and we're showing the payment modal, we need to update the payment
    if (paymentData && showPaymentModal) {
      // Update payment order on backend with new amount
      // This will happen when booking hours change in the payment modal
      updatePaymentOrder();
    }
  }, [selectedVenue, bookingHours, getValues, participantFee, limitedCapacity, paymentData, showPaymentModal]);

  // Add this function to manage payment order updates
  const updatePaymentOrder = async () => {
    console.log("%c UPDATING PAYMENT ORDER", "background: blue; color: white; font-size: 16px;");
    console.log("Current payment calculation:", {
      baseFee: calculatedPayment.baseFee,
      venueFee: calculatedPayment.venueFee,
      participantFee: calculatedPayment.participantFee,
      totalAmount: calculatedPayment.totalAmount
    });
    
    try {
      // Delete previous payment if it exists
      if (paymentData?.id) {
        console.log("Attempting to delete previous payment:", paymentData.id);
        try {
          await api.delete(`/api/payments/${paymentData.id}/`);
          console.log("Previous payment deleted successfully");
        } catch (deleteError) {
          // If payment doesn't exist (404) or other error, just log and continue
          console.log("Could not delete previous payment, may not exist:", deleteError.message);
          // Continue with creating a new payment
        }
      }
      
      // Get the venue ID from the selected venue
      const venueId = selectedVenue ? selectedVenue.id : null;
      
      // Create a new payment request with updated amount
      const paymentRequest = {
        event: paymentData.event, // Use the same temporary event
        venue: venueId,
        booking_hours: bookingHours,
        amount: calculatedPayment.totalAmount, // Updated amount
        currency: "INR",
        payment_method: "razorpay",
        payment_status: "pending",
        payment_details: {
          breakdown: {
            baseFee: calculatedPayment.baseFee,
            venueFee: calculatedPayment.venueFee,
            participantFee: calculatedPayment.participantFee,
            totalAmount: calculatedPayment.totalAmount
          }
        }
      };
      
      console.log("Creating new payment with updated amount:", paymentRequest);
      const paymentResponse = await api.post(
        `/api/payments/`,
        paymentRequest
      );
      
      console.log("%c NEW PAYMENT RESPONSE", "background: green; color: white;", paymentResponse.data);
      
      // Make sure we got a new Razorpay order ID
      if (!paymentResponse.data.razorpay_order_id) {
        throw new Error("Missing Razorpay order ID in payment response");
      }
      
      // Check if the backend amount matches our frontend calculation
      const backendAmount = paymentResponse.data.amount;
      const backendOrderAmount = paymentResponse.data.payment_details?.order?.amount;
      
      console.log("%c AMOUNT CHECK", "background: orange; color: black;", {
        frontendAmount: calculatedPayment.totalAmount,
        backendAmount: backendAmount,
        backendOrderAmount: backendOrderAmount,
        match: calculatedPayment.totalAmount === backendAmount
      });
      
      // Update the payment data in state
      const updatedPaymentData = {
        ...paymentResponse.data,
        amount: calculatedPayment.totalAmount, // Ensure we're using our calculated amount
        event: paymentData.event // Preserve the event reference
      };
      
      setPaymentData(updatedPaymentData);
      
      toast.info(`Payment amount updated to ₹${calculatedPayment.totalAmount.toFixed(2)}`);
      console.log("Payment order updated successfully with new Razorpay order ID:", updatedPaymentData.razorpay_order_id);
      return updatedPaymentData;
    } catch (error) {
      console.error("Error updating payment order:", error);
      toast.error("Failed to update payment amount. Please try again.");
      return null;
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Check if the user is logged in
      if (!user) {
        toast.error("You must be logged in to create an event");
        setIsSubmitting(false);
        return;
      }

      // Get user data from localStorage to double-check the role
      const storedUserData = JSON.parse(localStorage.getItem('user'));
      console.log("User data from localStorage:", storedUserData);
      
      // Check if the current user is a coordinator
      const isCoordinator = storedUserData?.role === 'coordinator';
      console.log("Is user a coordinator?", isCoordinator, "Role:", storedUserData?.role);

      // Format the date and time as expected by the backend
      try {
        const eventDate = new Date(data.event_date);
        
        // Extract hours and minutes from the event_time string (format: "HH:MM")
        const [hours, minutes] = data.event_time.split(':').map(Number);
        
        // Create a new date object combining date and time
        const combinedDateTime = new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate(),
          hours || 0,
          minutes || 0
        );

        // Make sure the date is valid before calling toISOString()
        if (isNaN(combinedDateTime.getTime())) {
          throw new Error("Invalid date or time values");
        }

        // Format date string for API
        const formattedDateTime = combinedDateTime.toISOString();
        
        // Calculate number of hours for booking (default to 3 hours if end_time not available)
        const bookingHours = data.end_time 
          ? Math.max(1, Math.ceil(calculateDurationInHours(data.event_time, data.end_time)))
          : 3;

        // Prepare the event data
        const eventFormData = new FormData();
        eventFormData.append("event_name", data.event_name);
        eventFormData.append("event_type", data.event_type);
        eventFormData.append("description", data.description);
        eventFormData.append("event_time", formattedDateTime);
        eventFormData.append("booking_hours", bookingHours);

        // Get venue ID from form data or selected venue
        const venueId = data.venue_id || (selectedVenue ? selectedVenue.id : null);
        if (venueId) {
          eventFormData.append("venue_id", venueId);
        }
        
        eventFormData.append("expected_participants", data.expected_participants);
        
        // Make sure to include is_paid field explicitly (converting to string for FormData)
        eventFormData.append("is_paid", data.is_paid ? "true" : "false");
        
        // Add price if the event is paid
        if (data.is_paid && data.price) {
          eventFormData.append("price", data.price);
        }
        
        // Add tags if selected
        if (data.tags && data.tags.length > 0) {
          data.tags.forEach(tag => {
            eventFormData.append("tags", tag);
          });
        }

        // Convert image file to base64 if available
        if (imageFile) {
          eventFormData.append("event_banner", imageFile);
        }

        console.log("Event form data prepared:", Object.fromEntries(eventFormData));
        console.log("Starting event creation with payment check. isCoordinator:", isCoordinator);

        // If the user is a coordinator, handle the payment process
        if (isCoordinator) {
          console.log("User is a coordinator - starting payment flow");
          try {
            // Store the event data locally to use after payment success
            const eventData = {
              event_name: data.event_name,
              event_type: data.event_type,
              formData: eventFormData,
              venueId: venueId,
              bookingHours: bookingHours
            };
            
            // Save the event data for later creation
            setEventData(eventData);
            
            // Create a temporary draft event first
            console.log("Creating temporary draft event");
            const tempEventResponse = await api.post(
              `/api/events/`,
              eventFormData
            );
            
            const tempEventId = tempEventResponse.data.id;
            console.log("Temporary draft event created with ID:", tempEventId);
            
            // Now create the payment linked to the temporary event
            console.log("Creating payment with amount:", calculatedPayment.totalAmount);
            
            // Prepare the payment request with detailed payment breakdown
            const paymentRequest = {
              event: tempEventId, // Link to the temporary event
              booking_hours: bookingHours,
              venue: venueId,
              amount: calculatedPayment.totalAmount,
              payment_type: 'event_creation',
              payment_status: 'pending',
              payment_details: {
                breakdown: {
                  baseFee: calculatedPayment.baseFee,
                  venueFee: calculatedPayment.venueFee,
                  participantFee: calculatedPayment.participantFee,
                  totalAmount: calculatedPayment.totalAmount
                }
              }
            };
            
            const paymentResponse = await api.post(
              `/api/payments/`,
              paymentRequest
            );
            
            console.log("Payment record created:", paymentResponse.data);
            
            // Store payment data for Razorpay
            // Force the amount to be exactly what we calculated
            const paymentData = {
              ...paymentResponse.data,
              amount: calculatedPayment.totalAmount,
              event: tempEventId // Store the temp event ID
            };
            
            setPaymentData(paymentData);
            
            // Update event data with temp ID
            setEventData({
              ...eventData,
              id: tempEventId
            });
            
            // Show payment modal
            setShowPaymentModal(true);
          } catch (paymentError) {
            console.error("Error creating payment:", paymentError);
            toast.error("Failed to initialize payment: " + (paymentError.response?.data?.error || paymentError.message));
            setIsSubmitting(false);
          }
        } else {
          console.log("User is not a coordinator, creating event directly");
          // Non-coordinator: create event without payment
          const response = await api.post(
            `/api/events/`,
            eventFormData
          );

          toast.success("Event created successfully!");
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error formatting date and time:", error);
        toast.error("Failed to format date and time. Please try again.");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(
        error.response?.data?.detail ||
        "Failed to create event. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePaymentSuccess = async (paymentId, orderId, signature) => {
    try {
      console.log("Payment successful, verifying with backend...");
      toast.info("Processing your payment...");
      
      // Verify payment with backend
      let verificationResponse;
      try {
        console.log("Trying payment verification");
        verificationResponse = await api.post(
          `/api/payments/verify/`,
          {
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            razorpay_signature: signature,
            payment_id: paymentData.id
          }
        );
      } catch (verifyError) {
        // Try alternative endpoint if first attempt fails
        verificationResponse = await api.post(
          `/api/payments/${paymentData.id}/verify_payment/`,
          {
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            razorpay_signature: signature
          }
        );
      }
      
      console.log("Payment verification response:", verificationResponse.data);
      
      // Check if the verification was successful
      if (verificationResponse.data.success) {
        try {
          // Get the temporary event ID
          const tempEventId = paymentData.event;
          console.log("Activating event with ID:", tempEventId);
          
          // Update event status to 'upcoming'
          const eventUpdateResponse = await api.patch(
            `/api/events/${tempEventId}/`,
            { 
              status: 'upcoming',
              payment_verified: true
            },
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log("Event activated successfully:", eventUpdateResponse.data);
          
          // Update payment record status to completed
          await api.patch(
            `/api/payments/${paymentData.id}/`,
            {
              payment_status: 'completed',
              transaction_id: paymentId,
              razorpay_payment_id: paymentId,
              razorpay_signature: signature,
              payment_details: {
                ...paymentData.payment_details,
                payment_completed_at: new Date().toISOString(),
                payment_method: 'razorpay'
              }
            }
          );
          
          console.log("Payment record updated successfully");
          
          // Refresh local storage data if needed for dashboard
          const dashboardData = localStorage.getItem('coordinator_dashboard_data');
          if (dashboardData) {
            try {
              const parsedData = JSON.parse(dashboardData);
              // Remove outdated data to force refresh
              localStorage.setItem('coordinator_dashboard_data', JSON.stringify({
                ...parsedData,
                events: null,
                lastFetched: null
              }));
            } catch (e) {
              console.log("Error updating dashboard cache:", e);
            }
          }
          
          toast.success("Payment successful! Your event has been created.");
          setShowPaymentModal(false);
          
          // Navigate to event details page
          navigate(`/events/${tempEventId}`);
        } catch (eventError) {
          console.error("Error updating event after payment:", eventError);
          
          // Even if there's an error updating the event, we should still navigate
          // to the dashboard since the payment was successful
          toast.warning("Payment was successful, but there was an issue activating your event. It may appear as a draft in your dashboard.");
          setShowPaymentModal(false);
          navigate("/dashboard");
        }
      } else {
        toast.error("Payment verification failed. Please contact support.");
        setShowPaymentModal(false);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      
      toast.error("Payment verification failed. Please try again or contact support.");
      setShowPaymentModal(false);
      navigate("/dashboard");
    }
  };
  
  const handlePaymentFailure = (error) => {
    console.error("Payment failed:", error);
    
    // Extract error message if available
    let errorMessage = "Payment failed.";
    if (error && error.description) {
      errorMessage = `Payment failed: ${error.description}`;
    } else if (error && error.error && error.error.description) {
      errorMessage = `Payment failed: ${error.error.description}`;
    }
    
    // Display error message
    toast.error(errorMessage + " Your event was not created.");
    
    // Close payment modal
    setShowPaymentModal(false);
    
    // Return to dashboard
    navigate("/dashboard");
  };
  
  const initializeRazorpay = () => {
    return new Promise((resolve, reject) => {
      console.log("Initializing Razorpay...");

      // Check if Razorpay is already loaded
      if (window.Razorpay) {
        console.log("Razorpay already loaded");
        resolve(true);
        return;
      }
      
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      
      script.onload = () => {
        console.log("Razorpay SDK loaded successfully");
        resolve(true);
      };
      
      script.onerror = (error) => {
        console.error("Error loading Razorpay SDK:", error);
        reject(new Error("Failed to load Razorpay SDK"));
        toast.error("Payment gateway failed to load. Please try again.");
      };
      
      // Add the script to the document
      document.body.appendChild(script);
      console.log("Added Razorpay script to document");
    });
  };
  
  const openRazorpayCheckout = async (paymentData) => {
    try {
      console.log("Opening Razorpay checkout...");
      
      // Initialize Razorpay SDK
      await initializeRazorpay();
      
      // Use the provided payment data or fall back to the state variable
      // But we shouldn't need the fallback since we always pass the payment data
      
      // Ensure we have valid payment data
      if (!paymentData || !paymentData.razorpay_order_id) {
        console.error("Missing payment data:", paymentData);
        toast.error("Payment information is missing. Please try again.");
        setIsSubmitting(false);
        return;
      }
      
      // Ensure we're using the correct amount from our current calculation
      const finalAmount = calculatedPayment.totalAmount;
      
      // Format the amount for display (the amount should already be in INR)
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(finalAmount);
      
      // Log all payment amounts for debugging
      console.log("Payment amounts:", {
        calculatedTotal: calculatedPayment.totalAmount,
        paymentDataAmount: paymentData.amount,
        finalAmount: finalAmount,
        formattedForDisplay: formattedAmount,
        amountInPaise: Math.round(finalAmount * 100),
        razorpayOrderId: paymentData.razorpay_order_id
      });
      
      // Prepare user info for prefill
      const userName = user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
      const userEmail = user?.email || '';
      const userPhone = user?.phone || '';
      
      // Log payment details for debugging
      console.log("Payment details:", {
        key: paymentData.payment_details.key_id,
        amount: Math.round(finalAmount * 100), // Ensure amount is an integer in paise
        currency: paymentData.payment_details.currency || "INR",
        orderId: paymentData.razorpay_order_id,
        userName, userEmail, userPhone
      });
    
    // CRITICAL DEBUGGING - Check all amounts
    console.log("%c PAYMENT AMOUNT DEBUGGING", "background: red; color: white; font-size: 20px;");
    console.log({
      calculatedPaymentTotal: calculatedPayment.totalAmount,
      paymentDataAmount: paymentData.amount,
      backendOrderAmount: paymentData.payment_details?.order?.amount,
      amountInRazorpayOptions: calculatedPayment.totalAmount * 100,
      amountBreakdown: {
        baseFee: calculatedPayment.baseFee,
        venueFee: calculatedPayment.venueFee,
        participantFee: calculatedPayment.participantFee
      },
      paymentDetails: paymentData.payment_details
    });
        
    // IMPORTANT: We must use the exact amount that was used to create the order on the backend
    // Otherwise, Razorpay will reject the payment as the amounts don't match
    const backendOrderAmount = paymentData.payment_details?.order?.amount;
    
    // For debugging the issue with amounts
    console.log("ORDER AMOUNT FROM BACKEND:", backendOrderAmount);
    
    const options = {
      key: paymentData.payment_details.key_id,
      amount: backendOrderAmount, // Do not modify this amount - it's already in paise from the backend
      currency: paymentData.payment_details.currency || "INR",
      name: "EventSphere",
      description: `Event Creation: ${eventData.event_name}`,
      order_id: paymentData.razorpay_order_id,
      image: "https://www.example.com/your_logo.png", // Replace with your actual logo URL
      handler: function (response) {
        console.log("Payment successful, response:", response);
        handlePaymentSuccess(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );
      },
      prefill: {
        name: userName || "Event Coordinator",
        email: userEmail || "",
        contact: userPhone || ""
      },
      notes: {
        event_id: eventData?.id?.toString() || '',
        event_name: eventData?.event_name || '',
        event_type: eventData?.event_type || '',
        booking_hours: bookingHours.toString(),
        amount_breakdown: JSON.stringify({
          baseFee: calculatedPayment.baseFee,
          venueFee: calculatedPayment.venueFee,
          participantFee: calculatedPayment.participantFee,
          totalAmount: calculatedPayment.totalAmount
        })
      },
      theme: {
        color: "#ff4a17" // Accent color from EventSphere CSS variables
      },
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Pay via Net Banking',
            },
            wallets: {
              name: 'Pay via Wallets',
            },
            upi: {
              name: 'Pay via UPI'
            }
          },
          hide: [],
          sequence: ["block.wallets", "block.upi", "block.netbanking"],
        },
        callbacks: {
          notifyMerchant: function(data){
            console.log("Payment started");
          }
        }
      },
      modal: {
        ondismiss: async function() {
          console.log("Payment modal closed without payment");
          try {
            // Get the temporary event ID from payment data
            const tempEventId = paymentData?.event;
            if (tempEventId) {
              console.log("Deleting temporary event:", tempEventId);
              await api.delete(`/api/events/${tempEventId}/`);
              console.log("Temporary event deleted successfully");
            }
          } catch (cleanupError) {
            console.error("Error cleaning up temporary event:", cleanupError);
          }
          
          setIsSubmitting(false);
          setShowPaymentModal(false);
          toast.warning("Payment canceled. Your event has not been created.");
        }
      }
    };
      
      console.log("Creating Razorpay payment object with options:", options);
      
      // Check if window.Razorpay exists
      if (!window.Razorpay) {
        console.error("Razorpay not loaded on window object!");
        toast.error("Failed to load payment gateway. Please try again later.");
        return;
      }
    
    const paymentObject = new window.Razorpay(options);
      
      // Open the payment modal
      console.log("Opening Razorpay payment modal");
    paymentObject.open();
      console.log("Razorpay payment modal opened successfully");
      
      // Add event listener for payment failure event
      paymentObject.on('payment.failed', function(response) {
        console.error("Payment failed event triggered:", response);
        handlePaymentFailure({
          error: response.error,
          description: response.error.description,
          code: response.error.code,
          source: response.error.source,
          step: response.error.step,
          reason: response.error.reason
        });
      });
      
      return paymentObject; // Return the payment object for potential later use
    } catch (error) {
      console.error("Error initializing Razorpay:", error);
      toast.error("Failed to open payment gateway. Please try again or contact support.");
      // Keep modal open so user can try again
    }
  };

  return (<>
    <div className={styles.dummy}></div>
    <div className={styles.pageContainer}>
      <div className={styles.createEventContainer}>
        <div className={styles.formWrapper}>
          <div className={styles.formHeader}>
            <h1>Create a New Event</h1>
            <p>Fill in the details below to create your event. All fields marked with * are required.</p>
            
            {showCoordinatorPaymentAlert && (
              <div className={styles.coordinatorAlert}>
                <h3>Coordinator Payment Required</h3>
                <p>As a coordinator, you will need to make a payment to publish this event. The payment will be calculated based on venue selection, booking hours, and participant capacity.</p>
              </div>
            )}
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className={styles.spinnerSmall}></span>
                    Creating Event...
                  </>
                ) : (
                  <>
                    <AiOutlineCalendar />
                    Create Event
                  </>
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
        // Close modal and reset state
        setShowPaymentModal(false);
        setIsSubmitting(false);
        toast.info("Payment cancelled. Event not created.");
      }}
      centered
      size="lg"
      dialogClassName={`${styles.paymentModalDialog} ${styles[`theme-${getValues('event_type') || 'default'}`]}`}
      contentClassName={styles.paymentModalContent}
      className={styles.paymentModal}
    >
      <Modal.Header closeButton className={styles.paymentModalHeader}>
        <Modal.Title>
          <div className={styles.modalTitleWrapper}>
            {getValues('event_type') === 'conference' && <FaCalendar className={styles.eventTypeIcon} />}
            {getValues('event_type') === 'workshop' && <FaFolder className={styles.eventTypeIcon} />}
            {getValues('event_type') === 'concert' && <FaImage className={styles.eventTypeIcon} />}
            {getValues('event_type') === 'seminar' && <FaInfoCircle className={styles.eventTypeIcon} />}
            Complete Event Creation Payment
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={styles.paymentDetails}>
          <div className={styles.paymentHeader}>
            <h4>Complete Payment to Create Your Event</h4>
            <div className={styles.eventTypeBadge}>
              {getValues('event_type')?.toUpperCase() || 'EVENT'}
            </div>
            <p className={styles.paymentInstructions}>
              As a coordinator, you need to complete payment to create and publish your event.
              Your event will only be created after successful payment.
            </p>
          </div>
          
          <div className={styles.paymentSummary}>
            <div className={styles.paymentSummarySection}>
              <h5>Event Details</h5>
              <div className={styles.paymentItem}>
                <span>Event Name:</span>
                <span>{eventData?.event_name}</span>
              </div>
              <div className={styles.paymentItem}>
                <span>Event Type:</span>
                <span>{getValues('event_type')?.charAt(0).toUpperCase() + getValues('event_type')?.slice(1) || '-'}</span>
              </div>
              {eventData?.max_participants && (
                <div className={styles.paymentItem}>
                  <span>Maximum Participants:</span>
                  <span>{eventData?.max_participants}</span>
                </div>
              )}
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
                    onClick={async () => {
                      if (bookingHours > 1) {
                        setBookingHours(bookingHours - 1);
                      }
                    }}
                    className={styles.hourButton}
                    disabled={bookingHours <= 1}
                  >
                    -
                  </button>
                  <span>{bookingHours} hour{bookingHours !== 1 ? 's' : ''}</span>
                  <button 
                    type="button" 
                    onClick={async () => {
                      setBookingHours(bookingHours + 1);
                    }}
                    className={styles.hourButton}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            <div className={styles.paymentBreakdownSection}>
              <h5>Payment Breakdown</h5>
              <div className={styles.breakdownItem}>
                <span>Base Fee:</span>
                <span>₹{calculatedPayment.baseFee.toFixed(2)}</span>
              </div>
              {selectedVenue && (
                <div className={styles.breakdownItem}>
                  <span>Venue Fee ({bookingHours} hr{bookingHours !== 1 ? 's' : ''} × ₹{selectedVenue.price_per_hour}):</span>
                  <span>₹{calculatedPayment.venueFee.toFixed(2)}</span>
                </div>
              )}
              {limitedCapacity && (
                <div className={styles.breakdownItem}>
                  <span>Participant Fee ({getValues('max_participants')} × ₹{participantFee}):</span>
                  <span>₹{calculatedPayment.participantFee.toFixed(2)}</span>
                </div>
              )}
              
              <div className={styles.paymentTotal}>
                <span>Total Amount:</span>
                <span className={styles.totalAmount}>₹{calculatedPayment.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className={styles.paymentMethodsSection}>
              <h5>Payment Methods Accepted</h5>
              <div className={styles.paymentMethodIcons}>
                <span className={styles.paymentMethodIcon}>💳</span>
                <span className={styles.paymentMethodIcon}>🏦</span>
                <span className={styles.paymentMethodIcon}>📱</span>
                <span className={styles.paymentMethodIcon}>💰</span>
              </div>
              <p>Credit/Debit Cards, UPI, Netbanking, Mobile Wallets</p>
              <div className={styles.securityNote}>
                <small>All payments are processed securely via Razorpay</small>
              </div>
            </div>
          </div>
          
          <div className={styles.paymentActions}>
            <button 
              className={`${styles.payNowButton} ${styles[`theme-btn-${getValues('event_type') || 'default'}`]}`}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  // Create temporary draft event if it doesn't exist yet
                  let tempEventId = paymentData?.event;
                  
                  if (!tempEventId) {
                    // Create a temporary event with status "draft"
                    console.log("Creating new temporary draft event");
                    try {
                      const tempEventResponse = await api.post(
                        `/api/events/`,
                        eventData.formData
                      );
                      
                      tempEventId = tempEventResponse.data.id;
                      console.log("Temporary draft event created with ID:", tempEventId);
                      
                      // Update event data
                      setEventData({
                        ...eventData,
                        id: tempEventId
                      });
                    } catch (eventError) {
                      console.error("Error creating temporary event:", eventError);
                      toast.error("Failed to create temporary event: " + (eventError.response?.data?.error || eventError.message));
                      setIsSubmitting(false);
                      return;
                    }
                  }
                  
                  // Calculate the final amount based on current values
                  const finalAmount = calculatedPayment.totalAmount;
                  console.log("Creating payment with final amount:", finalAmount);
                  
                  // Delete previous payment if it exists
                  if (paymentData?.id) {
                    console.log("Attempting to delete previous payment:", paymentData.id);
                    try {
                      await api.delete(`/api/payments/${paymentData.id}/`);
                      console.log("Previous payment deleted successfully");
                    } catch (deleteError) {
                      // If payment doesn't exist (404) or other error, just log and continue
                      console.log("Could not delete previous payment, may not exist:", deleteError.message);
                    }
                  }
                  
                  // Create new payment record with correct amount
                  const paymentRequest = {
                    event: tempEventId,
                    venue: selectedVenue?.id,
                    booking_hours: bookingHours,
                    amount: finalAmount,
                    currency: "INR",
                    payment_method: "razorpay",
                    payment_status: "pending",
                    payment_details: {
                      breakdown: {
                        baseFee: calculatedPayment.baseFee,
                        venueFee: calculatedPayment.venueFee,
                        participantFee: calculatedPayment.participantFee,
                        totalAmount: finalAmount
                      }
                    }
                  };
                  
                  console.log("Creating payment with request:", paymentRequest);
                  const paymentResponse = await api.post(
                    `/api/payments/`,
                    paymentRequest
                  );
                  
                  console.log("New payment created:", paymentResponse.data);
                  
                  // Verify the amount from the response
                  const responseAmount = paymentResponse.data.amount;
                  const orderAmount = paymentResponse.data.payment_details?.order?.amount;
                  
                  console.log("Payment amounts:", {
                    requestedAmount: calculatedPayment.totalAmount,
                    responseAmount,
                    orderAmount,
                    orderAmountInRupees: orderAmount / 100
                  });
                  
                  // Initialize Razorpay
                  await initializeRazorpay();
                  
                  // Make sure we use the correct amount in Razorpay options
                  const options = {
                    key: paymentResponse.data.payment_details.key_id,
                    amount: orderAmount, // This should be in paise
                    currency: paymentResponse.data.payment_details.currency || "INR",
                    name: "EventSphere",
                    description: `Event Creation: ${eventData.event_name}`,
                    order_id: paymentResponse.data.razorpay_order_id,
                    handler: function(response) {
                      console.log("Payment successful, response:", response);
                      handlePaymentSuccess(
                        response.razorpay_payment_id,
                        response.razorpay_order_id,
                        response.razorpay_signature
                      );
                    },
                    prefill: {
                      name: user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
                      email: user?.email || "",
                      contact: user?.phone || ""
                    },
                    notes: {
                      event_id: tempEventId.toString(),
                      event_name: eventData.event_name || '',
                      booking_hours: bookingHours.toString()
                    },
                    theme: {
                      color: "#ff4a17"
                    },
                    modal: {
                      ondismiss: async function() {
                        console.log("Payment modal closed without payment");
                        try {
                          if (tempEventId) {
                            console.log("Deleting temporary event:", tempEventId);
                            await api.delete(`/api/events/${tempEventId}/`);
                            console.log("Temporary event deleted successfully");
                          }
                        } catch (cleanupError) {
                          console.error("Error cleaning up temporary event:", cleanupError);
                        }
                        
                        setIsSubmitting(false);
                        setShowPaymentModal(false);
                        toast.warning("Payment canceled. Your event has not been created.");
                      }
                    }
                  };
                  
                  console.log("Razorpay options:", options);
                  
                  // Open Razorpay checkout
                  const paymentObject = new window.Razorpay(options);
                  paymentObject.open();
                } catch (error) {
                  console.error("Payment initialization failed:", error);
                  toast.error("Payment initialization failed: " + (error.response?.data?.error || error.message));
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Pay Now"}
            </button>
            <button 
              className={styles.cancelButton}
              onClick={() => {
                // Close modal and reset state
                setShowPaymentModal(false);
                setIsSubmitting(false);
                toast.info("Payment cancelled. Event not created.");
              }}
            >
              Cancel
            </button>
          </div>
          
          <div className={styles.paymentNote}>
            <p>
              <small>
                Note: Your event will only be created after successful payment.
                Canceling the payment will cancel the event creation process.
              </small>
            </p>
            <p>
              <small>
                <strong>Pricing Model:</strong> The total fee includes a base event creation fee, 
                venue rental charges (if applicable), and a per-participant fee for capacity management.
              </small>
            </p>
            <p>
              <small>
                <strong>Note for Coordinators:</strong> This payment is required only for coordinator accounts.
                Admin accounts can create events without payment.
              </small>
            </p>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  </>);
};

export default EventCreation;