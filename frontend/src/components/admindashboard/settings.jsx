import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaLock, FaEnvelope, FaBell, FaPalette } from 'react-icons/fa';
import api from '../../utils/api';
import styles from '../../assets/css/settings.module.css';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('account');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
    notifications: {
      email: true,
      browser: true,
      requests: true,
      payments: true
    },
    theme: 'light'
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await api.post('change-password/', {
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      });
      toast.success('Password updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      toast.error('Failed to update password');
    }
  };

  const handleNotificationChange = (key) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsSidebar}>
        <button
          className={`${styles.sectionButton} ${activeSection === 'account' ? styles.active : ''}`}
          onClick={() => setActiveSection('account')}
        >
          <FaLock /> Security
        </button>
        <button
          className={`${styles.sectionButton} ${activeSection === 'notifications' ? styles.active : ''}`}
          onClick={() => setActiveSection('notifications')}
        >
          <FaBell /> Notifications
        </button>
        <button
          className={`${styles.sectionButton} ${activeSection === 'appearance' ? styles.active : ''}`}
          onClick={() => setActiveSection('appearance')}
        >
          <FaPalette /> Appearance
        </button>
      </div>

      <div className={styles.settingsContent}>
        {activeSection === 'account' && (
          <div className={styles.section}>
            <h2>Security Settings</h2>
            <form onSubmit={handlePasswordChange} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    currentPassword: e.target.value
                  }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))}
                />
              </div>
              <button type="submit" className={styles.saveButton}>
                Update Password
              </button>
            </form>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className={styles.section}>
            <h2>Notification Preferences</h2>
            <div className={styles.notificationSettings}>
              {Object.entries(formData.notifications).map(([key, value]) => (
                <div key={key} className={styles.notificationOption}>
                  <label>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleNotificationChange(key)}
                    />
                    {key.charAt(0).toUpperCase() + key.slice(1)} Notifications
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div className={styles.section}>
            <h2>Appearance Settings</h2>
            <div className={styles.themeSelector}>
              <label>Theme</label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  theme: e.target.value
                }))}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;