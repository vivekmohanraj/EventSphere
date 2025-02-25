import React, { useState } from "react";
import axios from "axios";
import { sendResetLink } from "../utils/api.js";
import api from "../utils/api";

const SendResetLink = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/users/forgot-password/", {
        login: email,
      });
      setMessage(response.data.message);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
      setMessage("");
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
      <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
        <h2 style={{ color: "#ff4a17" }}>Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="email"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: "#ff4a17",
              color: "#fff",
              padding: "10px 15px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Send Reset Link
          </button>
        </form>
        {message && (
          <p style={{ color: "green", marginTop: "10px" }}>{message}</p>
        )}
        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      </div>
    </>
  );
};

export default SendResetLink;
