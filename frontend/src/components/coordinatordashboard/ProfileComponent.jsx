import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCamera,
  FaCheck,
  FaSpinner,
  FaUserCheck,
  FaCalendarAlt
} from 'react-icons/fa';
import { Eye, EyeOff } from 'lucide-react';
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
    profile_photo: null,
    user_role: '',
    created_at: ''
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        profile_photo: userProfile.profile_photo || null,
        user_role: userProfile.user_role || '',
        created_at: userProfile.created_at || ''
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
      const response = await api.get("/users/profile/");
      
      if (response.data) {
        const profile = response.data;
        setProfileData({
          username: profile.username || '',
          email: profile.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          profile_photo: profile.profile_photo || null,
          user_role: profile.user_role || '',
          created_at: profile.created_at || ''
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
      
      // Fixed URL with leading slash to prevent double slash issue
      const response = await api.patch('/users/profile/', formData, {
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
      const response = await api.post('/users/change-password/', {
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

      <div className={styles.infoRow}>
        <div className={styles.infoLabel}>
          <FaUserCheck />
          <span>Role</span>
        </div>
        <div className={styles.infoValue}>
          {(profileData.user_role || 'Coordinator').charAt(0).toUpperCase() + (profileData.user_role || 'Coordinator').slice(1)}
        </div>
      </div>
      
      {profileData.created_at && (
        <div className={styles.infoRow}>
          <div className={styles.infoLabel}>
            <FaCalendarAlt />
            <span>Joined</span>
          </div>
          <div className={styles.infoValue}>
            {new Date(profileData.created_at).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      )}
      
      <div className="d-grid gap-3 mt-4">
        <Button 
          variant="primary"
          onClick={() => setEditMode(true)}
          className="py-2 px-4"
          style={{ borderRadius: '8px', backgroundColor: '#ff4a17', border: 'none' }}
        >
          Edit Profile
        </Button>
        <Button 
          variant="outline-secondary"
          onClick={() => setShowPasswordForm(true)}
          className="py-2 px-4"
          style={{ borderRadius: '8px' }}
        >
          Change Password
        </Button>
      </div>
    </div>
  );

  const renderEditForm = () => (
    <Form>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: '500', color: '#555' }}>First Name</Form.Label>
            <Form.Control
              type="text"
              name="first_name"
              value={profileData.first_name}
              onChange={handleInputChange}
              isInvalid={!!formErrors.first_name}
              className="py-2 px-3"
              style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
            />
            {formErrors.first_name && (
              <Form.Text className="text-danger">
                {formErrors.first_name}
              </Form.Text>
            )}
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: '500', color: '#555' }}>Last Name</Form.Label>
            <Form.Control
              type="text"
              name="last_name"
              value={profileData.last_name}
              onChange={handleInputChange}
              isInvalid={!!formErrors.last_name}
              className="py-2 px-3"
              style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
            />
            {formErrors.last_name && (
              <Form.Text className="text-danger">
                {formErrors.last_name}
              </Form.Text>
            )}
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: '500', color: '#555' }}>Email</Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={profileData.email}
          onChange={handleInputChange}
          isInvalid={!!formErrors.email}
          className="py-2 px-3"
          style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
        />
        {formErrors.email && (
          <Form.Text className="text-danger">
            {formErrors.email}
          </Form.Text>
        )}
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: '500', color: '#555' }}>Phone Number</Form.Label>
        <div className="input-group">
          <span className="input-group-text" id="basic-addon1" style={{ borderRadius: '8px 0 0 8px', border: '1px solid #dde1e7', backgroundColor: '#f7f9fc' }}>
            +91
          </span>
          <Form.Control
            type="tel"
            name="phone"
            value={profileData.phone}
            onChange={handleInputChange}
            isInvalid={!!formErrors.phone}
            placeholder="Enter your phone number"
            className="py-2 px-3"
            style={{ borderRadius: '0 8px 8px 0', border: '1px solid #dde1e7', boxShadow: 'none' }}
          />
        </div>
        {formErrors.phone && (
          <Form.Text className="text-danger">
            {formErrors.phone}
          </Form.Text>
        )}
      </Form.Group>
      
      <div className="d-grid gap-3 mt-4">
        <Button 
          variant="primary"
          onClick={handleUpdateProfile}
          disabled={isLoading}
          className="py-2 px-4"
          style={{ borderRadius: '8px', backgroundColor: '#ff4a17', border: 'none' }}
        >
          {isLoading ? <FaSpinner className="fa-spin me-2" /> : <FaCheck className="me-2" />}
          Save Changes
        </Button>
        <Button 
          variant="outline-secondary"
          onClick={() => setEditMode(false)}
          disabled={isLoading}
          className="py-2 px-4"
          style={{ borderRadius: '8px' }}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );

  const renderPasswordForm = () => (
    <Form>
      <h4 className="mb-4" style={{ fontWeight: '600', color: '#333' }}>Change Your Password</h4>
      
      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: '500', color: '#555' }}>Current Password</Form.Label>
        <div className="position-relative">
          <Form.Control
            type={showCurrentPassword ? "text" : "password"}
            name="current_password"
            value={passwordData.current_password}
            onChange={handlePasswordChange}
            isInvalid={!!passwordErrors.current_password}
            className="py-2 px-3"
            style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
          />
          {showCurrentPassword ? (
            <EyeOff
              size={20}
              className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
              onClick={() => setShowCurrentPassword(false)}
              style={{ color: '#6b7280', cursor: 'pointer' }}
            />
          ) : (
            <Eye
              size={20}
              className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
              onClick={() => setShowCurrentPassword(true)}
              style={{ color: '#6b7280', cursor: 'pointer' }}
            />
          )}
        </div>
        {passwordErrors.current_password && (
          <Form.Text className="text-danger">
            {passwordErrors.current_password}
          </Form.Text>
        )}
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: '500', color: '#555' }}>New Password</Form.Label>
        <div className="position-relative">
          <Form.Control
            type={showNewPassword ? "text" : "password"}
            name="new_password"
            value={passwordData.new_password}
            onChange={handlePasswordChange}
            isInvalid={!!passwordErrors.new_password}
            className="py-2 px-3"
            style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
          />
          {showNewPassword ? (
            <EyeOff
              size={20}
              className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
              onClick={() => setShowNewPassword(false)}
              style={{ color: '#6b7280', cursor: 'pointer' }}
            />
          ) : (
            <Eye
              size={20}
              className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
              onClick={() => setShowNewPassword(true)}
              style={{ color: '#6b7280', cursor: 'pointer' }}
            />
          )}
        </div>
        {passwordErrors.new_password && (
          <Form.Text className="text-danger">
            {passwordErrors.new_password}
          </Form.Text>
        )}
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: '500', color: '#555' }}>Confirm New Password</Form.Label>
        <div className="position-relative">
          <Form.Control
            type={showConfirmPassword ? "text" : "password"}
            name="confirm_password"
            value={passwordData.confirm_password}
            onChange={handlePasswordChange}
            isInvalid={!!passwordErrors.confirm_password}
            className="py-2 px-3"
            style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
          />
          {showConfirmPassword ? (
            <EyeOff
              size={20}
              className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
              onClick={() => setShowConfirmPassword(false)}
              style={{ color: '#6b7280', cursor: 'pointer' }}
            />
          ) : (
            <Eye
              size={20}
              className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
              onClick={() => setShowConfirmPassword(true)}
              style={{ color: '#6b7280', cursor: 'pointer' }}
            />
          )}
        </div>
        {passwordErrors.confirm_password && (
          <Form.Text className="text-danger">
            {passwordErrors.confirm_password}
          </Form.Text>
        )}
      </Form.Group>
      
      <div className="d-grid gap-3 mt-4">
        <Button 
          variant="primary"
          onClick={handleChangePassword}
          disabled={isLoading}
          className="py-2 px-4"
          style={{ borderRadius: '8px', backgroundColor: '#ff4a17', border: 'none' }}
        >
          {isLoading ? <FaSpinner className="fa-spin me-2" /> : <FaCheck className="me-2" />}
          Change Password
        </Button>
        <Button 
          variant="outline-secondary"
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
          className="py-2 px-4"
          style={{ borderRadius: '8px' }}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );

  return (
    <div className="mx-auto" style={{ maxWidth: '800px' }}>
      <div className="card shadow p-4 mb-5">
        {isLoading && !editMode && !showPasswordForm && (
          <div className="text-center py-5">
            <FaSpinner className="fa-spin mb-3" style={{ fontSize: '2rem', color: '#ff4a17' }} />
            <p className="text-muted">Loading profile information...</p>
          </div>
        )}
        
        {successMessage && (
          <div className="alert alert-success d-flex align-items-center">
            <FaCheck className="me-2" /> {successMessage}
          </div>
        )}
        
        <div className="text-center mb-4">
          <h3 style={{ fontWeight: '600', color: '#333', fontSize: '1.8rem' }}>
            My Profile
          </h3>
          <p className="text-muted">Manage your account information and preferences</p>
        </div>
        
        <div className="row">
          <div className="col-md-4 text-center mb-4">
            <div className="position-relative mx-auto" style={{ width: '150px', height: '150px' }}>
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt="Profile" 
                  className="rounded-circle img-thumbnail"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23f5f5f5" width="100" height="100"/><text fill="%23888" font-family="Arial" font-size="30" text-anchor="middle" x="50" y="60">?</text></svg>';
                  }}
                />
              ) : (
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '150px', 
                    height: '150px', 
                    backgroundColor: '#f5f5f5', 
                    fontSize: '3rem',
                    color: '#ff4a17'
                  }}
                >
                  {profileData.first_name && profileData.last_name ? (
                    `${profileData.first_name.charAt(0)}${profileData.last_name.charAt(0)}`
                  ) : 'U'}
                </div>
              )}
              
              {editMode && (
                <div className="position-absolute bottom-0 end-0">
                  <label 
                    htmlFor="photo-upload" 
                    className="btn btn-sm btn-light rounded-circle p-2 shadow-sm"
                    style={{ cursor: 'pointer' }}
                  >
                    <FaCamera style={{ color: '#555' }} />
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
            </div>
            {editMode && (
              <p className="small text-muted mt-2">Click the camera icon to change your profile photo</p>
            )}
          </div>
          
          <div className="col-md-8">
            {!editMode && !showPasswordForm && renderProfileInfo()}
            {editMode && !showPasswordForm && renderEditForm()}
            {showPasswordForm && renderPasswordForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileComponent; 