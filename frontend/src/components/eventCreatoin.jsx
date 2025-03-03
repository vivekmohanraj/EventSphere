import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FaImage, FaCalendar, FaClock, FaTrash } from "react-icons/fa";
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
    formState: { errors },
  } = useForm();

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

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type`);
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
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Create event
      const formData = new FormData();
      formData.append("event_name", data.event_name);
      formData.append("event_type", data.event_type);
      formData.append("description", data.description || "");
      formData.append("audience", data.audience || "");
      formData.append("is_paid", data.is_paid);
      formData.append("rsvp_required", data.rsvp_required || false);
      formData.append("event_time", `${data.event_date}T${data.event_time}`);

      if (data.is_paid) {
        formData.append("price", parseFloat(data.price));
      }

      const response = await api.post("/events/events/", formData);
      const eventId = response.data.id;

      // Upload photos with content type header
      if (selectedPhotos.length > 0) {
        for (const photo of selectedPhotos) {
          const photoData = new FormData();
          photoData.append("event", eventId);
          photoData.append("photo_url", photo);

          try {
            await api.post("/events/event-photos/", photoData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
          } catch (photoError) {
            console.error("Error uploading photo:", photoError.response?.data);
            toast.error(`Failed to upload photo: ${photo.name}`);
          }
        }
      }

      toast.success("Event created successfully!");
      navigate("/events"); // Redirect to events list after successful creation
    } catch (error) {
      console.error("Error creating event:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.dummy}></div>
      <div className={styles.createEventContainer}>
        <div className={styles.formWrapper}>
          <h2>Create New Event</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.formGroup}>
              <label>Event Name</label>
              <input
                {...register("event_name", {
                  required: "Event name is required",
                })}
                placeholder="Enter event name"
              />
              {errors.event_name && (
                <span className={styles.error}>
                  {errors.event_name.message}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Event Type</label>
              <select
                {...register("event_type", {
                  required: "Event type is required",
                })}
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
              <label>Description</label>
              <textarea
                {...register("description")}
                placeholder="Enter event description"
                rows="4"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Target Audience</label>
              <textarea
                {...register("audience")}
                placeholder="Describe your target audience"
                rows="2"
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Event Date</label>
                <input
                  type="date"
                  {...register("event_date", {
                    required: "Event date is required",
                  })}
                />
                {errors.event_date && (
                  <span className={styles.error}>
                    {errors.event_date.message}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Event Time</label>
                <input
                  type="time"
                  {...register("event_time", {
                    required: "Event time is required",
                  })}
                />
                {errors.event_time && (
                  <span className={styles.error}>
                    {errors.event_time.message}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register("is_paid")} />
                This is a paid event
              </label>
            </div>

            {isPaid && (
              <div className={styles.formGroup}>
                <label>Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("price", {
                    required: isPaid
                      ? "Price is required for paid events"
                      : false,
                    min: { value: 0, message: "Price cannot be negative" },
                  })}
                  placeholder="Enter ticket price"
                />
                {errors.price && (
                  <span className={styles.error}>{errors.price.message}</span>
                )}
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Event Photos</label>
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
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
    </>
  );
};

export default EventCreation;
