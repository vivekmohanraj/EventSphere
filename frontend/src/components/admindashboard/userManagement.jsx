import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import api from "../../utils/api";
import styles from "../../assets/css/adminDashboard.module.css";

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
    user_type: "normal",
    password: "",
  });
  const [viewUser, setViewUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Try multiple possible endpoints for user listing
      let userData = null;
      const endpoints = [
        "users/all/",
        "users/user-stats/",
        "users/",
        "api/users/",
        "admin/users/"
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch users from ${endpoint}`);
          const response = await api.get(endpoint);
          if (response.data && Array.isArray(response.data)) {
            userData = response.data;
            break;
          }
        } catch (error) {
          console.warn(`Could not fetch from ${endpoint}`, error);
          // Continue to next endpoint
        }
      }
      
      if (userData) {
        setUsers(userData);
      } else {
        toast.error("Could not fetch users from any endpoint");
        setUsers([]);
      }
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Error fetching users:", error);
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
    return (
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      user_type: "normal",
      password: "",
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      user_type: user.user_type || "normal",
      password: "",
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        // Edit existing user - try multiple endpoint patterns
        try {
          await api.put(`users/${selectedUser.id}/`, formData);
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // Try patch if put fails
            await api.patch(`users/${selectedUser.id}/`, formData);
          } else {
            throw error;
          }
        }
        toast.success("User updated successfully");
      } else {
        // Add new user - try multiple endpoint patterns
        try {
          await api.post("users/create/", formData);
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // Try register endpoint if create fails
            await api.post("users/register/", formData);
          } else {
            throw error;
          }
        }
        toast.success("User created successfully");
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.error ||
        "Failed to process user data"
      );
      console.error("Error saving user:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className={styles.contentContainer}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Users Management</h2>
        <button
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={handleAddNew}
        >
          <FaPlus /> Add New User
        </button>
      </div>

      <div className={styles.filterContainer}>
        <div className={styles.searchBar}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading users...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{`${user.first_name || ""} ${user.last_name || ""}`}</td>
                    <td>{user.email}</td>
                    <td>{user.username}</td>
                    <td>{user.phone || "N/A"}</td>
                    <td>
                      <span
                        className={`${styles.statusIndicator} ${
                          user.user_type === "admin"
                            ? styles.statusActive
                            : user.user_type === "coordinator"
                            ? styles.statusPending
                            : ""
                        }`}
                      >
                        {user.user_type === "normal"
                          ? "User"
                          : user.user_type === "coordinator"
                          ? "Coordinator"
                          : "Admin"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          onClick={() => handleView(user)}
                        >
                          <FaEye />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.editButton}`}
                          onClick={() => handleEdit(user)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDelete(user.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.noData}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>{selectedUser ? "Edit User" : "Add New User"}</h3>
            <form onSubmit={handleSubmit}>
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
                  <label className={styles.formLabel}>Role</label>
                  <select
                    name="user_type"
                    className={styles.formControl}
                    value={formData.user_type}
                    onChange={handleInputChange}
                  >
                    <option value="normal">User</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {!selectedUser && (
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
                </div>
              )}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.secondaryButton}`}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.button} ${styles.primaryButton}`}
                >
                  {selectedUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewUser && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>User Details</h3>
            <div className={styles.userDetails}>
              {viewUser.profile_photo ? (
                <div className={styles.userAvatar}>
                  <img src={viewUser.profile_photo} alt={viewUser.username} />
                </div>
              ) : (
                <div className={styles.userAvatarPlaceholder}>
                  <span>
                    {viewUser.first_name ? viewUser.first_name.charAt(0).toUpperCase() : ''}
                    {viewUser.last_name ? viewUser.last_name.charAt(0).toUpperCase() : ''}
                  </span>
                </div>
              )}

              <div className={styles.detailsContainer}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>User ID:</span>
                  <span className={styles.detailValue}>{viewUser.id}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Username:</span>
                  <span className={styles.detailValue}>{viewUser.username}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>{viewUser.email}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>First Name:</span>
                  <span className={styles.detailValue}>{viewUser.first_name || "N/A"}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Last Name:</span>
                  <span className={styles.detailValue}>{viewUser.last_name || "N/A"}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Phone:</span>
                  <span className={styles.detailValue}>{viewUser.phone || "N/A"}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Role:</span>
                  <span className={`${styles.statusIndicator} ${
                    viewUser.user_type === "admin" 
                      ? styles.statusActive 
                      : viewUser.user_type === "coordinator" 
                      ? styles.statusPending 
                      : ""
                  }`}>
                    {viewUser.user_type === "normal"
                      ? "User"
                      : viewUser.user_type === "coordinator"
                      ? "Coordinator"
                      : "Admin"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Created At:</span>
                  <span className={styles.detailValue}>
                    {new Date(viewUser.created_at).toLocaleString()}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Last Updated:</span>
                  <span className={styles.detailValue}>
                    {new Date(viewUser.updated_at).toLocaleString()}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span className={`${styles.statusIndicator} ${
                    viewUser.is_active ? styles.statusActive : styles.statusRejected
                  }`}>
                    {viewUser.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {viewUser.google_id && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Google Account:</span>
                    <span className={styles.statusActive}>Connected</span>
                  </div>
                )}
                {viewUser.coordinator_request && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Coordinator Request:</span>
                    <span className={styles.statusPending}>Pending</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(viewUser);
                }}
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
