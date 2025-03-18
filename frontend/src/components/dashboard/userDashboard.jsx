import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUserShield,
  FaEdit,
  FaSignOutAlt,
  FaHome,
  FaTicketAlt,
  FaHeart,
  FaCog,
  FaBell,
  FaIdCard,
  FaGlobe,
  FaBirthdayCake,
  FaSuitcase,
  FaListAlt,
  FaLanguage,
  FaInfoCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api, { getMediaUrl } from "../../utils/api";
import styles from "../../assets/css/Dashboard.module.css";
import { ACCESS_TOKEN } from "../../utils/constants";
import ProfileUpdate from './ProfileUpdate';
import CoordinatorRequestForm from '../userdashboard/CoordinatorRequestForm';
import { jwtDecode } from 'jwt-decode';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [userProfile, setUserProfile] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    date_joined: '',
    profile_photo: null,
    events_attended: 0,
    events_registered: 0,
    feedback_count: 0,
    bio: '',
    preferences: '',
    job_title: '',
    organization: '',
    languages: '',
    website: '',
    interests: '',
    birthday: '',
    last_login: ''
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  const [showCoordinatorRequest, setShowCoordinatorRequest] = useState(false);
  const [coordinatorRequests, setCoordinatorRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchCoordinatorRequests();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Try multiple endpoints to find the one that works
      const endpoints = [
        "users/profile/",
        "api/users/me/",
        "api/profile/",
        "auth/users/me/",
        "users/me/"
      ];
      
      let userData = null;
      let succeeded = false;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch profile from ${endpoint}`);
          const response = await api.get(endpoint);
          
          if (response.data) {
            userData = response.data;
            console.log(`Successfully fetched profile from ${endpoint}`);
            succeeded = true;
            break;
          }
        } catch (error) {
          console.warn(`Failed to fetch profile from ${endpoint}:`, error);
        }
      }
      
      if (!succeeded) {
        // Last attempt with direct fetch and explicit headers
        try {
          const token = localStorage.getItem(ACCESS_TOKEN);
          const response = await fetch(`${api.defaults.baseURL}users/profile/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            userData = await response.json();
            succeeded = true;
          }
        } catch (error) {
          console.error("Final profile fetch attempt failed:", error);
        }
      }
      
      if (succeeded && userData) {
        const filledProfile = {
          ...userProfile,
          ...userData,
        };
        
        setUserProfile(filledProfile);
        
        // Handle profile photo URL
        if (userData.profile_photo) {
          // Use the getMediaUrl utility function
          setProfilePhotoPreview(getMediaUrl(userData.profile_photo));
        }
      } else {
        // Create a fallback profile from JWT token if possible
        try {
          const token = localStorage.getItem(ACCESS_TOKEN);
          if (token) {
            const decoded = jwtDecode(token);
            const fallbackProfile = {
              ...userProfile,
              username: decoded.username || "User",
              email: decoded.email || "",
              first_name: decoded.first_name || "",
              last_name: decoded.last_name || "",
            };
            setUserProfile(fallbackProfile);
          }
        } catch (tokenError) {
          console.error("Could not extract profile from token:", tokenError);
          toast.error("Failed to load profile data");
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinatorRequests = async () => {
    try {
      const endpoints = [
        "coordinator-requests/",
        "api/coordinator-requests/",
        "users/coordinator-requests/"
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          if (response.data) {
            setCoordinatorRequests(response.data);
            return;
          }
        } catch (error) {
          console.warn(`Failed to fetch coordinator requests from ${endpoint}:`, error);
        }
      }
    } catch (error) {
      console.error("Error fetching coordinator requests:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    navigate('/login_reg');
  };
  
  const getPendingCoordinatorRequest = () => {
    return coordinatorRequests.find(request => 
      request.user === userProfile.id || 
      request.user_id === userProfile.id || 
      request.username === userProfile.username
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const renderProfile = () => {
    if (loading) {
      return <div className={styles.loader}>Loading profile data...</div>;
    }

    return (
      <>
        <div className={styles.profileSection}>
          <div className={styles.profileHeader}>
            <div className={styles.profilePhotoContainer}>
              {profilePhotoPreview ? (
                <img 
                  src={profilePhotoPreview} 
                  alt="Profile" 
                  className={styles.profilePhoto}
                />
              ) : (
                <div className={styles.profilePhotoPlaceholder}>
                  <span>
                    {userProfile.first_name ? userProfile.first_name.charAt(0).toUpperCase() : ''}
                    {userProfile.last_name ? userProfile.last_name.charAt(0).toUpperCase() : ''}
                  </span>
                </div>
              )}
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>
                {userProfile.first_name} {userProfile.last_name}
              </h2>
              <p className={styles.profileRole}>Regular User</p>
              <div className={styles.profileStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{userProfile.events_attended || 0}</span>
                  <span className={styles.statLabel}>Events Attended</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{userProfile.events_registered || 0}</span>
                  <span className={styles.statLabel}>Events Registered</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{userProfile.feedback_count || 0}</span>
                  <span className={styles.statLabel}>Feedback Given</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.profileDetails}>
            <div className={styles.detailCard}>
              <h3>Personal Information</h3>
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <FaUser />
                </div>
                <div className={styles.detailContent}>
                  <div className={styles.detailLabel}>Username</div>
                  <div className={styles.detailValue}>{userProfile.username}</div>
                </div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <FaEnvelope />
                </div>
                <div className={styles.detailContent}>
                  <div className={styles.detailLabel}>Email</div>
                  <div className={styles.detailValue}>{userProfile.email}</div>
                </div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <FaPhone />
                </div>
                <div className={styles.detailContent}>
                  <div className={styles.detailLabel}>Phone</div>
                  <div className={styles.detailValue}>{userProfile.phone || 'Not provided'}</div>
                </div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <FaMapMarkerAlt />
                </div>
                <div className={styles.detailContent}>
                  <div className={styles.detailLabel}>Location</div>
                  <div className={styles.detailValue}>{userProfile.location || 'Not provided'}</div>
                </div>
              </div>
              {userProfile.birthday && (
                <div className={styles.detailItem}>
                  <div className={styles.detailIcon}>
                    <FaBirthdayCake />
                  </div>
                  <div className={styles.detailContent}>
                    <div className={styles.detailLabel}>Birthday</div>
                    <div className={styles.detailValue}>{formatDate(userProfile.birthday)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.detailCard}>
              <h3>Account Details</h3>
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <FaCalendarAlt />
                </div>
                <div className={styles.detailContent}>
                  <div className={styles.detailLabel}>Member Since</div>
                  <div className={styles.detailValue}>
                    {formatDate(userProfile.date_joined)}
                  </div>
                </div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <FaUserShield />
                </div>
                <div className={styles.detailContent}>
                  <div className={styles.detailLabel}>Account Status</div>
                  <div className={styles.detailValue}>Active</div>
                </div>
              </div>
              {userProfile.last_login && (
                <div className={styles.detailItem}>
                  <div className={styles.detailIcon}>
                    <FaClock />
                  </div>
                  <div className={styles.detailContent}>
                    <div className={styles.detailLabel}>Last Login</div>
                    <div className={styles.detailValue}>{formatDate(userProfile.last_login)}</div>
                  </div>
                </div>
              )}
            </div>
            
            {(userProfile.job_title || userProfile.organization || userProfile.bio) && (
              <div className={styles.detailCard}>
                <h3>Professional Information</h3>
                {userProfile.job_title && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <FaSuitcase />
                    </div>
                    <div className={styles.detailContent}>
                      <div className={styles.detailLabel}>Job Title</div>
                      <div className={styles.detailValue}>{userProfile.job_title}</div>
                    </div>
                  </div>
                )}
                {userProfile.organization && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <FaIdCard />
                    </div>
                    <div className={styles.detailContent}>
                      <div className={styles.detailLabel}>Organization</div>
                      <div className={styles.detailValue}>{userProfile.organization}</div>
                    </div>
                  </div>
                )}
                {userProfile.bio && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <FaInfoCircle />
                    </div>
                    <div className={styles.detailContent}>
                      <div className={styles.detailLabel}>Bio</div>
                      <div className={styles.detailValue}>{userProfile.bio}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {(userProfile.interests || userProfile.preferences || userProfile.languages || userProfile.website) && (
              <div className={styles.detailCard}>
                <h3>Additional Information</h3>
                {userProfile.interests && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <FaListAlt />
                    </div>
                    <div className={styles.detailContent}>
                      <div className={styles.detailLabel}>Interests</div>
                      <div className={styles.detailValue}>{userProfile.interests}</div>
                    </div>
                  </div>
                )}
                {userProfile.preferences && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <FaHeart />
                    </div>
                    <div className={styles.detailContent}>
                      <div className={styles.detailLabel}>Preferences</div>
                      <div className={styles.detailValue}>{userProfile.preferences}</div>
                    </div>
                  </div>
                )}
                {userProfile.languages && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <FaLanguage />
                    </div>
                    <div className={styles.detailContent}>
                      <div className={styles.detailLabel}>Languages</div>
                      <div className={styles.detailValue}>{userProfile.languages}</div>
                    </div>
                  </div>
                )}
                {userProfile.website && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <FaGlobe />
                    </div>
                    <div className={styles.detailContent}>
                      <div className={styles.detailLabel}>Website</div>
                      <div className={styles.detailValue}>
                        <a href={userProfile.website} target="_blank" rel="noopener noreferrer">
                          {userProfile.website}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <button 
              className={styles.editButton}
              onClick={() => setShowProfileUpdate(true)}
            >
              <FaEdit /> Edit Profile
            </button>
          </div>
          
          {/* Coordinator Request Section */}
          <div className={styles.coordinatorRequestSection}>
            <h4>Become an Event Coordinator</h4>
            <p>Want to host and manage your own events? Apply to become an event coordinator.</p>
            
            {getPendingCoordinatorRequest() ? (
              <div className={styles.requestStatus}>
                <div className={`${styles.statusBadge} ${styles[getPendingCoordinatorRequest().status]}`}>
                  {getPendingCoordinatorRequest().status === 'pending' && 'Request Pending'}
                  {getPendingCoordinatorRequest().status === 'approved' && 'Request Approved'}
                  {getPendingCoordinatorRequest().status === 'rejected' && 'Request Rejected'}
                </div>
              </div>
            ) : (
              <button 
                className={styles.coordinatorRequestButton}
                onClick={() => setShowCoordinatorRequest(true)}
              >
                Request Coordinator Status <FaBell className={styles.buttonIcon} />
              </button>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <div>Home Content</div>;
      case 'profile':
        return renderProfile();
      case 'events':
        return <div>Events Content</div>;
      case 'favorites':
        return <div>Favorites Content</div>;
      case 'settings':
        return <div>Settings Content</div>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          {profilePhotoPreview ? (
            <img 
              src={profilePhotoPreview} 
              alt="Profile" 
              className={styles.userAvatar}
            />
          ) : (
            <div className={styles.userAvatarPlaceholder}>
              <span>
                {userProfile.first_name ? userProfile.first_name.charAt(0).toUpperCase() : ''}
                {userProfile.last_name ? userProfile.last_name.charAt(0).toUpperCase() : ''}
              </span>
            </div>
          )}
          <h2>User Dashboard</h2>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navButton} ${activeTab === 'home' ? styles.active : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <FaHome />
            <span>Home</span>
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser />
            <span>Profile</span>
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'events' ? styles.active : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <FaTicketAlt />
            <span>My Events</span>
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'favorites' ? styles.active : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <FaHeart />
            <span>Favorites</span>
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaCog />
            <span>Settings</span>
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className={styles.main}>
        {renderContent()}
      </main>

      {showProfileUpdate && (
        <ProfileUpdate
          userProfile={userProfile}
          onClose={() => setShowProfileUpdate(false)}
          onSuccess={() => {
            fetchUserProfile();
            setShowProfileUpdate(false);
          }}
        />
      )}

      {showCoordinatorRequest && (
        <CoordinatorRequestForm
          onClose={() => setShowCoordinatorRequest(false)}
          onSuccess={() => {
            fetchCoordinatorRequests();
            setShowCoordinatorRequest(false);
          }}
        />
      )}
    </div>
  );
};

export default UserDashboard; 