import React, { useState } from "react";
import api from "../utils/api";
import { toast, ToastContainer } from "react-toastify";
import { Form, Button } from "react-bootstrap";
import styles from "../assets/css/login_reg.module.css";
import "react-toastify/dist/ReactToastify.css";

const SendResetLink = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post("/users/forgot-password/", {
        login: email,
      });
      setMessage(response.data.message);
      setError("");
      toast.success("Reset link sent successfully!");
    } catch (err) {
      const errorMessage =
        err.response?.status === 404
          ? "No account found with this email address"
          : err.response?.data?.error || "Something went wrong";

      setError(errorMessage);
      setMessage("");
      toast.error(errorMessage);
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
            Forgot Password
          </h3>
          <p className="text-center text-muted mb-4">
            Enter your email address below, and we'll send you a link to reset your password.
          </p>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: '500', color: '#555' }}>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="py-2 px-3"
                style={{ borderRadius: '8px', border: '1px solid #dde1e7', boxShadow: 'none' }}
              />
            </Form.Group>

            <div className="d-grid gap-3 mt-4">
              <Button 
                type="submit" 
                className={styles.customBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
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

export default SendResetLink;
