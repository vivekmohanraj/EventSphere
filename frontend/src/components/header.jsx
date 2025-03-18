// images import
import logo from "../assets/img/logo.png";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ACCESS_TOKEN} from "../utils/constants";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");
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

    checkAuth();
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

            <nav id="navmenu" className="navmenu">
              <ul>
                <li>
                  <Link to="/" className="active">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/events">Events</Link>
                </li>
                {isLoggedIn && userRole === "coordinator" && (
                  <li>
                    <Link to="/create-event">Create Event</Link>
                  </li>
                )}
                <li>
                  <Link to="/about">About Us</Link>
                </li>
              </ul>
              <i className="mobile-nav-toggle d-xl-none bi bi-list"></i>
            </nav>
            {isLoggedIn ? (
              <nav id="navmenu" className="navmenu">
                <ul>
                  <li className="dropdown user-dropdown">
                    <Link to="#">
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
            ) : (
              <Link className="cta-btn" to="/login_reg">
                Login/Signup
              </Link>
            )}
          </div>
        </header>
      </div>
    </div>
  );
}

export default Header;
