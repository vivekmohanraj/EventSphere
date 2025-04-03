import React, { useState, useEffect } from 'react';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaCamera,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import styles from '../../assets/css/coordinator/profileComponent.module.css';
import { ACCESS_TOKEN } from '../../utils/constants';

const ProfileComponent = ({ userProfile, onProfileUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    profile_photo: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        username: userProfile.username || '',
        email: userProfile.email || '',
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        phone: userProfile.phone || '',
        profile_photo: userProfile.profile_photo || null
      });

      // Handle profile photo preview
      if (userProfile.profile_photo) {
        const photoUrl = userProfile.profile_photo;
        if (photoUrl.startsWith('http')) {
          setPhotoPreview(photoUrl);
        } else {
          const baseUrl = process.env.REACT_APP_API_URL || '';
          setPhotoPreview(`${baseUrl}${photoUrl}`);
        }
      }
    } else {
      fetchProfileData();
    }
  }, [userProfile]);
  
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem(ACCESS_TOKEN);
      
      if (!token) {
        toast.error("Authentication token missing. Please log in again.");
        return;
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get("users/profile/");
      
      if (response.data) {
        const profile = response.data;
        setProfileData({
          username: profile.username || '',
          email: profile.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          profile_photo: profile.profile_photo || null
        });
        
        // Handle profile photo preview
        if (profile.profile_photo) {
          const photoUrl = profile.profile_photo;
          if (photoUrl.startsWith('http')) {
            setPhotoPreview(photoUrl);
          } else {
            const baseUrl = process.env.REACT_APP_API_URL || '';
            setPhotoPreview(`${baseUrl}${photoUrl}`);
          }
        }
        
        // Call the parent component's update function
        if (onProfileUpdate) {
          onProfileUpdate(profile);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });

    // Clear validation error when field is updated
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });

    // Clear validation error when field is updated
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: ''
      });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size should not exceed 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }
      
      setPhotoFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileData.first_name.trim()) {
      errors.first_name = "First name is required";
    }
    
    if (!profileData.last_name.trim()) {
      errors.last_name = "Last name is required";
    }
    
    if (!profileData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = "Email is invalid";
    }
    
    if (profileData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(profileData.phone)) {
      errors.phone = "Phone number is invalid";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.current_password) {
      errors.current_password = "Current password is required";
    }
    
    if (!passwordData.new_password) {
      errors.new_password = "New password is required";
    } else if (passwordData.new_password.length < 8) {
      errors.new_password = "Password must be at least 8 characters";
    }
    
    if (!passwordData.confirm_password) {
      errors.confirm_password = "Please confirm your password";
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async () => {
    // Validate form
    if (!validateProfileForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('first_name', profileData.first_name);
      formData.append('last_name', profileData.last_name);
      formData.append('email', profileData.email);
      formData.append('phone', profileData.phone);
      
      // Add photo if changed
      if (photoFile) {
        formData.append('profile_photo', photoFile);
      }
      
      const response = await api.patch('users/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.status === 200) {
        setSuccessMessage('Profile updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        toast.success('Profile updated successfully');
        setEditMode(false);
        
        // Call the parent component's update function
        if (onProfileUpdate) {
          onProfileUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response && error.response.data) {
        // Handle specific field errors
        const apiErrors = error.response.data;
        const newFormErrors = {...formErrors};
        
        // Map API errors to form fields
        Object.keys(apiErrors).forEach(key => {
          if (key in profileData) {
            newFormErrors[key] = apiErrors[key][0] || apiErrors[key];
          }
        });
        
        setFormErrors(newFormErrors);
        toast.error('Please correct the errors in the form');
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate password form
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.post('users/change-password/', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      if (response.status === 200) {
        setSuccessMessage('Password changed successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        toast.success('Password changed successfully');
        setShowPasswordForm(false);
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Show error message from API if available
      if (error.response && error.response.data) {
        if (error.response.data.error) {
          toast.error(error.response.data.error);
          
          // Set specific field error if the API provided it
          if (error.response.data.error.includes('Current password')) {
            setPasswordErrors({ 
              ...passwordErrors, 
              current_password: 'Current password is incorrect' 
            });
          }
        } else {
          toast.error('Failed to change password');
        }
      } else {
        toast.error('Failed to change password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfileInfo = () => (
    <div className={styles.profileInfo}>
      <div className={styles.infoRow}>
        <div className={styles.infoLabel}>
          <FaUser />
          <span>Name</span>
        </div>
        <div className={styles.infoValue}>
          {`${profileData.first_name} ${profileData.last_name}`}
        </div>
      </div>
      
      <div className={styles.infoRow}>
        <div className={styles.infoLabel}>
          <FaEnvelope />
          <span>Email</span>
        </div>
        <div className={styles.infoValue}>
          {profileData.email}
        </div>
      </div>
      
      <div className={styles.infoRow}>
        <div className={styles.infoLabel}>
          <FaPhone />
          <span>Phone</span>
        </div>
        <div className={styles.infoValue}>
          {profileData.phone || 'Not provided'}
        </div>
      </div>
      
      <div className={styles.profileActions}>
        <button 
          className={styles.buttonPrimary} 
          onClick={() => setEditMode(true)}
        >
          Edit Profile
        </button>
        <button 
          className={styles.buttonSecondary} 
          onClick={() => setShowPasswordForm(true)}
        >
          Change Password
        </button>
      </div>
    </div>
  );

  const renderEditForm = () => (
    <div className={styles.profileForm}>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>First Name</label>
        <input
          type="text"
          name="first_name"
          value={profileData.first_name}
          onChange={handleInputChange}
          className={formErrors.first_name ? `${styles.formInput} ${styles.errorInput}` : styles.formInput}
        />
        {formErrors.first_name && (
          <div className={styles.errorText}>{formErrors.first_name}</div>
        )}
      </div>
      
      <div className={styles.formRow}>
        <label className={styles.formLabel}>Last Name</label>
        <input
          type="text"
          name="last_name"
          value={profileData.last_name}
          onChange={handleInputChange}
          className={formErrors.last_name ? `${styles.formInput} ${styles.errorInput}` : styles.formInput}
        />
        {formErrors.last_name && (
          <div className={styles.errorText}>{formErrors.last_name}</div>
        )}
      </div>
      
      <div className={styles.formRow}>
        <label className={styles.formLabel}>Email</label>
        <input
          type="email"
          name="email"
          value={profileData.email}
          onChange={handleInputChange}
          className={formErrors.email ? `${styles.formInput} ${styles.errorInput}` : styles.formInput}
        />
        {formErrors.email && (
          <div className={styles.errorText}>{formErrors.email}</div>
        )}
      </div>
      
      <div className={styles.formRow}>
        <label className={styles.formLabel}>Phone</label>
        <input
          type="tel"
          name="phone"
          value={profileData.phone}
          onChange={handleInputChange}
          className={formErrors.phone ? `${styles.formInput} ${styles.errorInput}` : styles.formInput}
        />
        {formErrors.phone && (
          <div className={styles.errorText}>{formErrors.phone}</div>
        )}
      </div>
      
      <div className={styles.profileActions}>
        <button 
          className={styles.buttonPrimary} 
          onClick={handleUpdateProfile}
          disabled={isLoading}
        >
          {isLoading ? <FaSpinner className={styles.spinnerIcon} /> : <FaCheck />}
          Save Changes
        </button>
        <button 
          className={styles.buttonSecondary} 
          onClick={() => setEditMode(false)}
          disabled={isLoading}
        >
          <FaTimes />
          Cancel
        </button>
      </div>
    </div>
  );

  const renderPasswordForm = () => (
    <div className={styles.formSection}>
      <h3>Change Password</h3>
      
      <div className={styles.formRow}>
        <label className={styles.formLabel}>Current Password</label>
        <input
          type="password"
          name="current_password"
          value={passwordData.current_password}
          onChange={handlePasswordChange}
          className={passwordErrors.current_password ? `${styles.formInput} ${styles.errorInput}` : styles.formInput}
        />
        {passwordErrors.current_password && (
          <div className={styles.errorText}>{passwordErrors.current_password}</div>
        )}
      </div>
      
      <div className={styles.formRow}>
        <label className={styles.formLabel}>New Password</label>
        <input
          type="password"
          name="new_password"
          value={passwordData.new_password}
          onChange={handlePasswordChange}
          className={passwordErrors.new_password ? `${styles.formInput} ${styles.errorInput}` : styles.formInput}
        />
        {passwordErrors.new_password && (
          <div className={styles.errorText}>{passwordErrors.new_password}</div>
        )}
      </div>
      
      <div className={styles.formRow}>
        <label className={styles.formLabel}>Confirm New Password</label>
        <input
          type="password"
          name="confirm_password"
          value={passwordData.confirm_password}
          onChange={handlePasswordChange}
          className={passwordErrors.confirm_password ? `${styles.formInput} ${styles.errorInput}` : styles.formInput}
        />
        {passwordErrors.confirm_password && (
          <div className={styles.errorText}>{passwordErrors.confirm_password}</div>
        )}
      </div>
      
      <div className={styles.profileActions}>
        <button 
          className={styles.buttonPrimary} 
          onClick={handleChangePassword}
          disabled={isLoading}
        >
          {isLoading ? <FaSpinner className={styles.spinnerIcon} /> : <FaCheck />}
          Change Password
        </button>
        <button 
          className={styles.buttonSecondary} 
          onClick={() => {
            setShowPasswordForm(false);
            setPasswordData({
              current_password: '',
              new_password: '',
              confirm_password: ''
            });
            setPasswordErrors({});
          }}
          disabled={isLoading}
        >
          <FaTimes />
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.profileContainer}>
      {isLoading && !editMode && !showPasswordForm && (
        <div className={styles.loader}>
          <FaSpinner className={styles.spinnerIcon} />
          <p>Loading profile information...</p>
        </div>
      )}
      
      {successMessage && (
        <div className={styles.success}>
          <FaCheck /> {successMessage}
        </div>
      )}
      
      <div className={styles.profileHeader}>
        <h2>My Profile</h2>
        <p>Manage your account information and preferences</p>
      </div>
      
      <div className={styles.profileContent}>
        <div className={styles.profilePhoto}>
          {photoPreview ? (
            <img 
              src={photoPreview} 
              alt="Profile" 
              className={styles.profileImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23f5f5f5" width="100" height="100"/><text fill="%23888" font-family="Arial" font-size="30" text-anchor="middle" x="50" y="60">?</text></svg>';
              }}
            />
          ) : (
            <div className={styles.photoPlaceholder}>
              {profileData.first_name && profileData.last_name ? (
                `${profileData.first_name.charAt(0)}${profileData.last_name.charAt(0)}`
              ) : 'U'}
            </div>
          )}
          
          {editMode && (
            <div className={styles.photoUpload}>
              <label htmlFor="photo-upload" className={styles.uploadLabel}>
                <FaCamera />
                <span> {photoPreview ? 'Change Photo' : 'Add Photo'}</span>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>
          )}
        </div>
        
        <div className={styles.profileDetails}>
          {!editMode && !showPasswordForm && renderProfileInfo()}
          {editMode && !showPasswordForm && renderEditForm()}
          {showPasswordForm && renderPasswordForm()}
        </div>
      </div>
    </div>
  );
};

export default ProfileComponent; 