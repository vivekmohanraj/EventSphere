import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaEye, FaUser, FaEnvelope, FaPhone, FaToggleOn, FaToggleOff, FaUserPlus, FaUsers } from "react-icons/fa";
import api, { tryMultipleEndpoints, directFetch } from "../../utils/api";
import { ACCESS_TOKEN } from "../../utils/constants";
import styles from "../../assets/css/adminDashboard.module.css";
import { normalizeUserData } from "../../utils/dataFormatters";



const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    user_type: "user",
    password: "",
    confirm_password: "",
    is_active: true,
    profile_photo: null
  });
  const [profilePreview, setProfilePreview] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Try multiple possible user endpoints for getting ALL users (not profile)
      const endpoints = [
        "users/",             // Root-level user list from router
        "api/users/",         // API prefix user list
        "users/users/",       // Nested from users app
        "admin/users/",       // Admin-specific endpoint
        "user/",              // Singular naming convention
        "users/list/"         // List-specific endpoint
      ];
      
      console.log("Attempting to fetch users from backend, base URL:", api.defaults.baseURL);
      console.log("Auth token present:", !!localStorage.getItem(ACCESS_TOKEN));
      
      let foundUsers = [];
      let successfulEndpoint = null;
      
      // Try each endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch users from ${endpoint}...`);
          const response = await api.get(endpoint);
          
          // Check if we got valid data
          if (response.data) {
            console.log(`Got response from ${endpoint}:`, response.data);
            
            if (Array.isArray(response.data)) {
              foundUsers = response.data;
              successfulEndpoint = endpoint;
              break;
            } else if (response.data.results && Array.isArray(response.data.results)) {
              foundUsers = response.data.results;
              successfulEndpoint = endpoint;
              break;
            } else if (response.data.users && Array.isArray(response.data.users)) {
              foundUsers = response.data.users;
              successfulEndpoint = endpoint;
              break;
            } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
              // Look for arrays in the response
              for (const key in response.data) {
                if (Array.isArray(response.data[key])) {
                  console.log(`Found array in property: ${key}`);
                  foundUsers = response.data[key];
                  successfulEndpoint = endpoint;
            break;
                }
              }
              
              if (foundUsers.length > 0) break;
            }
          }
        } catch (error) {
          console.warn(`Could not fetch from ${endpoint}:`, error.response?.status || error.message);
        }
      }
      
      if (foundUsers.length > 0) {
        console.log(`Successfully fetched ${foundUsers.length} users from ${successfulEndpoint}`);
        const normalizedUsers = foundUsers.map(normalizeUserData);
        setUsers(normalizedUsers);
      } else {
        // No sample data - just show an empty state and error
        console.error("Could not fetch users from any endpoint");
        setUsers([]);
        toast.error("Unable to load users. Please check your backend connection.");
      }
    } catch (error) {
      console.error("Error in fetchUsers:", error);
      toast.error(`Failed to fetch users: ${error.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      // Try multiple possible endpoints for detailed user info
      let userDetailData = null;
      const endpoints = [
        `users/${userId}/`,
        `api/users/${userId}/`,
        `users/detail/${userId}/`,
        `admin/users/${userId}/`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          if (response.data) {
            userDetailData = response.data;
            break;
          }
        } catch (error) {
          console.warn(`Could not fetch from ${endpoint}`, error);
          // Continue to next endpoint
        }
      }
      
      return userDetailData;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter((user) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchValue) ||
      user.email.toLowerCase().includes(searchValue) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchValue) ||
      (user.phone && user.phone.toLowerCase().includes(searchValue))
    );
  });

  const handleAddNew = () => {
    setSelectedUser(null);
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      user_type: "user",
      password: "",
      confirm_password: "",
      is_active: true,
      profile_photo: null
    });
    setProfilePreview(null);
    setShowModal(true);
  };

  const handleView = async (user) => {
    // First show what we have
    setViewUser(user);
    setShowViewModal(true);
    
    // Then try to get more detailed information
    const userDetails = await fetchUserDetails(user.id);
    if (userDetails) {
      setViewUser(userDetails);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || "",
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      user_type: user.user_type || "user",
      is_active: user.is_active !== undefined ? user.is_active : true,
      profile_photo: null // Reset this on edit
    });
    
    // Set profile preview if exists
    if (user.profile_photo) {
      setProfilePreview(user.profile_photo.startsWith('http') ? 
        user.profile_photo : 
        `${api.defaults.baseURL}${user.profile_photo}`);
    } else {
      setProfilePreview(null);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`users/${userId}/`);
        toast.success("User deleted successfully");
        fetchUsers();
      } catch (error) {
        toast.error("Failed to delete user");
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      // Update the user's active status
      const updatedUser = {
        ...user,
        is_active: !user.is_active
      };
      
      // Try multiple endpoints for the update
      const endpoints = [
        `users/${user.id}/`,
        `api/users/${user.id}/`,
        `users/users/${user.id}/`
      ];
      
      let success = false;
      for (const endpoint of endpoints) {
        try {
          await api.patch(endpoint, { is_active: !user.is_active });
          success = true;
          break;
        } catch (error) {
          console.warn(`Failed to update user status at ${endpoint}`, error);
        }
      }
      
      if (success) {
        toast.success(`User ${user.is_active ? 'disabled' : 'enabled'} successfully`);
        // Close the view modal
        setShowViewModal(false);
        // Refresh the user list
        fetchUsers();
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Error updating user status");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      // Handle file uploads
      if (files && files[0]) {
        setFormData(prev => ({
          ...prev,
          [name]: files[0]
        }));
        
        // Create a preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePreview(reader.result);
        };
        reader.readAsDataURL(files[0]);
      }
    } else {
      // Handle other inputs
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match for new users
    if (!selectedUser) {
      if (formData.password !== formData.confirm_password) {
        toast.error("Passwords don't match");
        return;
      }
      
      // Simple password validation to match login_reg.jsx
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters long");
        return;
      }
      
      const hasUppercase = /[A-Z]/.test(formData.password);
      const hasLowercase = /[a-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      const hasSpecial = /[!@#$%^&*]/.test(formData.password);
      
      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        toast.error("Password must contain uppercase, lowercase, number, and special character");
        return;
      }
    }
    
    try {
      console.log("Submitting user data:", formData);
      
      // Use FormData to handle file uploads
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('phone', formData.phone || '');
      
      // Align with login_reg.jsx - use user_role consistently
      formDataToSend.append('user_role', formData.user_type);
      formDataToSend.append('user_type', formData.user_type);
      formDataToSend.append('is_active', formData.is_active);
      
      // Only include password for new users or if actually changed/filled
      if (formData.password && formData.password.trim() !== '') {
        formDataToSend.append('password', formData.password);
        formDataToSend.append('confirm_password', formData.confirm_password);
      }
      
      // Add profile photo if selected
      if (formData.profile_photo) {
        formDataToSend.append('profile_photo', formData.profile_photo);
      }
      
      console.log("Prepared FormData for API", formData.profile_photo ? "with profile photo" : "without profile photo");
      
      // Set headers for multipart form data
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      if (selectedUser) {
        // Update existing user
        console.log(`Updating user ${selectedUser.id}`);
        try {
          // Try multiple endpoints to update the user
          let response;
          const endpoints = [
            `users/${selectedUser.id}/`,
            `api/users/${selectedUser.id}/`
          ];
          
          let successfulEndpoint = null;
          for (let endpoint of endpoints) {
            try {
              console.log(`Attempting to update user via ${endpoint}`);
              response = await api.patch(endpoint, formDataToSend, config);
              console.log("Update response:", response);
              successfulEndpoint = endpoint;
              break; // Stop trying endpoints if one succeeds
            } catch (error) {
              console.error(`Failed to update using ${endpoint}`, error);
              if (error.response) {
                console.error("Error response status:", error.response.status);
                console.error("Error response data:", error.response.data);
                // Log each field error separately for clarity
                if (typeof error.response.data === 'object') {
                  Object.entries(error.response.data).forEach(([field, errorMsg]) => {
                    console.error(`Field error - ${field}:`, errorMsg);
                  });
                }
              }
              
              if (endpoints.indexOf(endpoint) === endpoints.length - 1) {
                // If this is the last endpoint and it failed, throw the error
                throw error;
              }
            }
          }
          
          toast.success("User updated successfully");
        } catch (error) {
          console.error("Error saving user:", error);
          
          // Create a readable error message
          let errorMessage = "Failed to update user";
          if (error.response?.data) {
            // Handle both array and object error responses
            if (typeof error.response.data === 'object') {
              const errors = Object.entries(error.response.data)
                .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                .join('; ');
              if (errors) errorMessage += `: ${errors}`;
            } else if (typeof error.response.data === 'string') {
              errorMessage += `: ${error.response.data}`;
            }
          }
          
          toast.error(errorMessage);
          throw error;
        }
      } else {
        // Create new user - use the same endpoint as login_reg.jsx
        console.log("Creating new user");
        try {
          // Make sure we have a password for new users
          if (!formData.password) {
            toast.error("Password is required for new users");
            return;
          }
          
          // Use the register endpoint first, matching login_reg.jsx
          let response;
          try {
            response = await api.post("users/register/", formDataToSend, config);
            console.log("Create response:", response);
          } catch (error) {
            // If register endpoint fails, try fallback endpoints
            console.error("Registration endpoint failed:", error.response?.status);
            
            if (error.response?.status === 404) {
              // Try other endpoints if register doesn't exist
              try {
                response = await api.post("users/", formDataToSend, config);
              } catch (err) {
                // One more fallback attempt
                response = await api.post("api/users/", formDataToSend, config);
              }
              console.log("Create response (alternate endpoint):", response);
            } else {
              throw error;
            }
          }
          toast.success("User created successfully");
        } catch (error) {
          console.error("Error creating user:", error);
          
          // Create a readable error message
          let errorMessage = "Failed to create user";
          if (error.response?.data) {
            // Format error messages to match login_reg.jsx handling
            if (typeof error.response.data === 'object') {
              const errors = Object.entries(error.response.data)
                .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                .join('; ');
              if (errors) errorMessage += `: ${errors}`;
            } else if (typeof error.response.data === 'string') {
              errorMessage += `: ${error.response.data}`;
            }
          }
          
          toast.error(errorMessage);
          throw error;
        }
      }

      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading users...</div>;
  }

  return (
    <div className={styles.userManagementContainer}>
      <div className={styles.userSectionHeader}>
        <h2 className={styles.userSectionTitle}>User Management</h2>
        <div className={styles.userSearchBox}>
          <FaSearch className={styles.userSearchIcon} />
          <input
            type="text"
            className={styles.userSearchInput}
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <button className={styles.userAddButton} onClick={handleAddNew}>
          <FaUserPlus /> Add User
        </button>
      </div>

      {filteredUsers.length === 0 ? (
        <div className={styles.userEmptyState}>
          <FaUsers className={styles.userEmptyStateIcon} />
          <h3>No Users Found</h3>
          <p>There are no users matching your search criteria.</p>
        </div>
      ) : (
        <div className={styles.userTableContainer}>
          <table className={styles.userDataTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatarInTable}>
                        {user.profile_photo ? (
                          <img
                            src={api.defaults.baseURL + user.profile_photo}
                            alt={`${user.username}'s avatar`}
                          />
                        ) : (
                          <>
                            {user.first_name?.[0] || ""}
                            {user.last_name?.[0] || ""}
                          </>
                        )}
                      </div>
                      <div>
                        <div className={styles.userNameInTable}>
                          {user.first_name} {user.last_name}
                        </div>
                        <div className={styles.userEmailInTable}>
                          Joined: {new Date(user.created_at || user.date_joined).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={`${styles.userBadge} ${
                        user.user_type === "admin"
                          ? styles.userAdminBadge
                          : user.user_type === "coordinator"
                          ? styles.userCoordinatorBadge
                          : styles.userNormalBadge
                      }`}
                    >
                      {user.user_type === "admin"
                        ? "Admin"
                        : user.user_type === "coordinator"
                        ? "Coordinator"
                        : "User"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.userBadge} ${
                        user.is_active ? styles.userActiveBadge : styles.userInactiveBadge
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.userActionButtons}>
                      <button className={`${styles.userActionBtn} ${styles.userViewBtn}`} onClick={() => handleView(user)}>
                        <FaEye />
                      </button>
                      <button className={`${styles.userActionBtn} ${styles.userEditBtn}`} onClick={() => handleEdit(user)}>
                        <FaEdit />
                      </button>
                      <button className={`${styles.userActionBtn} ${styles.userDeleteBtn}`} onClick={() => handleDelete(user.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.userModalBackdrop}>
          <div className={styles.userModal}>
            <div className={styles.modalHeader}>
              <h3>
                {selectedUser ? <FaEdit /> : <FaPlus />}
                {selectedUser ? "Edit User" : "Add New User"}
              </h3>
              <button 
                className={styles.modalCloseBtn} 
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.profilePhotoSection}>
                <div 
                  className={styles.photoUploadPreview}
                  style={{ 
                    backgroundImage: profilePreview ? `url(${profilePreview})` : 'none'
                  }}
                >
                  {!profilePreview && (
                    <div className={styles.photoPlaceholder}>
                      {formData.first_name ? formData.first_name.charAt(0).toUpperCase() : ''}
                      {formData.last_name ? formData.last_name.charAt(0).toUpperCase() : ''}
                    </div>
                  )}
                  <input
                    type="file"
                    name="profile_photo"
                    id="profile_photo"
                    accept="image/*"
                    onChange={handleInputChange}
                    className={styles.photoInput}
                  />
                  <label htmlFor="profile_photo" className={styles.photoUploadLabel}>
                    {profilePreview ? 'Change Photo' : 'Upload Photo'}
                  </label>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Username</label>
                  <input
                    type="text"
                    name="username"
                    className={styles.formControl}
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    name="email"
                    className={styles.formControl}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    className={styles.formControl}
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    className={styles.formControl}
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    className={styles.formControl}
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>User Role</label>
                  <select
                    name="user_type"
                    className={styles.formControl}
                    value={formData.user_type}
                    onChange={handleInputChange}
                  >
                    <option value="user">Normal User</option>
                    <option value="coordinator">Event Coordinator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <small className={styles.helpText}>
                    Normal users can browse and attend events. Coordinators can create and manage events.
                  </small>
                </div>
              </div>
              
              {!selectedUser && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Password</label>
                    <input
                      type="password"
                      name="password"
                      className={styles.formControl}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <small className={styles.helpText}>
                      Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                    </small>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Confirm Password</label>
                    <input
                      type="password"
                      name="confirm_password"
                      className={styles.formControl}
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </>
              )}
              
              <div className={styles.formCheckGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    disabled={formData.user_type === 'admin'}
                  />
                  <span>Active</span>
                </label>
                {formData.user_type === 'admin' && (
                  <p className={styles.helpText}>Admin users must remain active</p>
                )}
              </div>
              
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.saveButton}
                >
                  {selectedUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewUser && (
        <div className={styles.userModalBackdrop}>
          <div className={styles.userModal}>
            <div className={styles.modalHeader}>
              <h3>
                <FaUser />
                User Details
              </h3>
              <button 
                className={styles.modalCloseBtn} 
                onClick={() => setShowViewModal(false)}
              >
                &times;
              </button>
            </div>
            
            <div className={styles.userDetailHeader}>
              <div className={styles.userDetailAvatar}>
                {viewUser.profile_photo ? (
                  <img src={viewUser.profile_photo} alt={viewUser.username} />
                ) : (
                  <span>
                    {viewUser.first_name ? viewUser.first_name.charAt(0).toUpperCase() : ''}
                    {viewUser.last_name ? viewUser.last_name.charAt(0).toUpperCase() : ''}
                  </span>
                )}
              </div>
              
              <div className={styles.userDetailInfo}>
                <h2>{viewUser.first_name} {viewUser.last_name}</h2>
                <div className={styles.userMeta}>
                  <span className={`${styles.roleBadge} ${
                    viewUser.user_type === "admin" ? styles.adminRole :
                    viewUser.user_type === "coordinator" ? styles.coordinatorRole :
                    styles.userRole
                  }`}>
                    {viewUser.user_type === "admin"
                      ? "Admin"
                      : viewUser.user_type === "coordinator"
                      ? "Coordinator"
                      : "User"}
                  </span>
                  
                  <span className={`${styles.statusDot} ${
                    viewUser.is_active ? styles.activeDot : styles.inactiveDot
                  }`}>
                    {viewUser.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                
                <div className={styles.contactInfo}>
                  <div className={styles.contactItem}>
                    <FaEnvelope className={styles.contactIcon} />
                    <span>{viewUser.email}</span>
                  </div>
                  {viewUser.phone && (
                    <div className={styles.contactItem}>
                      <FaPhone className={styles.contactIcon} />
                      <span>{viewUser.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.userDetailBody}>
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Account Information</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>User ID</span>
                    <span className={styles.detailValue}>{viewUser.id}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Username</span>
                    <span className={styles.detailValue}>{viewUser.username}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Created</span>
                    <span className={styles.detailValue}>
                      {new Date(viewUser.created_at || viewUser.date_joined).toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Last Updated</span>
                    <span className={styles.detailValue}>
                      {new Date(viewUser.updated_at || new Date()).toLocaleString()}
                    </span>
                  </div>
                  
                  {viewUser.google_id && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Google Account</span>
                      <span className={`${styles.tagBadge} ${styles.googleBadge}`}>
                        Connected
                      </span>
                    </div>
                  )}
                  
                  {viewUser.coordinator_request && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Coordinator Request</span>
                      <span className={`${styles.tagBadge} ${styles.pendingBadge}`}>
                        Pending
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
              
              <div className={styles.actionGroup}>
                {/* Don't show toggle button for active admins */}
                {!(viewUser.user_type === 'admin' && viewUser.is_active) && (
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${
                      viewUser.is_active ? styles.disableBtn : styles.enableBtn
                    }`}
                    onClick={() => handleToggleStatus(viewUser)}
                  >
                    {viewUser.is_active ? (
                      <>
                        <FaToggleOn className={styles.btnIcon} />
                        Disable User
                      </>
                    ) : (
                      <>
                        <FaToggleOff className={styles.btnIcon} />
                        Enable User
                      </>
                    )}
                  </button>
                )}
                
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.editBtn}`}
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewUser);
                  }}
                >
                  <FaEdit className={styles.btnIcon} />
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
