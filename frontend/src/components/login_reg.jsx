import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { Camera, User, Calendar, Eye, EyeOff } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import styles from "../assets/css/login_reg.module.css";
import api from "../utils/api"; // Adjust the path as needed
import { ACCESS_TOKEN, REFRESH_TOKEN, USER_ID, USER_ROLE, USER_DATA } from "../utils/constants"; // Import all constants
import { getEnv, logEnvironmentVariables } from '../utils/env';

// Get Google Client ID directly from .env file
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || "772220265946-cbl43ponl16viae3ar1vulo80vs6145k.apps.googleusercontent.com";
console.log("Google Client ID:", CLIENT_ID); // For debugging

// Dummy async functions to simulate username and email availability checks.
const checkUsernameAvailability = async (username) => {
  try {
    const response = await api.post("users/check-username/", { username });
    return response.data.available;
  } catch (error) {
    console.error("Error checking username:", error);
    throw error;
  }
};

const checkEmailAvailability = async (email) => {
  try {
    const response = await api.post("users/check-email/", { email });
    return response.data.available;
  } catch (error) {
    console.error("Error checking email:", error);
    throw error;
  }
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
    role: z.enum(["normal", "coordinator"]),
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
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Check if environment variables are loaded properly
  useEffect(() => {
    // Log all available environment variables
    const hasEnvVars = logEnvironmentVariables();
    
    // Validate Google Client ID
    if (!CLIENT_ID) {
      console.error("Google Client ID is missing. OAuth will not work.");
      toast.error("Google Sign-In configuration is incomplete. Please contact support.");
    } else {
      console.log("Google Authentication is configured correctly");
    }
    
    if (!hasEnvVars) {
      console.warn("No environment variables detected. Check your .env file and Vite configuration.");
    }
  }, []);

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
    if (isLogin) {
      console.log("Opening role selection modal");
      setShowRoleModal(true);
    } else {
      setIsLogin(true);
    }
  };

  const handleRoleSelect = (role) => {
    console.log("Role selected:", role);
    // Set a default role value (normal or coordinator)
    const roleValue = role === "User" ? "normal" : "coordinator";
    console.log("Setting role value:", roleValue);
    setValue("role", roleValue);
    setShowRoleModal(false);
    setIsLogin(false);
    toast.success(
      `Registered as ${role === "User" ? "User" : "Event Coordinator"}`
    );
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
      console.log("Login attempt with:", { login: data.login });
      
      // Clean up any existing auth error events
      window.removeEventListener('auth-error', () => {});
      
      const response = await api.post("users/login/", {
        login: data.login,
        password: data.password,
      });

      console.log("Login response:", response.data);
      
      // Clear any previous error states
      localStorage.removeItem('auth_error_count');
      
      // Store tokens
      localStorage.setItem(ACCESS_TOKEN, response.data.access);
      localStorage.setItem(REFRESH_TOKEN, response.data.refresh);

      // Extract and normalize role to ensure consistency
      let userRole = response.data.role || response.data.user_role || 'user';
      if (userRole === 'normal') userRole = 'user';
      
      // Store user data with consistent field names
      const userData = {
        username: response.data.username,
        role: userRole,
        email: response.data.email || '',
        id: response.data.id || null
      };
      
      console.log("Storing user data:", userData);
      localStorage.setItem(USER_DATA, JSON.stringify(userData));
      localStorage.setItem(USER_ID, userData.id || '');
      localStorage.setItem(USER_ROLE, userData.role || 'user');
      
      // Update the Authorization header in the api instance
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      
      toast.success("Login successful!");
      
      // Redirect based on role
      if (userRole === 'admin') {
        window.location.href = "/admin-dashboard";
      } else if (userRole === 'coordinator') {
        window.location.href = "/coordinator-dashboard";
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      toast.error(error.response?.data?.error || "Login failed.");
    }
  };

  const onSubmitRegister = async (data) => {
    console.log("Register form submitted with data:", data);
    try {
      // Create FormData object to handle file uploads
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("confirm_password", data.confirmPassword);
      formData.append("first_name", data.firstName);
      formData.append("last_name", data.lastName);
      formData.append("phone", data.phoneNumber);
      // Convert 'normal' to 'user' before sending to backend
      formData.append("user_role", data.role === 'normal' ? 'user' : data.role);

      // Append profile picture if it exists
      if (data.profilePic) {
        formData.append("profile_photo", data.profilePic);
      }

      console.log("Sending registration request...");
      // Try multiple endpoints for registration
      let response = null;
      let error = null;
      
      try {
        response = await api.post("users/register/", formData, {
          headers: {
            "Content-Type": "multipart/form-data", // Required for file uploads
          },
        });
      } catch (e) {
        error = e;
        try {
          response = await api.post("register/", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } catch (e2) {
          error = e2;
          try {
            response = await api.post("api/users/register/", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
          } catch (e3) {
            error = e3;
          }
        }
      }
      
      if (!response) {
        throw error || new Error("Registration failed. Please try again.");
      }

      console.log("Registration successful:", response.data);
      toast.success("Registration successful! Please login.");
      setIsLogin(true);
      
      // Auto-login after registration
      try {
        // Try multiple endpoints for login
        let loginResponse = null;
        let loginError = null;
        
        const loginData = {
          username: data.username,
          password: data.password
        };
        
        try {
          loginResponse = await api.post("users/login/", loginData);
        } catch (e) {
          loginError = e;
          try {
            loginResponse = await api.post("login/", loginData);
          } catch (e2) {
            loginError = e2;
            try {
              loginResponse = await api.post("api/users/login/", loginData);
            } catch (e3) {
              loginError = e3;
            }
          }
        }
        
        if (!loginResponse) {
          throw loginError || new Error("Auto-login failed. Please log in manually.");
        }
        
        // Store tokens and user data
        localStorage.setItem(ACCESS_TOKEN, loginResponse.data.access || loginResponse.data.token);
        localStorage.setItem(REFRESH_TOKEN, loginResponse.data.refresh || '');
        
        // Extract and normalize role
        let userRole = loginResponse.data.role || loginResponse.data.user_role || 'user';
        if (userRole === 'normal') userRole = 'user';
        
        // Store user data with consistent format
        const userData = {
          username: loginResponse.data.username,
          role: userRole,
          email: loginResponse.data.email || '',
          id: loginResponse.data.id || loginResponse.data.user_id || null
        };
        
        localStorage.setItem(USER_DATA, JSON.stringify(userData));
        localStorage.setItem(USER_ID, userData.id || '');
        localStorage.setItem(USER_ROLE, userData.role || 'user');
        
        // Update API authentication header
        api.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.access || loginResponse.data.token}`;
        
        toast.success("Logged in automatically!");
        
        // Redirect based on role
        if (userData.role === 'admin') {
          window.location.href = "/admin-dashboard";
        } else if (userData.role === 'coordinator') {
          window.location.href = "/coordinator-dashboard";
        } else {
          window.location.href = "/";
        }
      } catch (loginError) {
        console.error("Auto-login error:", loginError);
        toast.error("Auto-login failed. Please log in manually.");
      }
    } catch (error) {
      console.error("Registration Error:", error.response?.data || error);
      if (error.response?.data) {
        // Display specific error messages from the backend
        toast.error(
          error.response.data.error ||
            Object.values(error.response.data).join(", ") ||
            "Registration failed"
        );
      } else {
        toast.error("Registration failed. Please try again.");
      }
    }
  };

  const responseGoogle = async (response) => {
    console.log("Google response received:", response);
    
    if (!response || response.error) {
      console.error("Google login error:", response?.error || "No response received");
      toast.error("Google authentication failed");
      return;
    }

    try {
      // Ensure we have the correct credential field
      const googleToken = response.credential;
      
      if (!googleToken) {
        console.error("No Google token received in response:", response);
        toast.error("Authentication failed: No valid token received");
        return;
      }
      
      console.log("Google token received successfully");
      
      // Get role value, defaulting to 'user' if not set or if the value is 'normal'
      let roleValue = getValues("role") || "user";
      
      // Convert 'normal' to 'user' to match backend expectations
      if (roleValue === "normal") {
        roleValue = "user";
      }
      
      console.log("Sending Google login with role:", roleValue);
      
      const res = await api.post("users/google-login/", {
        token: googleToken,
        role: roleValue
      });

      console.log("Login successful:", res.data);
      
      // Save the tokens and user data
      localStorage.setItem(ACCESS_TOKEN, res.data.access);
      localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

      const userData = {
        username: res.data.username,
        role: res.data.role,
        email: res.data.email || '',
      };
      
      localStorage.setItem("user", JSON.stringify(userData));

      toast.success("Login successful!");

      // Redirect based on role
      setTimeout(() => {
        if (userData.role === 'admin') {
          window.location.href = "/admin-dashboard";
        } else if (userData.role === 'coordinator') {
          window.location.href = "/coordinator-dashboard";
        } else {
          window.location.href = "/";
        }
      }, 1000); // Short delay to allow toast to be seen
    } catch (error) {
      console.error("API Error:", error);
      
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        toast.error(error.response.data?.error || `Login failed (${error.response.status})`);
      } else if (error.request) {
        console.error("No response received:", error.request);
        toast.error("Server did not respond. Please try again later.");
      } else {
        console.error("Error message:", error.message);
        toast.error("Login failed: " + error.message);
      }
    }
  };

  // Replace your existing handleUsernameBlur and handleEmailBlur functions
  const handleUsernameBlur = async (e) => {
    const val = e.target.value.trim().toLowerCase();
    if (val.length >= 3) {
      try {
        const available = await checkUsernameAvailability(val);
        setUsernameAvailable(available);
        if (!available) {
          toast.error("Username is already taken", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      } catch (error) {
        setUsernameAvailable(null);
        toast.error("Error checking username availability");
      }
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleEmailBlur = async (e) => {
    const val = e.target.value.trim();
    if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      try {
        const available = await checkEmailAvailability(val);
        setEmailAvailable(available);
        if (!available) {
          toast.info(
            <div>
              An account with this email already exists.{" "}
              <Link
                to="/login_reg"
                onClick={() => setIsLogin(true)}
                style={{ color: "#007bff", textDecoration: "underline" }}
              >
                Click here to login
              </Link>
            </div>,
            {
              position: "top-right",
              autoClose: 5000,
            }
          );
        }
      } catch (error) {
        setEmailAvailable(null);
        toast.error("Error checking email availability");
      }
    } else {
      setEmailAvailable(null);
    }
  };

  const handleRegisterClick = async () => {
    try {
      console.log("Register button clicked directly");
      // Check if form is valid
      const isValid = await trigger();
      console.log("Form validation result:", isValid);
      console.log("Form errors:", errors);
      console.log("Current form values:", getValues());
      
      if (isValid) {
        setFormSubmitting(true);
        const data = getValues();
        console.log("Form data to be submitted:", data);
        await onSubmitRegister(data);
      } else {
        toast.error("Please fix the form errors before submitting");
      }
    } catch (err) {
      console.error("Error in manual submission:", err);
      toast.error("Registration failed: " + (err.message || "Unknown error"));
    } finally {
      setFormSubmitting(false);
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
        style={{ minHeight: "100vh", backgroundColor: "#f9fafc" }}
      >
        <ToastContainer />
        <div className={`${styles.formContainer} card shadow`}>
          <h3 className="text-center mb-4" style={{ fontWeight: '600', color: '#333', fontSize: '1.8rem' }}>
            {isLogin ? "Login to Your Account" : "Create an Account"}
          </h3>

          {isLogin ? (
            <Form onSubmit={handleLoginSubmit(onSubmitLogin)}>
              <Form.Group className="mb-4">
                <Form.Label style={{ fontWeight: '500', color: '#555' }}>Username or Email</Form.Label>
                <Form.Control
                  {...loginRegister("login")}
                  isInvalid={!!loginErrors.login}
                  className="py-2 px-3"
                  style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
                />
                {loginErrors.login && (
                  <Form.Text className="text-danger">
                    {loginErrors.login.message}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label style={{ fontWeight: '500', color: '#555' }}>Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    {...loginRegister("password")}
                    isInvalid={!!loginErrors.password}
                    className="py-2 px-3"
                    style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
                  />
                  {showPassword ? (
                    <EyeOff
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
                      onClick={() => setShowPassword(false)}
                      style={{ color: '#6b7280', cursor: 'pointer' }}
                    />
                  ) : (
                    <Eye
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
                      onClick={() => setShowPassword(true)}
                      style={{ color: '#6b7280', cursor: 'pointer' }}
                    />
                  )}
                </div>
                {loginErrors.password && (
                  <Form.Text
                    className="text-danger"
                    style={{ marginTop: "0.5rem" }}
                  >
                    {loginErrors.password.message}
                  </Form.Text>
                )}
              </Form.Group>

              <div className="d-grid gap-3 mt-4">
                <Button type="submit" className={styles.customBtn}>
                  Login
                </Button>
                {CLIENT_ID ? (
                  <GoogleOAuthProvider clientId={CLIENT_ID}>
                    <GoogleLogin
                      onSuccess={responseGoogle}
                      onFailure={responseGoogle}
                      cookiePolicy={"single_host_origin"}
                      render={(renderProps) => (
                        <button
                          type="button" // Prevents form submission
                          onClick={renderProps.onClick}
                          disabled={renderProps.disabled}
                          className="d-flex align-items-center justify-content-center btn btn-outline-secondary"
                          style={{ borderRadius: '8px', padding: '10px', fontWeight: '500' }}
                        >
                          <FaGoogle size={18} className="me-2" /> Sign in with
                          Google
                        </button>
                      )}
                    />
                  </GoogleOAuthProvider>
                ) : (
                  <div className="alert alert-warning">
                    Google Sign-In is temporarily unavailable
                  </div>
                )}
                <Link to="/forgot-password" className={styles.forgotPassword}>
                  Forgot Password?
                </Link>
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
                    <Camera size={40} className="text-muted" />
                  )}
                </div>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-auto"
                  isInvalid={!!errors.profilePic}
                  style={{ maxWidth: '220px' }}
                />
                {errors.profilePic && (
                  <Form.Text className="text-danger">
                    {errors.profilePic.message}
                  </Form.Text>
                )}
              </div>

              <Row className="mb-2">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: '500', color: '#555' }}>First Name</Form.Label>
                    <Form.Control
                      {...register("firstName", {
                        onChange: () => trigger("firstName"),
                      })}
                      isInvalid={!!errors.firstName}
                      className="py-2 px-3"
                      style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
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
                    <Form.Label style={{ fontWeight: '500', color: '#555' }}>Last Name</Form.Label>
                    <Form.Control
                      {...register("lastName", {
                        onChange: () => trigger("lastName"),
                      })}
                      isInvalid={!!errors.lastName}
                      className="py-2 px-3"
                      style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
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
                <Form.Label style={{ fontWeight: '500', color: '#555' }}>Username</Form.Label>
                <Form.Control
                  {...register("username", {
                    onChange: () => trigger("username"),
                    onBlur: handleUsernameBlur,
                  })}
                  isInvalid={!!errors.username || usernameAvailable === false}
                  isValid={usernameAvailable === true}
                  className="py-2 px-3"
                  style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
                />
                {errors.username && (
                  <Form.Text className="text-danger">
                    {errors.username.message}
                  </Form.Text>
                )}
                {usernameAvailable === false && (
                  <Form.Text className="text-danger">
                    This username is already taken
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '500', color: '#555' }}>Email</Form.Label>
                <Form.Control
                  type="email"
                  {...register("email", {
                    onChange: () => trigger("email"),
                    onBlur: handleEmailBlur,
                  })}
                  isInvalid={!!errors.email || emailAvailable === false}
                  isValid={emailAvailable === true}
                  className="py-2 px-3"
                  style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
                />
                {errors.email && (
                  <Form.Text className="text-danger">
                    {errors.email.message}
                  </Form.Text>
                )}
                {emailAvailable === false && (
                  <Form.Text className="text-primary">
                    An account with this email already exists.{" "}
                    <Link to="/login_reg" onClick={() => setIsLogin(true)}>
                      Click here to login
                    </Link>
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '500', color: '#555' }}>Phone Number</Form.Label>
                <div className="input-group">
                  <span className="input-group-text" id="basic-addon1" style={{ borderRadius: '8px 0 0 8px', border: '1px solid #dde1e7', backgroundColor: '#f7f9fc' }}>
                    +91
                  </span>
                  <Form.Control
                    type="tel"
                    {...register("phoneNumber", {
                      onChange: () => trigger("phoneNumber"),
                    })}
                    isInvalid={!!errors.phoneNumber}
                    placeholder="Enter your phone number"
                    className="py-2 px-3"
                    style={{ borderRadius: '0 8px 8px 0', border: '1px solid #dde1e7', boxShadow: 'none' }}
                  />
                </div>
                {errors.phoneNumber && (
                  <Form.Text className="text-danger">
                    {errors.phoneNumber.message}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '500', color: '#555' }}>Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showRegPassword ? "text" : "password"}
                    {...register("password", {
                      onChange: () => trigger("password"),
                    })}
                    isInvalid={!!errors.password}
                    className="py-2 px-3"
                    style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
                  />
                  {showRegPassword ? (
                    <EyeOff
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
                      onClick={() => setShowRegPassword(false)}
                      style={{ color: '#6b7280', cursor: 'pointer' }}
                    />
                  ) : (
                    <Eye
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
                      onClick={() => setShowRegPassword(true)}
                      style={{ color: '#6b7280', cursor: 'pointer' }}
                    />
                  )}
                </div>
                {errors.password && (
                  <Form.Text
                    className="text-danger"
                    style={{ marginTop: "0.5rem" }}
                  >
                    {errors.password.message}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '500', color: '#555' }}>Confirm Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showRegConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword", {
                      onChange: () => trigger("confirmPassword"),
                    })}
                    isInvalid={!!errors.confirmPassword}
                    className="py-2 px-3"
                    style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
                  />
                  {showRegConfirmPassword ? (
                    <EyeOff
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
                      onClick={() => setShowRegConfirmPassword(false)}
                      style={{ color: '#6b7280', cursor: 'pointer' }}
                    />
                  ) : (
                    <Eye
                      size={20}
                      className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
                      onClick={() => setShowRegConfirmPassword(true)}
                      style={{ color: '#6b7280', cursor: 'pointer' }}
                    />
                  )}
                </div>
                {errors.confirmPassword && (
                  <Form.Text
                    className="text-danger"
                    style={{ marginTop: "0.5rem" }}
                  >
                    {errors.confirmPassword.message}
                  </Form.Text>
                )}
              </Form.Group>

              <div className="d-grid gap-3 mt-4 mb-3">
                <Button 
                  type="button" 
                  onClick={handleRegisterClick}
                  className={styles.customBtn}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? "Registering..." : "Register"}
                </Button>
                {CLIENT_ID ? (
                  <GoogleOAuthProvider clientId={CLIENT_ID}>
                    <GoogleLogin
                      onSuccess={responseGoogle}
                      onFailure={responseGoogle}
                      cookiePolicy={"single_host_origin"}
                      render={(renderProps) => (
                        <button
                          type="button"
                          onClick={renderProps.onClick}
                          disabled={renderProps.disabled}
                          className="d-flex align-items-center justify-content-center btn btn-outline-secondary"
                          style={{ borderRadius: '8px', padding: '10px', fontWeight: '500' }}
                        >
                          <FaGoogle size={18} className="me-2" /> Sign in with Google
                        </button>
                      )}
                    />
                  </GoogleOAuthProvider>
                ) : (
                  <div className="alert alert-warning">
                    Google Sign-In is temporarily unavailable
                  </div>
                )}
              </div>
            </Form>
          )}

          <div className="text-center mt-4">
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
            <h4 className="text-center mb-4" style={{ fontWeight: '600', color: '#333' }}>Choose Your Account Type</h4>
            <div className="d-grid gap-3">
              <Button
                variant="outline-primary"
                className="text-start p-3 d-flex align-items-center"
                onClick={() => handleRoleSelect("User")}
                style={{ 
                  borderRadius: '10px', 
                  border: '1px solid #e2e8f0', 
                  transition: 'all 0.2s ease',
                  color: '#6b7280',
                  backgroundColor: 'transparent'
                }}
              >
                <User size={24} className="me-3" style={{ color: '#9333ea' }} />
                <div>
                  <h5 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#333' }}>User</h5>
                  <p className="mb-0 text-muted">
                    Discover events, purchase tickets, and manage your bookings
                  </p>
                </div>
              </Button>

              <Button
                variant="outline-success"
                className="text-start p-3 d-flex align-items-center"
                onClick={() => handleRoleSelect("Event Coordinator")}
                style={{ 
                  borderRadius: '10px', 
                  border: '1px solid #e2e8f0', 
                  transition: 'all 0.2s ease',
                  color: '#6b7280',
                  backgroundColor: 'transparent'
                }}
              >
                <Calendar size={24} className="me-3" style={{ color: '#ec4899' }} />
                <div>
                  <h5 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#333' }}>Event Coordinator</h5>
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
