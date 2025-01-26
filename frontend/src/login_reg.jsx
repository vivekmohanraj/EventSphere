import React, { useState } from "react";

const LoginRegistration = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePic: null,
    userType: "", // User or Event Coordinator
  });
  const [errors, setErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const accentColor = "#ff4a17"; // Accent color from the provided CSS

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      profilePic: null,
      userType: "",
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleValidation = (field) => {
    let error = "";
    switch (field) {
      case "email":
        error = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? "" : "Invalid email";
        break;
      case "password":
        error = formData.password.length >= 8 ? "" : "Password must be at least 8 characters";
        break;
      case "confirmPassword":
        error = formData.password === formData.confirmPassword ? "" : "Passwords do not match";
        break;
      case "username":
        error = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+$/.test(formData.username) && !/\s/.test(formData.username)
          ? ""
          : "Username must not contain spaces and only include letters, numbers, or special characters";
        break;
      case "firstName":
      case "lastName":
        error = formData[field].trim().length > 0 ? "" : "Name cannot start with a blank space";
        break;
      default:
        break;
    }
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    ["email", "password", "confirmPassword", "username", "firstName", "lastName"].forEach((field) => {
      const error = handleValidation(field);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkUsernameAvailability = async (username) => {
    // Simulated API call to check username availability
    const takenUsernames = ["existingUser", "testUser"];
    return !takenUsernames.includes(username);
  };

  const checkEmailAvailability = async (email) => {
    // Simulated API call to check if email is already registered
    const registeredEmails = ["test@example.com", "user@example.com"];
    return !registeredEmails.includes(email);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Perform login logic here
    alert("Login successful!" + JSON.stringify(formData, null, 2));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const isUsernameAvailable = await checkUsernameAvailability(formData.username);
    const isEmailAvailable = await checkEmailAvailability(formData.email);

    if (!isUsernameAvailable) {
      setErrors((prev) => ({ ...prev, username: "Username is already taken" }));
      return;
    }

    if (!isEmailAvailable) {
      setErrors((prev) => ({ ...prev, email: "An account with this email already exists" }));
      return;
    }

    setIsModalOpen(true);
  };

  const handleUserTypeSelection = (type) => {
    setFormData({ ...formData, userType: type });
    setIsModalOpen(false);
    alert("Registration Successful: " + JSON.stringify(formData, null, 2));
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        <h1
          className="text-2xl font-bold text-center mb-4"
          style={{ color: accentColor }}
        >
          {isLogin ? "Login" : "Register"}
        </h1>
        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {!isLogin && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Profile Picture</label>
                <input
                  type="file"
                  name="profilePic"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md px-3 py-2"
                />
                <small className="text-red-500">{errors.firstName}</small>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md px-3 py-2"
                />
                <small className="text-red-500">{errors.lastName}</small>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md px-3 py-2"
                />
                <small className="text-red-500">{errors.username}</small>
              </div>
            </>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            />
            <small className="text-red-500">{errors.email}</small>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            />
            <small className="text-red-500">{errors.password}</small>
          </div>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2"
              />
              <small className="text-red-500">{errors.confirmPassword}</small>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md"
            style={{ backgroundColor: accentColor }}
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>
        <button
          onClick={toggleForm}
          className="w-full text-sm text-gray-500 mt-4"
        >
          {isLogin
            ? "Don't have an account? Register here."
            : "Already have an account? Login here."}
        </button>
        <button
          className="w-full flex justify-center items-center border mt-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          <i className="bi bi-google mr-2"></i> Sign in with Google
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Choose Account Type</h2>
            <button
              onClick={() => handleUserTypeSelection("User")}
              className="bg-blue-500 text-white px-4 py-2 rounded-md mr-4"
            >
              User
            </button>
            <button
              onClick={() => handleUserTypeSelection("Event Coordinator")}
              className="bg-green-500 text-white px-4 py-2 rounded-md"
            >
              Event Coordinator
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginRegistration;
