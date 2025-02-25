// images import
import logo from "../assets/img/logo.png";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../utils/constants";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (userData && token) {
        try {
          const user = JSON.parse(userData);
          setUsername(user.username);
          // console.log(user.username)
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
    navigate("/");
  };
  
const handleDashboard = () => {
    navigate("/dashboard");
  };

  const token = localStorage.getItem(ACCESS_TOKEN);
  console.log(token);

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
                  <Link to="/">About</Link>
                </li>
                <li>
                  <Link to="#services">Services</Link>
                </li>
                <li>
                  <Link to="#portfolio">Portfolio</Link>
                </li>
                <li>
                  <a href="#team">Team</a>
                </li>
                <li className="dropdown">
                  <Link to="/#">
                    <span>Dropdown</span>{" "}
                    <i className="bi bi-chevron-down toggle-dropdown"></i>
                  </Link>
                  <ul>
                    <li>
                      <Link to="/#">Dropdown 1</Link>
                    </li>
                    <li className="dropdown">
                      <Link to="/#">
                        <span>Deep Dropdown</span>{" "}
                        <i className="bi bi-chevron-down toggle-dropdown"></i>
                      </Link>
                      <ul>
                        <li>
                          <Link to="/#">Deep Dropdown 1</Link>
                        </li>
                        <li>
                          <Link to="/#">Deep Dropdown 2</Link>
                        </li>
                        <li>
                          <Link to="/#">Deep Dropdown 3</Link>
                        </li>
                        <li>
                          <Link to="/#">Deep Dropdown 4</Link>
                        </li>
                        <li>
                          <Link to="/#">Deep Dropdown 5</Link>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <Link to="/#">Dropdown 2</Link>
                    </li>
                    <li>
                      <Link to="/#">Dropdown 3</Link>
                    </li>
                    <li>
                      <Link to="/#">Dropdown 4</Link>
                    </li>
                  </ul>
                </li>
                <li>
                  <Link to="/#contact">Contact</Link>
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
                          <span style={{ margin: '0' }}>Dashboard</span>
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
