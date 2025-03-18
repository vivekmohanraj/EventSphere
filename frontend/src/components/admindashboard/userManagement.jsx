import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import api from "../../utils/api";
import styles from "../../assets/css/Dashboard.module.css";

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
    <div className={styles.usersManagement}>
      <div className={styles.toolbarContainer}>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <button className={styles.addButton} onClick={handleAddNew}>
          <FaPlus /> Add New User
        </button>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading users...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.first_name} {user.last_name}
                    </td>
                    <td>
                      {user.user_type === "normal"
                        ? "User"
                        : user.user_type === "coordinator"
                        ? "Coordinator"
                        : user.user_type === "admin"
                        ? "Admin"
                        : user.user_type}
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
                  <td colSpan="5" style={{ textAlign: "center" }}>
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
            <h2>{selectedUser ? "Edit User" : "Add New User"}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  disabled={selectedUser}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
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
              <div className={styles.formGroup}>
                <label>Role</label>
                <select
                  name="user_type"
                  value={formData.user_type}
                  onChange={handleInputChange}
                >
                  <option value="normal">User</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {!selectedUser && (
                <div className={styles.formGroup}>
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    onChange={handleInputChange}
                    required={!selectedUser}
                  />
                </div>
              )}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
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
            <h2>User Details</h2>
            <div className={styles.userDetailsContainer}>
              {viewUser.profile_photo ? (
                <div className={styles.userProfileImage}>
                  <img src={viewUser.profile_photo} alt={viewUser.username} />
                </div>
              ) : (
                <div className={styles.userProfilePlaceholder}>
                  {viewUser.first_name?.charAt(0) || viewUser.username?.charAt(0)}
                  {viewUser.last_name?.charAt(0)}
                </div>
              )}

              <div className={styles.userDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>User ID:</span>
                  <span className={styles.detailValue}>{viewUser.id}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Username:</span>
                  <span className={styles.detailValue}>{viewUser.username}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>{viewUser.email}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>First Name:</span>
                  <span className={styles.detailValue}>{viewUser.first_name || "N/A"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Last Name:</span>
                  <span className={styles.detailValue}>{viewUser.last_name || "N/A"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Phone:</span>
                  <span className={styles.detailValue}>{viewUser.phone || "N/A"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Role:</span>
                  <span className={`${styles.detailValue} ${styles.roleChip} ${
                    viewUser.user_type === "normal" 
                      ? styles.normalRole 
                      : viewUser.user_type === "coordinator" 
                      ? styles.coordinatorRole 
                      : styles.adminRole
                  }`}>
                    {viewUser.user_type === "normal"
                      ? "User"
                      : viewUser.user_type === "coordinator"
                      ? "Coordinator"
                      : viewUser.user_type === "admin"
                      ? "Admin"
                      : viewUser.user_type}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Created At:</span>
                  <span className={styles.detailValue}>
                    {new Date(viewUser.created_at).toLocaleString()}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Last Updated:</span>
                  <span className={styles.detailValue}>
                    {new Date(viewUser.updated_at).toLocaleString()}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span className={`${styles.detailValue} ${styles.statusChip} ${
                    viewUser.is_active ? styles.activeStatus : styles.inactiveStatus
                  }`}>
                    {viewUser.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {viewUser.google_id && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Google Account:</span>
                    <span className={styles.detailValue}>
                      <span className={styles.googleConnected}>Connected</span>
                    </span>
                  </div>
                )}
                {viewUser.coordinator_request && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Coordinator Request:</span>
                    <span className={styles.detailValue}>
                      <span className={styles.pendingRequest}>Pending</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(viewUser);
                }}
              >
                Edit User
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
