import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaUserCog, FaSearch } from "react-icons/fa";
import api from "../utils/api";
import styles from "../assets/css/usersManagement.module.css";

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("users/user-stats/");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching users:", error);

      toast.error("Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await api.patch(`users/${userId}/role/`, { role: newRole });
      toast.success("User role updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`users/${userId}/`);
        toast.success("User deleted successfully");
        fetchUsers();
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.user_role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Users Management</h2>
        <div className={styles.filters}>
          <div className={styles.searchBar}>
            <FaSearch />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.roleFilter}
          >
            <option value="all">All Roles</option>
            <option value="normal">Users</option>
            <option value="coordinator">Coordinators</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className={styles.userCell}>
                      <img
                        src={user.profile_photo || "/default-avatar.png"}
                        alt={user.username}
                        className={styles.avatar}
                      />
                      <div className={styles.userInfo}>
                        <span className={styles.name}>
                          {user.first_name} {user.last_name}
                        </span>
                        <span className={styles.username}>
                          @{user.username}
                        </span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`${styles.roleChip} ${styles[user.user_role]}`}
                      >
                        {user.user_role}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() =>
                            handleRoleUpdate(user.id, "coordinator")
                          }
                          className={`${styles.actionButton} ${styles.promoteButton}`}
                          title="Make Coordinator"
                        >
                          <FaUserCog />
                        </button>
                        <button
                          className={styles.actionButton}
                          title="Edit User"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className={styles.noData}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
