import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaSave, FaUpload, FaKey, FaUser, FaEnvelope, FaPhone, FaCamera, FaInfoCircle } from "react-icons/fa";
import api, { getMediaUrl } from "../../utils/api";
import styles from "../../assets/css/adminDashboard.module.css";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../../utils/constants";
import { z } from "zod"; // Import zod for validation

// Define password validation schema using Zod
const passwordSchema = z.object({
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[!@#$%^&*]/, "Must contain at least one special character"),
  confirm_password: z.string()
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});

const ProfileUpdate = ({ userProfile, setUserProfile, setProfilePhotoPreview }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    username: "",
    current_password: "", // Added field for verification
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [formError, setFormError] = useState("");
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
    
    // Clear any form error when user starts typing
    if (name === "current_password") {
      setFormError("");
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
    
    // Clear related error when user types
    if (passwordErrors[name]) {
      const newErrors = {...passwordErrors};
      delete newErrors[name];
      setPasswordErrors(newErrors);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
    }
  };

  const validatePasswordForm = () => {
    try {
      passwordSchema.parse(passwordForm);
      setPasswordErrors({});
      return true;
    } catch (error) {
      const formattedErrors = {};
      error.errors.forEach(err => {
        formattedErrors[err.path[0]] = err.message;
      });
      setPasswordErrors(formattedErrors);
      return false;
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Require current password for profile update
    if (!formData.current_password) {
      setFormError("Please enter your current password to save changes");
      return;
    }
    
    try {
      const updateData = new FormData();
      updateData.append("first_name", formData.first_name);
      updateData.append("last_name", formData.last_name);
      updateData.append("phone", formData.phone);
      updateData.append("current_password", formData.current_password);
      
      if (profileImage) {
        updateData.append("profile_photo", profileImage);
      }
      
      // Try multiple endpoints
      const endpoints = [
        `users/profile/update/`,
        `users/update/`,
        `users/${user.id}/`,
      ];
      
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.patch(endpoint, updateData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          success = true;
          
          // Update the user profile in parent components if needed
          if (setUserProfile) {
            setUserProfile({
              ...userProfile,
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone: formData.phone,
            });
          }
          
          // Update profile photo preview if needed
          if (response.data.profile_photo && setProfilePhotoPreview) {
            setProfilePhotoPreview(response.data.profile_photo);
          }
          
          toast.success("Profile updated successfully");
          
          // Clear password field after successful update
          setFormData({
            ...formData,
            current_password: ""
          });
          
          break;
        } catch (error) {
          console.warn(`Failed to update profile using ${endpoint}`);
        }
      }
      
      if (!success) {
        throw new Error("Could not update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Handle specific error for invalid password
      if (error.response?.data?.detail?.includes("password") || 
          error.response?.data?.current_password) {
        setFormError("Current password is incorrect");
      } else {
        toast.error("Failed to update profile");
      }
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate password using schema before submitting
    if (!validatePasswordForm()) {
      return;
    }
    
    // Check if passwords match (although our schema already does this)
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors({
        confirm_password: "Passwords don't match"
      });
      return;
    }
    
    try {
      // Try multiple endpoints
      const endpoints = [
        "users/change-password/",
        "auth/password/change/",
        "password/change/",
      ];
      
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          await api.post(endpoint, {
            current_password: passwordForm.current_password,
            new_password: passwordForm.new_password,
          });
          
          success = true;
          toast.success("Password updated successfully");
          
          // Reset password form
          setPasswordForm({
            current_password: "",
            new_password: "",
            confirm_password: "",
          });
          
          // Hide password form
          setShowPasswordForm(false);
          
          break;
        } catch (error) {
          console.warn(`Failed to change password using ${endpoint}`);
        }
      }
      
      if (!success) {
        throw new Error("Could not change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      
      // Handle specific error for incorrect current password
      if (error.response?.data?.current_password || 
          error.response?.data?.detail?.includes("password")) {
        setPasswordErrors({
          current_password: "Current password is incorrect"
        });
      } else {
        toast.error("Failed to change password");
      }
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading profile...</div>;
  }

  return (
    <div className={styles.contentContainer}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>My Profile</h2>
      </div>
      
      {loading ? (
        <div className={styles.loader}>Loading profile...</div>
      ) : (
        <div className={styles.profileContainer}>
          {/* Profile Image Section */}
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
                  {formData.first_name ? formData.first_name.charAt(0).toUpperCase() : ""}
                  {formData.last_name ? formData.last_name.charAt(0).toUpperCase() : ""}
                </div>
              )}
            </div>
            <div className={styles.imageUploadContainer}>
              <label htmlFor="profile-image" className={styles.uploadButton}>
                <FaCamera /> Change Photo
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
              
              {/* Verification password field */}
              <div className={styles.formGroup}>
                <label>Enter Password to Save Changes</label>
                <input
                  type="password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your current password to verify"
                />
                {formError && (
                  <p className={styles.formError}>{formError}</p>
                )}
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
                    {passwordErrors.current_password && (
                      <p className={styles.formError}>{passwordErrors.current_password}</p>
                    )}
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
                      {passwordErrors.new_password && (
                        <p className={styles.formError}>{passwordErrors.new_password}</p>
                      )}
                      <div className={styles.passwordRequirements}>
                        <p><FaInfoCircle /> Password must:</p>
                        <ul>
                          <li>Be at least 8 characters long</li>
                          <li>Include an uppercase letter</li>
                          <li>Include a lowercase letter</li>
                          <li>Include a number</li>
                          <li>Include a special character (!@#$%^&*)</li>
                        </ul>
                      </div>
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
                      {passwordErrors.confirm_password && (
                        <p className={styles.formError}>{passwordErrors.confirm_password}</p>
                      )}
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
      )}
    </div>
  );
};

export default ProfileUpdate; 