import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FaImage, FaCalendar, FaClock, FaTrash, FaInfoCircle, FaTags, FaFolder } from "react-icons/fa";
import api from "../utils/api";
import styles from "../assets/css/eventCreation.module.css";

const EventCreation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });

  const isPaid = watch("is_paid");
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

  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsRes = await api.get('/events/tags/');
        setTags(tagsRes.data);
      } catch (error) {
        toast.error('Error loading tags');
      }
    };
    
    fetchTags();
  }, []);

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
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add all form fields
      Object.keys(data).forEach(key => {
        if (key === 'event_time') {
          formData.append(key, `${data.event_date}T${data.event_time}`);
        } else {
          formData.append(key, data[key]);
        }
      });
      
      // Add organizer info
      formData.append('organizer_info', formData.organizer_info || '');
      formData.append('organizer_website', formData.organizer_website || '');
      formData.append('organizer_email', formData.organizer_email || '');
      formData.append('organizer_phone', formData.organizer_phone || '');
      formData.append('organizer_social', JSON.stringify(formData.organizer_social));
      
      // Add selected tags - make sure to append each tag ID
      selectedTags.forEach(tagId => {
        formData.append('tags', tagId);
      });
      
      // Add photos
      selectedPhotos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await api.post('/events/events/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Event created successfully!');
      navigate(`/events/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to create event');
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
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
                <div className={styles.tagsGrid}>
                  {tags.map(tag => (
                    <div key={tag.id} className={styles.tagOption}>
                      <label className={styles.tagLabel}>
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.id)}
                          onChange={() => handleTagChange(tag.id)}
                        />
                        <span className={styles.tagText}>{tag.name}</span>
                      </label>
                    </div>
                  ))}
                </div>
                <div className={styles.helpText}>
                  <FaTags />
                  Select relevant tags to help people find your event
                </div>
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

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => navigate("/events")}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div></>
  );
};

export default EventCreation;
