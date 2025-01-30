import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../assets/css/login_reg.module.css";
import { Camera } from "lucide-react";

const LoginRegistration = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState("");
  const [registrationDetails, setRegistrationDetails] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePic: null,
    role: "",
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const checkPasswordStrength = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    };
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    if (!isLogin) {
      setShowModal(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Prevent leading spaces for specific fields
    if (["firstName", "lastName", "username"].includes(name)) {
      newValue = value.trimStart();
    }

    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }

    setRegistrationDetails((prev) => ({ ...prev, [name]: newValue }));

    // Live validation
    let newErrors = { ...errors };
    delete newErrors[name];

    if (name === "username") {
      // Simulate API check for username - replace with actual API call
      if (value.length > 0) {
        setTimeout(() => {
          if (["taken", "admin"].includes(value.toLowerCase())) {
            setErrors((prev) => ({
              ...prev,
              username: "Username already taken",
            }));
          }
        }, 500);
      }
    }

    setErrors(newErrors);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      setRegistrationDetails((prev) => ({ ...prev, profilePic: file }));
      setErrors((prev) => ({ ...prev, profilePic: "" }));
    } else {
      setErrors((prev) => ({
        ...prev,
        profilePic: "Only JPG and PNG formats are allowed.",
      }));
    }
  };

  const validateRegistration = () => {
    let newErrors = {};
    const fields = [
      "firstName",
      "lastName",
      "username",
      "email",
      "password",
      "confirmPassword",
      "profilePic",
    ];

    fields.forEach((field) => {
      if (!registrationDetails[field]) {
        newErrors[field] = `${
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1")
        } is required.`;
      }
    });

    if (
      registrationDetails.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationDetails.email)
    ) {
      newErrors.email = "Valid email is required.";
    }

    const strength = checkPasswordStrength(registrationDetails.password);
    if (!Object.values(strength).every(Boolean)) {
      newErrors.password = "Password does not meet all requirements.";
    }

    if (registrationDetails.password !== registrationDetails.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!registrationDetails.role) {
      newErrors.role = "Please select a role.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegistrationSubmit = (e) => {
    e.preventDefault();
    if (validateRegistration()) {
      toast.success("Registration successful!");
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setRegistrationDetails((prev) => ({ ...prev, role: selectedRole }));
    setShowModal(false);
  };

  useEffect(() => {
    if (!isLogin && !role) {
      setShowModal(true);
    }
  }, [isLogin, role]);

  return (
    <>
      <div
        className="dummy"
        style={{
          height: "90px",
          width: "100%",
          backgroundColor: "rgba(21, 34, 43, 0.85)",
          position: "relative",
        }}
      ></div>
      <div
        className="container d-flex flex-column align-items-center py-5"
        style={{ minHeight: "100vh" }}
      >
        <ToastContainer />
        <div className={`card shadow p-4 ${styles.formContainer}`}>
          <h3 className="text-center mb-4">{isLogin ? "Login" : "Register"}</h3>
          {isLogin ? (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Username or Email</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter username or email"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" placeholder="Enter password" />
              </Form.Group>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Button variant="link" style={{ color: "#ff4a17" }}>
                  Forgot Password?
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  className={styles.customBtn}
                >
                  Login
                </Button>
              </div>
              <div className="text-center mt-3">
                <Button variant="outline-danger">Sign in with Google</Button>
              </div>
            </Form>
          ) : (
            <Form onSubmit={handleRegistrationSubmit}>
              <div className={styles.profileSection}>
                <div className={styles.profilePreview}>
                  {registrationDetails.profilePic ? (
                    <img
                      src={URL.createObjectURL(registrationDetails.profilePic)}
                      alt="Profile Preview"
                      className={styles.profileImage}
                    />
                  ) : (
                    <Camera size={40} color="#666" />
                  )}
                </div>
                <Form.Control
                  type="file"
                  accept="image/jpeg, image/png"
                  onChange={handleFileChange}
                  className="w-auto"
                />
                {errors.profilePic && (
                  <div className="text-danger">{errors.profilePic}</div>
                )}
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="firstName"
                      value={registrationDetails.firstName}
                      onChange={handleInputChange}
                    />
                    {errors.firstName && (
                      <div className="text-danger">{errors.firstName}</div>
                    )}
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="lastName"
                      value={registrationDetails.lastName}
                      onChange={handleInputChange}
                    />
                    {errors.lastName && (
                      <div className="text-danger">{errors.lastName}</div>
                    )}
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={registrationDetails.username}
                  onChange={handleInputChange}
                />
                {errors.username && (
                  <div className="text-danger">{errors.username}</div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={registrationDetails.email}
                  onChange={handleInputChange}
                />
                {errors.email && (
                  <div className="text-danger">{errors.email}</div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={registrationDetails.password}
                  onChange={handleInputChange}
                />
                <div className={styles.passwordCriteria}>
                  <div
                    className={`${styles.criteriaItem} ${
                      passwordStrength.length ? styles.met : styles.unmet
                    }`}
                  >
                    ✓ At least 8 characters
                  </div>
                  <div
                    className={`${styles.criteriaItem} ${
                      passwordStrength.uppercase ? styles.met : styles.unmet
                    }`}
                  >
                    ✓ One uppercase letter
                  </div>
                  <div
                    className={`${styles.criteriaItem} ${
                      passwordStrength.lowercase ? styles.met : styles.unmet
                    }`}
                  >
                    ✓ One lowercase letter
                  </div>
                  <div
                    className={`${styles.criteriaItem} ${
                      passwordStrength.number ? styles.met : styles.unmet
                    }`}
                  >
                    ✓ One number
                  </div>
                  <div
                    className={`${styles.criteriaItem} ${
                      passwordStrength.special ? styles.met : styles.unmet
                    }`}
                  >
                    ✓ One special character
                  </div>
                </div>
                {errors.password && (
                  <div className="text-danger">{errors.password}</div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={registrationDetails.confirmPassword}
                  onChange={handleInputChange}
                />
                {errors.confirmPassword && (
                  <div className="text-danger">{errors.confirmPassword}</div>
                )}
              </Form.Group>

              <Button type="submit" className={styles.customBtn}>
                Register
              </Button>
            </Form>
          )}
          <div className="text-center mt-3">
            <Button
              variant="link"
              style={{ color: "#ff4a17" }}
              onClick={handleToggle}
            >
              {isLogin ? "Switch to Register" : "Switch to Login"}
            </Button>
          </div>
        </div>

        <Modal
          show={showModal}
          onHide={() => {}}
          centered
          backdrop="static"
          className={styles.modalOverlay}
        >
          <Modal.Header>
            <Modal.Title>Choose Your Role</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Button
              variant="primary"
              className={`w-100 mb-3 ${styles.customBtn}`}
              onClick={() => handleRoleSelect("User")}
            >
              I am a User
              <div className={styles.roleDescription}>
                Access events, book tickets, and manage your event calendar
              </div>
            </Button>
            <Button
              variant="secondary"
              className="w-100"
              onClick={() => handleRoleSelect("Event Coordinator")}
            >
              I am an Event Coordinator
              <div className={styles.roleDescription}>
                Create and manage events, track attendance, and engage with
                attendees
              </div>
            </Button>
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default LoginRegistration;
