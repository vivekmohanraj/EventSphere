import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Camera, User, Calendar, Eye, EyeOff } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../assets/css/login_reg.module.css";
import api from "../utils/api"; // Adjust the path as needed
import { ACCESS_TOKEN } from "../utils/constants"; // Import ACCESS_TOKEN if not already imported

// Dummy async functions to simulate username and email availability checks.
const checkUsernameAvailability = async (username) => {
  // Simulate API delay
  await new Promise((r) => setTimeout(r, 500));
  // If username is "taken", then it's unavailable.
  return username.toLowerCase() !== "taken";
};

const checkEmailAvailability = async (email) => {
  await new Promise((r) => setTimeout(r, 500));
  // If email is "taken@example.com", then it's unavailable.
  return email.toLowerCase() !== "taken@example.com";
};

// Zod Schemas
const loginSchema = z.object({
  login: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .regex(/^[A-Za-z]+$/, "No numbers or special characters allowed")
      .transform((val) => val.trim()),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .regex(
        /^[A-Za-z]+(?:\s[A-Za-z]+)*$/,
        "No numbers or special characters allowed"
      )
      .transform((val) => val.trim()),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(
        /^[a-z0-9_]+$/,
        "Only lowercase letters, numbers and underscores allowed"
      ),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[!@#$%^&*]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
    profilePic: z.instanceof(File).optional(),
    role: z.enum(["User", "Event Coordinator"]),
    phoneNumber: z
      .string()
      .min(10, "Phone number must be 10 digits")
      .max(10, "Phone number must be 10 digits")
      .regex(/^[6-9]\d{9}$/, "Phone number must start with 6, 7, 8, or 9"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const LoginRegistration = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null = not checked, true/false after check
  const [emailAvailable, setEmailAvailable] = useState(null);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
    setValue,
    getValues,
  } = useForm({ resolver: zodResolver(registerSchema), mode: "onChange" });

  const handleToggle = () => {
    if (isLogin) setShowRoleModal(true);
    setIsLogin(!isLogin);
  };

  const handleRoleSelect = (role) => {
    setValue("role", role);
    setShowRoleModal(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue("profilePic", file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const onSubmitLogin = async (data) => {
    try {
      const response = await api.post("/users/login/", {
        login: data.login, // Assuming `login` is the username/email field
        password: data.password,
      });

      // Store the access token in localStorage
      localStorage.setItem(ACCESS_TOKEN, response.data.access);

      toast.success("Login successful!");
      console.log("Logged in user:", response.data.user);

      // Redirect or update state as needed
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };
  const onSubmitRegister = async (data) => {
  try {
    const response = await api.post("/users/register/", {
      username: data.username,
      email: data.email,
      password: data.password,
      confirm_password: data.password,  // ✅ Fix: Add confirm_password
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phoneNumber,  // ✅ Fix: Change phone_number -> phone
      user_type: data.role,  // ✅ Fix: Change role -> user_type
    });

    toast.success("Registration successful!");
    console.log("Registered user:", response.data.user);

    // Auto-login after registration
    const loginResponse = await api.post("/users/login/", {
      login: data.username,  // ✅ Fix: Your login API expects "login" instead of "username"
      password: data.password,
    });

    localStorage.setItem(ACCESS_TOKEN, loginResponse.data.access);

    toast.success("Logged in successfully!");
  } catch (error) {
    console.error("Registration Error:", error.response?.data);
    toast.error(error.response?.data?.error || "Registration failed");
  }
};


  // Check username availability on blur
  const handleUsernameBlur = async (e) => {
    const val = e.target.value.toLowerCase();
    setValue("username", val);
    if (val.length >= 3) {
      const available = await checkUsernameAvailability(val);
      setUsernameAvailable(available);
    } else {
      setUsernameAvailable(null);
    }
  };

  // Check email availability on blur
  const handleEmailBlur = async (e) => {
    const val = e.target.value;
    if (val) {
      const available = await checkEmailAvailability(val);
      setEmailAvailable(available);
    } else {
      setEmailAvailable(null);
    }
  };

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
        <div className={`${styles.formContainer} card shadow p-4`}>
          <h3 className="text-center mb-4">{isLogin ? "Login" : "Register"}</h3>

          {isLogin ? (
            <Form onSubmit={handleLoginSubmit(onSubmitLogin)}>
              <Form.Group className="mb-3">
                <Form.Label>Username or Email</Form.Label>
                <Form.Control
                  {...loginRegister("login")}
                  isInvalid={!!loginErrors.login}
                />
                {loginErrors.login && (
                  <Form.Text className="text-danger">
                    {loginErrors.login.message}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    {...loginRegister("password")}
                    isInvalid={!!loginErrors.password}
                  />
                  {showPassword ? (
                    <EyeOff
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-2 cursor-pointer"
                      onClick={() => setShowPassword(false)}
                    />
                  ) : (
                    <Eye
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-2 cursor-pointer"
                      onClick={() => setShowPassword(true)}
                    />
                  )}
                </div>
                {loginErrors.password && (
                  <Form.Text
                    className="text-danger"
                    style={{ marginTop: "1.5rem" }}
                  >
                    {loginErrors.password.message}
                  </Form.Text>
                )}
              </Form.Group>

              <div className="d-grid gap-2">
                <Button type="submit" className={styles.customBtn}>
                  Login
                </Button>
                <Button
                  variant="outline-danger"
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaGoogle size={20} className="me-2" /> Sign in with Google
                </Button>
                <Button variant="link" className={styles.forgotPassword}>
                  Forgot Password?
                </Button>
              </div>
            </Form>
          ) : (
            <Form onSubmit={handleSubmit(onSubmitRegister)}>
              <div className={styles.profileSection}>
                <div className={styles.profilePreview}>
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile"
                      className={styles.profileImage}
                    />
                  ) : (
                    // Placeholder when no profile photo is uploaded
                    <Camera size={40} className="text-muted" />
                  )}
                </div>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-auto"
                  isInvalid={!!errors.profilePic}
                />
                {errors.profilePic && (
                  <Form.Text className="text-danger">
                    {errors.profilePic.message}
                  </Form.Text>
                )}
              </div>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      {...register("firstName", {
                        onChange: () => trigger("firstName"),
                      })}
                      isInvalid={!!errors.firstName}
                    />
                    {errors.firstName && (
                      <Form.Text className="text-danger">
                        {errors.firstName.message}
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      {...register("lastName", {
                        onChange: () => trigger("lastName"),
                      })}
                      isInvalid={!!errors.lastName}
                    />
                    {errors.lastName && (
                      <Form.Text className="text-danger">
                        {errors.lastName.message}
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  {...register("username", {
                    onChange: () => trigger("username"),
                    onBlur: handleUsernameBlur,
                  })}
                  isInvalid={!!errors.username || usernameAvailable === false}
                  style={
                    usernameAvailable
                      ? { boxShadow: "0 0 0 0.25rem rgba(40, 167, 69, 0.5)" }
                      : {}
                  }
                />
                {errors.username && (
                  <Form.Text className="text-danger">
                    {errors.username.message}
                  </Form.Text>
                )}
                {usernameAvailable === false && (
                  <Form.Text className="text-danger">
                    Username is already taken.
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  {...register("email", {
                    onChange: () => trigger("email"),
                    onBlur: handleEmailBlur,
                  })}
                  isInvalid={!!errors.email || emailAvailable === false}
                  style={
                    emailAvailable
                      ? { boxShadow: "0 0 0 0.25rem rgba(40, 167, 69, 0.5)" }
                      : {}
                  }
                />
                {errors.email && (
                  <Form.Text className="text-danger">
                    {errors.email.message}
                  </Form.Text>
                )}
                {emailAvailable === false && (
                  <Form.Text className="text-danger">
                    This mail is associated with another account. Would you like
                    to login?
                  </Form.Text>
                )}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <div className="input-group">
                  <span className="input-group-text" id="basic-addon1">
                    +91
                  </span>
                  <Form.Control
                    type="tel"
                    {...register("phoneNumber", {
                      onChange: () => trigger("phoneNumber"),
                    })}
                    isInvalid={!!errors.phoneNumber}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phoneNumber && (
                  <Form.Text className="text-danger">
                    {errors.phoneNumber.message}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showRegPassword ? "text" : "password"}
                    {...register("password", {
                      onChange: () => trigger("password"),
                    })}
                    isInvalid={!!errors.password}
                  />
                  {showRegPassword ? (
                    <EyeOff
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-2 cursor-pointer"
                      onClick={() => setShowRegPassword(false)}
                    />
                  ) : (
                    <Eye
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-2 cursor-pointer"
                      onClick={() => setShowRegPassword(true)}
                    />
                  )}
                </div>
                {errors.password && (
                  <Form.Text
                    className="text-danger"
                    style={{ marginTop: "1.5rem" }}
                  >
                    {errors.password.message}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showRegConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword", {
                      onChange: () => trigger("confirmPassword"),
                    })}
                    isInvalid={!!errors.confirmPassword}
                  />
                  {showRegConfirmPassword ? (
                    <EyeOff
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-2 cursor-pointer"
                      onClick={() => setShowRegConfirmPassword(false)}
                    />
                  ) : (
                    <Eye
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-2 cursor-pointer"
                      onClick={() => setShowRegConfirmPassword(true)}
                    />
                  )}
                </div>
                {errors.confirmPassword && (
                  <Form.Text
                    className="text-danger"
                    style={{ marginTop: "1.5rem" }}
                  >
                    {errors.confirmPassword.message}
                  </Form.Text>
                )}
              </Form.Group>

              <div className="d-grid gap-2 mb-3">
                <Button type="submit" className={styles.customBtn}>
                  Register
                </Button>
                <Button
                  variant="outline-danger"
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaGoogle size={20} className="me-2" /> Sign in with Google
                </Button>
              </div>
            </Form>
          )}

          <div className="text-center mt-3">
            <Button
              variant="link"
              className={styles.registerLink}
              onClick={handleToggle}
            >
              {isLogin
                ? "Don't have an account? Register now"
                : "Already have an account? Login"}
            </Button>
          </div>
        </div>

        {/* Role Selection Modal with gradient background */}
        <Modal
          show={showRoleModal}
          centered
          backdrop="static"
          contentClassName={styles.customModalContent}
        >
          <Modal.Body className={styles.modalBody}>
            <div className="d-grid gap-3">
              <Button
                variant="outline-primary"
                className="text-start p-3 d-flex align-items-center"
                onClick={() => handleRoleSelect("normal")}
              >
                <User size={24} className="me-3" />
                <div>
                  <h5>User</h5>
                  <p className="mb-0 text-muted">
                    Discover events, purchase tickets, and manage your bookings
                  </p>
                </div>
              </Button>

              <Button
                variant="outline-success"
                className="text-start p-3 d-flex align-items-center"
                onClick={() => handleRoleSelect("coordinator")}
              >
                <Calendar size={24} className="me-3" />
                <div>
                  <h5>Event Coordinator</h5>
                  <p className="mb-0 text-muted">
                    Create and manage events, track attendance, and sell tickets
                  </p>
                </div>
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default LoginRegistration;
