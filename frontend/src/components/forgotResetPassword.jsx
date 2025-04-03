import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { Form, Button } from "react-bootstrap";
import { Eye, EyeOff } from "lucide-react";
import styles from "../assets/css/login_reg.module.css";
import api from "../utils/api";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    // Password validation rules
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!validatePassword(newPassword)) {
      setError(
        "Password must be at least 8 characters long, include uppercase, lowercase, numbers, and special characters."
      );
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post("/users/reset-password/", {
        uid,
        token,
        new_password: newPassword,
      });
      setMessage(response.data.message || "Password reset successful!");
      toast.success("Password has been reset successfully!");
      setError("");
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/login_reg");
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
      toast.error(err.response?.data?.error || "Password reset failed");
      setMessage("");
    } finally {
      setIsSubmitting(false);
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
            Reset Password
          </h3>
          <p className="text-center text-muted mb-4">
            Create a strong password that includes uppercase, lowercase, numbers, and special characters.
          </p>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: '500', color: '#555' }}>New Password</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
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
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: '500', color: '#555' }}>Confirm Password</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="py-2 px-3"
                  style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
                />
                {showConfirmPassword ? (
                  <EyeOff
                    size={20}
                    className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
                    onClick={() => setShowConfirmPassword(false)}
                    style={{ color: '#6b7280', cursor: 'pointer' }}
                  />
                ) : (
                  <Eye
                    size={20}
                    className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer"
                    onClick={() => setShowConfirmPassword(true)}
                    style={{ color: '#6b7280', cursor: 'pointer' }}
                  />
                )}
              </div>
            </Form.Group>

            <div className="d-grid gap-3 mt-4">
              <Button 
                type="submit" 
                className={styles.customBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </Form>

          {message && (
            <div className="alert alert-success mt-4" role="alert">
              {message}
            </div>
          )}
          {error && (
            <div className="alert alert-danger mt-4" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
