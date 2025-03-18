import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaSave, FaUpload, FaTimes } from "react-icons/fa";
import api, { getMediaUrl } from "../../utils/api";
import styles from "../../assets/css/Dashboard.module.css";

const ProfileUpdate = ({ userProfile, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: userProfile?.first_name || "",
    last_name: userProfile?.last_name || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || "",
    username: userProfile?.username || "",
    location: userProfile?.location || "",
    bio: userProfile?.bio || "",
    preferences: userProfile?.preferences || ""
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    userProfile?.profile_photo ? getMediaUrl(userProfile.profile_photo) : null
  );

  useEffect(() => {
    if (userProfile) {
      setFormData({
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        username: userProfile.username || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
        preferences: userProfile.preferences || ""
      });
      
      if (userProfile.profile_photo) {
        setImagePreview(getMediaUrl(userProfile.profile_photo));
      }
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add all field data
      formDataToSend.append("first_name", formData.first_name);
      formDataToSend.append("last_name", formData.last_name);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("username", formData.username);
      formDataToSend.append("location", formData.location);
      
      if (formData.bio) {
        formDataToSend.append("bio", formData.bio);
      }
      
      if (formData.preferences) {
        formDataToSend.append("preferences", formData.preferences);
      }
      
      // Only include profile image if it's been changed
      if (profileImage) {
        formDataToSend.append("profile_photo", profileImage);
      }
      
      // Set the correct content type for form data
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      // Try multiple endpoints
      const endpointsToTry = [
        "users/profile/",
        "users/me/",
        "api/users/me/",
        "api/profile/"
      ];
      
      let success = false;
      
      for (const endpoint of endpointsToTry) {
        try {
          console.log(`Trying to update profile at ${endpoint}`);
          const response = await api.patch(endpoint, formDataToSend, config);
          
          if (response.status >= 200 && response.status < 300) {
            console.log(`Profile updated successfully at ${endpoint}`);
            success = true;
            break;
          }
        } catch (error) {
          console.warn(`Failed to update profile at ${endpoint}:`, error);
        }
      }
      
      if (success) {
        toast.success("Profile updated successfully");
        if (onSuccess) onSuccess();
      } else {
        throw new Error("Could not update profile on any endpoint");
      }
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h2>Update Profile</h2>
        
        <form onSubmit={handleProfileUpdate}>
          <div className={styles.formRow}>
            <div className={styles.profilePhotoContainer} style={{ margin: '0 auto 20px', width: '120px', height: '120px' }}>
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile Preview" 
                  className={styles.profilePhoto}
                />
              ) : (
                <div className={styles.profilePhotoPlaceholder}>
                  <span>
                    {formData.first_name ? formData.first_name.charAt(0).toUpperCase() : ''}
                    {formData.last_name ? formData.last_name.charAt(0).toUpperCase() : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="profile_photo">Profile Photo</label>
            <input
              type="file"
              id="profile_photo"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.formControl}
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className={styles.formControl}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className={styles.formControl}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className={styles.formControl}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email">Email (Cannot be changed)</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                className={`${styles.formControl} ${styles.disabledInput}`}
                disabled
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={styles.formControl}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={styles.formControl}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className={styles.formControl}
              rows="3"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="preferences">Preferences</label>
            <textarea
              id="preferences"
              name="preferences"
              value={formData.preferences}
              onChange={handleInputChange}
              className={styles.formControl}
              rows="2"
              placeholder="Event preferences, notifications, etc."
            />
          </div>
          
          <div className={styles.modalActions}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={onClose}
            >
              <FaTimes /> Cancel
            </button>
            
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={loading}
            >
              <FaSave /> {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileUpdate; 