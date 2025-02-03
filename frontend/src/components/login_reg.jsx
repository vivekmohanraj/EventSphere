import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Camera, User, Calendar, Eye, EyeOff } from "lucide-react"; // Correct imports from lucide-react
import { FaGoogle } from "react-icons/fa"; // Correct import for Google icon
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../assets/css/login_reg.module.css";


// Zod Schemas (same as before)
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
      .regex(/^[A-Za-z]+$/, "No numbers or special characters allowed")
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
    profilePic: z.instanceof(File),
    role: z.enum(["User", "Event Coordinator"]),
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

  const onSubmitLogin = (data) => {
    toast.success("Login successful!");
  };

  const onSubmitRegister = (data) => {
    toast.success("Registration successful!");
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
                  <Form.Text className="text-danger">
                    {loginErrors.password.message}
                  </Form.Text>
                )}
              </Form.Group>

              <div className="d-grid gap-2">
                <Button type="submit" className={styles.customBtn}>
                  Login
                </Button>
                <Button variant="outline-danger" className="d-flex align-items-center justify-content-center">
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
                    onBlur: (e) =>
                      setValue("username", e.target.value.toLowerCase()),
                  })}
                  isInvalid={!!errors.username}
                />
                {errors.username && (
                  <Form.Text className="text-danger">
                    {errors.username.message}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  {...register("email", { onChange: () => trigger("email") })}
                  isInvalid={!!errors.email}
                />
                {errors.email && (
                  <Form.Text className="text-danger">
                    {errors.email.message}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  {...register("password", {
                    onChange: () => trigger("password"),
                  })}
                  isInvalid={!!errors.password}
                />
                {errors.password && (
                  <Form.Text className="text-danger">
                    {errors.password.message}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  {...register("confirmPassword", {
                    onChange: () => trigger("confirmPassword"),
                  })}
                  isInvalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <Form.Text className="text-danger">
                    {errors.confirmPassword.message}
                  </Form.Text>
                )}
              </Form.Group>

              <div className="d-grid">
                <Button type="submit" className={styles.customBtn}>
                  Register
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

        {/* Role Selection Modal */}
        <Modal show={showRoleModal} centered backdrop="static">
          <Modal.Body className={styles.modalBody}>
            <div className="d-grid gap-3">
              <Button
                variant="outline-primary"
                className="text-start p-3 d-flex align-items-center"
                onClick={() => handleRoleSelect("User")}
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
                onClick={() => handleRoleSelect("Event Coordinator")}
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
