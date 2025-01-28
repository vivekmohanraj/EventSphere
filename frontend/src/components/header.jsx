// images import
import logo from "../assets/img/logo.png";

import { Link } from "react-router-dom";

function Header() {
  return (
    <header id="header" className="header d-flex align-items-center fixed-top">
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

        <Link className="cta-btn" to="/login_reg">
          Login/Signup
        </Link>
      </div>
    </header>
  );
}

export default Header;
