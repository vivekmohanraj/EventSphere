import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaSave, FaUpload, FaKey, FaUser } from "react-icons/fa";
import api from "../../utils/api";
import styles from "../../assets/css/Dashboard.module.css";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../../utils/constants";

const ProfileUpdate = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    username: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get user ID from token
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        throw new Error("No auth token found");
      }
      
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.user_id || decodedToken.id || decodedToken.sub;
      console.log("Attempting to fetch profile for user ID:", userId);
      
      let userData = null;
      let attempts = 0;
      
      // Django REST Framework specific endpoints first
      const endpointsToTry = [
        `users/profile/`,
        `users/me/`,
        `users/${userId}/`,
        `auth/users/me/`,
        `auth/user/`,
        `api/users/me/`,
        `api/users/${userId}/`,
        `api/auth/users/me/`,
        `api/user/`,
        `api/profile/`,
        `accounts/profile/`
      ];
      
      for (const endpoint of endpointsToTry) {
        attempts++;
        try {
          console.log(`Attempt ${attempts}: Trying to fetch from ${endpoint}`);
          const response = await api.get(endpoint);
          if (response.data) {
            console.log(`Success! User data found at ${endpoint}`);
            userData = response.data;
            break;
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed:`, 
            error.response ? `Status: ${error.response.status}, Message: ${JSON.stringify(error.response.data)}` : error.message);
          // Continue to next endpoint
        }
      }
      
      if (userData) {
        console.log("User data retrieved:", Object.keys(userData).join(", "));
        setUser(userData);
        populateFormData(userData);
      } else {
        throw new Error(`Could not fetch user data from any endpoint after ${attempts} attempts`);
      }
    } catch (error) {
      toast.error("Failed to fetch profile data");
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (userData) => {
    // Handle different possible data schemas
    setFormData({
      first_name: userData.first_name || userData.firstName || userData.name?.split(' ')[0] || "",
      last_name: userData.last_name || userData.lastName || (userData.name?.split(' ').length > 1 ? userData.name.split(' ').slice(1).join(' ') : "") || "",
      email: userData.email || "",
      phone: userData.phone || userData.phoneNumber || userData.phone_number || userData.contact || "",
      username: userData.username || userData.userName || userData.login || userData.email?.split('@')[0] || "",
    });
    
    // Handle different possible profile photo field names and URL formats
    const photoField = userData.profile_photo || userData.profilePhoto || userData.avatar || userData.image || userData.photo;
    
    if (photoField) {
      // If it's just a relative path, construct the full URL
      if (photoField.startsWith('/')) {
        // Get the API base URL from the api.js file's baseURL setting
        const baseApiUrl = api.defaults.baseURL || '';
        const baseUrl = baseApiUrl.endsWith('/') ? baseApiUrl.slice(0, -1) : baseApiUrl;
        setImagePreview(`${baseUrl}${photoField}`);
      } else if (photoField.startsWith('http')) {
        // If it's already a full URL, use it directly
        setImagePreview(photoField);
      } else {
        // If it's a relative path without leading slash, add one
        const baseApiUrl = api.defaults.baseURL || '';
        const baseUrl = baseApiUrl.endsWith('/') ? baseApiUrl.slice(0, -1) : baseApiUrl;
        setImagePreview(`${baseUrl}/${photoField}`);
      }
    } else {
      setImagePreview(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
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
    try {
      // First create the FormData object with both snake_case and camelCase keys
      // to handle different API naming conventions
      const formDataToSend = new FormData();
      
      // Add the data in multiple formats to ensure compatibility
      // Snake case (Django standard)
      formDataToSend.append("first_name", formData.first_name);
      formDataToSend.append("last_name", formData.last_name);
      formDataToSend.append("phone", formData.phone);
      
      // Camel case (potentially used by some APIs)
      formDataToSend.append("firstName", formData.first_name);
      formDataToSend.append("lastName", formData.last_name);
      formDataToSend.append("phoneNumber", formData.phone);
      
      // Only include profile image if it's been changed
      if (profileImage) {
        formDataToSend.append("profile_photo", profileImage);
        formDataToSend.append("profilePhoto", profileImage);
        formDataToSend.append("avatar", profileImage);
        formDataToSend.append("photo", profileImage);
      }
      
      // Set the correct content type for form data
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      console.log("Attempting to update profile with fields:", 
        Object.fromEntries(formDataToSend.entries()));
      
      // Django REST Framework specific endpoints to try
      const endpointsToTry = [
        [`users/profile/`, 'PATCH'],
        [`users/me/`, 'PATCH'],
        [`users/${user.id}/`, 'PATCH'],
        [`auth/users/me/`, 'PATCH'],
        [`api/users/me/`, 'PATCH'],
        [`api/users/${user.id}/`, 'PATCH'],
        [`api/profile/`, 'PATCH'],
        [`accounts/profile/`, 'PATCH'],
        [`users/profile/`, 'PUT'],
        [`users/me/`, 'PUT'],
        [`users/${user.id}/`, 'PUT']
      ];
      
      let success = false;
      let attempts = 0;
      
      for (const [endpoint, method] of endpointsToTry) {
        attempts++;
        try {
          console.log(`Attempt ${attempts}: Trying to ${method} to ${endpoint}`);
          
          let response;
          if (method === 'PATCH') {
            response = await api.patch(endpoint, formDataToSend, config);
          } else {
            response = await api.put(endpoint, formDataToSend, config);
          }
          
          console.log(`Success! Profile updated at ${endpoint} with ${method}`);
          success = true;
          break;
        } catch (error) {
          console.log(`Endpoint ${endpoint} with ${method} failed:`, 
            error.response ? `Status: ${error.response.status}, Message: ${JSON.stringify(error.response.data)}` : error.message);
          // Continue to next endpoint
        }
      }
      
      if (success) {
        toast.success("Profile updated successfully");
        fetchUserProfile(); // Refresh the data
      } else {
        throw new Error(`Failed to update profile after ${attempts} attempts`);
      }
    } catch (error) {
      let errorMessage = "Failed to update profile";
      
      if (error.response) {
        if (error.response.data?.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      toast.error(errorMessage);
      console.error("Error updating profile:", error);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    try {
      // Prepare data with all possible naming conventions for Django REST
      const passwordData = {
        // Django Rest Framework auth patterns
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        re_new_password: passwordForm.confirm_password,
        
        // Django standard patterns
        old_password: passwordForm.current_password,
        password: passwordForm.new_password,
        password1: passwordForm.new_password,
        password2: passwordForm.confirm_password,
        
        // Camel case alternatives
        currentPassword: passwordForm.current_password,
        newPassword: passwordForm.new_password,
        confirmPassword: passwordForm.confirm_password,
        
        // Additional field for some APIs
        username: formData.username,
        email: formData.email
      };
      
      console.log("Attempting to change password");
      
      // Django REST Framework standard endpoints + common variations
      const endpointsToTry = [
        [`users/change-password/`, 'POST'],
        [`users/password/`, 'POST'],
        [`users/password-change/`, 'POST'],
        [`auth/users/set_password/`, 'POST'],
        [`auth/password/change/`, 'POST'],
        [`api/password/change/`, 'POST'],
        [`api/users/change-password/`, 'POST'],
        [`api/auth/password/`, 'POST'],
        [`accounts/password_change/`, 'POST'],
        [`users/password/`, 'PUT'],
        [`users/reset-password/`, 'POST']
      ];
      
      let success = false;
      let attempts = 0;
      
      for (const [endpoint, method] of endpointsToTry) {
        attempts++;
        try {
          console.log(`Attempt ${attempts}: Trying to ${method} to ${endpoint}`);
          
          let response;
          if (method === 'POST') {
            response = await api.post(endpoint, passwordData);
          } else {
            response = await api.put(endpoint, passwordData);
          }
          
          console.log(`Success! Password changed at ${endpoint} with ${method}`);
          success = true;
          break;
        } catch (error) {
          console.log(`Endpoint ${endpoint} with ${method} failed:`, 
            error.response ? `Status: ${error.response.status}, Message: ${JSON.stringify(error.response.data)}` : error.message);
          // Continue to next endpoint
        }
      }
      
      if (success) {
        toast.success("Password updated successfully");
        
        // Reset password form
        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        
        setShowPasswordForm(false);
      } else {
        throw new Error(`Failed to update password after ${attempts} attempts`);
      }
    } catch (error) {
      // Detailed error handling
      let errorMessage = "Failed to update password";
      
      if (error.response) {
        if (error.response.data?.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.status === 401) {
          errorMessage = "Current password is incorrect";
        }
      }
      
      toast.error(errorMessage);
      console.error("Error updating password:", error);
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading profile...</div>;
  }

  return (
    <div className={styles.profileUpdate}>
      <h2 className={styles.sectionTitle}>
        <FaUser /> Profile Settings
      </h2>
      
      <div className={styles.profileContainer}>
        {/* Profile Image */}
        <div className={styles.profileImageSection}>
          <div className={styles.profileImageContainer}>
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile"
                className={styles.profileImage}
              />
            ) : (
              <div className={styles.profilePlaceholder}>
                {formData.first_name.charAt(0)}
                {formData.last_name.charAt(0)}
              </div>
            )}
          </div>
          <div className={styles.imageUploadContainer}>
            <label htmlFor="profile-image" className={styles.uploadButton}>
              <FaUpload /> Change Photo
            </label>
            <input
              type="file"
              id="profile-image"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.fileInput}
            />
          </div>
        </div>
        
        {/* Profile Details Form */}
        <div className={styles.profileDetailsSection}>
          <form onSubmit={handleProfileUpdate}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  disabled
                  className={styles.disabledInput}
                />
                <p className={styles.inputHelper}>Username cannot be changed</p>
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className={styles.disabledInput}
                />
                <p className={styles.inputHelper}>Email cannot be changed</p>
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            
            <div className={styles.formActions}>
              <button type="submit" className={styles.saveButton}>
                <FaSave /> Save Changes
              </button>
            </div>
          </form>
          
          {/* Password Management Section */}
          <div className={styles.passwordSection}>
            <div className={styles.sectionHeader}>
              <h3>Change Password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className={styles.toggleButton}
              >
                <FaKey /> {showPasswordForm ? "Cancel" : "Change Password"}
              </button>
            </div>
            
            {showPasswordForm && (
              <form onSubmit={handlePasswordUpdate}>
                <div className={styles.formGroup}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>New Password</label>
                    <input
                      type="password"
                      name="new_password"
                      value={passwordForm.new_password}
                      onChange={handlePasswordChange}
                      required
                      minLength="8"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={passwordForm.confirm_password}
                      onChange={handlePasswordChange}
                      required
                      minLength="8"
                    />
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveButton}>
                    <FaKey /> Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileUpdate; 