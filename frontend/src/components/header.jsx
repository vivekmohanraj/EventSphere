// images import
import logo from "../assets/img/logo.png";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ACCESS_TOKEN} from "../utils/constants";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (userData && token) {
        try {
          const user = JSON.parse(userData);
          setUsername(user.username);
          // Get user role from localStorage
          const role = user.role || user.user_role;
          setUserRole(role);
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Error parsing user data:", error);
          handleLogout();
        }
      }
    };

    // Check if desktop or mobile view
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1200);
    };

    checkAuth();
    checkScreenSize(); // Initial check

    // Close mobile menu when window is resized to desktop size
    const handleResize = () => {
      checkScreenSize();
      if (window.innerWidth >= 1200) {
        setIsMobileMenuOpen(false);
        document.body.classList.remove('mobile-nav-active');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUsername("");
    setUserRole("");
    navigate("/");
  };
  
  const handleDashboard = () => {
    // Navigate to the appropriate dashboard based on user role
    if (userRole === "admin") {
      navigate("/admin-dashboard");
    } else if (userRole === "coordinator") {
      navigate("/coordinator-dashboard");
    } else {
      // Default to user dashboard for normal users or undefined roles
      navigate("/user-dashboard");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Add/remove mobile-nav-active class to body for scrolling control
    if (!isMobileMenuOpen) {
      document.body.classList.add('mobile-nav-active');
    } else {
      document.body.classList.remove('mobile-nav-active');
    }
  };

  // Close mobile menu when a link is clicked
  const handleNavLinkClick = () => {
    if (isMobileMenuOpen) {
      toggleMobileMenu();
    }
  };

  const toggleUserDropdown = (e) => {
    e.preventDefault();
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  return (
    <div className="general">
      <div className="header-css">
        <header
          id="header"
          className="header d-flex align-items-center fixed-top"
        >
          <div className="container-fluid container-xl position-relative d-flex align-items-center">
            <Link to="/" className="logo d-flex align-items-center me-auto">
              {/* {/* <!-- Uncomment the line below if you also wish to use an image logo --> */}
              <img src={logo} alt="" />
              <h1 className="sitename">EventSphere</h1>
            </Link>

            {/* Main navigation */}
            <nav id="navmenu" className={`navmenu ${isMobileMenuOpen ? 'mobile-nav-active' : ''}`}>
              <ul>
                <li>
                  <Link to="/" className="active" onClick={handleNavLinkClick}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/events" onClick={handleNavLinkClick}>Events</Link>
                </li>
                {isLoggedIn && userRole === "coordinator" && (
                  <li>
                    <Link to="/create-event" onClick={handleNavLinkClick}>Create Event</Link>
                  </li>
                )}
                <li>
                  <Link to="/about" onClick={handleNavLinkClick}>About Us</Link>
                </li>
                {/* Add user dropdown inside mobile menu */}
                {isLoggedIn && !isDesktop && (
                  <li className={`dropdown user-dropdown ${isUserDropdownOpen ? 'active' : ''}`}>
                    <Link to="#" onClick={toggleUserDropdown}>
                      <i className="bi bi-person-circle"></i>
                      <span>{username}</span>
                      <i className={`bi ${isUserDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down'} toggle-dropdown`}></i>
                    </Link>
                    <ul style={{ display: isUserDropdownOpen ? 'block' : 'none' }}>
                      <li>
                        <button onClick={() => {handleDashboard(); handleNavLinkClick();}}>
                          <i className="bi bi-speedometer2"></i>
                          <span style={{ margin: '0' }}>
                            {userRole === "admin" 
                              ? "Admin Dashboard" 
                              : userRole === "coordinator" 
                                ? "Coordinator Dashboard" 
                                : "My Dashboard"}
                          </span>
                        </button>
                      </li>
                      <li>
                        <button onClick={() => {handleLogout(); handleNavLinkClick();}}>
                          <i className="bi bi-box-arrow-right"></i>
                          <span>Logout</span>
                        </button>
                      </li>
                    </ul>
                  </li>
                )}
              </ul>
            </nav>
            
            {/* Mobile Toggle Button - keep on the right */}
            <i 
              className={`mobile-nav-toggle d-xl-none ${isMobileMenuOpen ? 'bi-x' : 'bi-list'}`} 
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
            ></i>
            
            {/* User Menu for Desktop */}
            {isLoggedIn && isDesktop ? (
              <nav className="navmenu">
                <ul>
                  <li className="dropdown user-dropdown">
                    <Link to="#" onClick={toggleUserDropdown}>
                      <i className="bi bi-person-circle"></i>
                      <span>{username}</span>
                      <i className="bi bi-chevron-down toggle-dropdown"></i>
                    </Link>
                    <ul>
                      <li>
                        <button onClick={handleDashboard}>
                          <i className="bi bi-speedometer2"></i>
                          <span style={{ margin: '0' }}>
                            {userRole === "admin" 
                              ? "Admin Dashboard" 
                              : userRole === "coordinator" 
                                ? "Coordinator Dashboard" 
                                : "My Dashboard"}
                          </span>
                        </button>
                      </li>
                      <li>
                        <button onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right"></i>
                          <span>Logout</span>
                        </button>
                      </li>
                    </ul>
                  </li>
                </ul>
              </nav>
            ) : !isLoggedIn ? (
              <Link className="cta-btn" to="/login_reg" onClick={handleNavLinkClick}>
                Login/Signup
              </Link>
            ) : null}
          </div>
        </header>
      </div>
    </div>
  );
}

export default Header;
