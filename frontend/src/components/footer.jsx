function Footer() {
  return (
    <>
      <div className="general">
        <div className="footer-css">
        <footer id="footer" className="footer dark-background">
          <div className="container footer-top">
            <div className="row gy-4">
              <div className="col-lg-4 col-md-6 footer-about">
                <a href="/" className="logo d-flex align-items-center">
                  <span className="sitename">EventSphere</span>
                </a>
                <div className="footer-contact pt-3">
                  <p>Your Company Address Line 1</p>
                  <p>Your Company Address Line 2</p>
                  <p className="mt-3">
                    <strong>Phone:</strong> <span>Your Phone Number</span>
                  </p>
                  <p>
                    <strong>Email:</strong> <span>your.email@example.com</span>
                  </p>
                </div>
                <div className="social-links d-flex mt-4">
                  <a href="https://twitter.com/yourprofile">
                    <i className="bi bi-twitter-x"></i>
                  </a>
                  <a href="https://facebook.com/yourprofile">
                    <i className="bi bi-facebook"></i>
                  </a>
                  <a href="https://instagram.com/yourprofile">
                    <i className="bi bi-instagram"></i>
                  </a>
                  <a href="https://linkedin.com/in/yourprofile">
                    <i className="bi bi-linkedin"></i>
                  </a>
                </div>
              </div>

              <div className="col-lg-2 col-md-3 footer-links">
                <h4>Useful Links</h4>
                <ul>
                  <li>
                    <i className="bi bi-chevron-right"></i> <a href="/">Home</a>
                  </li>
                  <li>
                    <i className="bi bi-chevron-right"></i>{" "}
                    <a href="/about">About us</a>
                  </li>
                  <li>
                    <i className="bi bi-chevron-right"></i>{" "}
                    <a href="/services">Services</a>
                  </li>
                  <li>
                    <i className="bi bi-chevron-right"></i>{" "}
                    <a href="/terms">Terms of service</a>
                  </li>
                  <li>
                    <i className="bi bi-chevron-right"></i>{" "}
                    <a href="/privacy">Privacy policy</a>
                  </li>
                </ul>
              </div>

              <div className="col-lg-2 col-md-3 footer-links">
                <h4>Our Services</h4>
                <ul>
                  {/* Replace these with your actual services */}
                  <li>
                    <i className="bi bi-chevron-right"></i>{" "}
                    <a href="/service1">Service 1</a>
                  </li>
                  <li>
                    <i className="bi bi-chevron-right"></i>{" "}
                    <a href="/service2">Service 2</a>
                  </li>
                  <li>
                    <i className="bi bi-chevron-right"></i>{" "}
                    <a href="/service3">Service 3</a>
                  </li>
                  <li>
                    <i className="bi bi-chevron-right"></i>{" "}
                    <a href="/service4">Service 4</a>
                  </li>
                  <li>
                    <i className="bi bi-chevron-right"></i>{" "}
                    <a href="/service5">Service 5</a>
                  </li>
                </ul>
              </div>

              <div className="col-lg-4 col-md-12 footer-newsletter">
                <h4>Our Newsletter</h4>
                <p>
                  Stay updated with our latest news and offerings by subscribing to our newsletter.
                </p>
                <form
                  action="/api/subscribe" // Update this with your actual subscription endpoint
                  method="post"
                  className="validate-email"
                >
                  <div className="newsletter-form">
                    <input type="email" name="email" placeholder="Enter your email" />
                    <input type="submit" value="Subscribe" />
                  </div>
                  <div className="loading">Loading</div>
                  <div className="error-message"></div>
                  <div className="sent-message">
                    Your subscription request has been sent. Thank you!
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="container copyright text-center mt-4">
            <p>
              © <span>Copyright</span>{" "}
              <strong className="px-1 sitename">EventSphere</strong>{" "}
              <span>{new Date().getFullYear()} - All Rights Reserved</span>
            </p>
            <div className="credits">
              {/* You can add additional credits or attribution here if needed */}
            </div>
          </div>
        </footer>
        {/* <!-- Scroll Top --> */}
        <a
          href="#"
          id="scroll-top"
          className="scroll-top d-flex align-items-center justify-content-center"
        >
          <i className="bi bi-arrow-up-short"></i>
        </a>
        </div>
      </div>
    </>
  );
}

export default Footer;
