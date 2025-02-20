// App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom"; // Import necessary routing components
import Home from "./components/home.jsx";
import Header from "./components/header.jsx";
import Footer from "./components/footer.jsx"; // Import the LoginPage component
import Homejs from "./components/homejs";
import ProtectedRoute from "./components/protectedRoute.jsx";
import LoginRegistration from "./components/login_reg.jsx";
// import { PasswordReset, ResetLinkSent } from "./components/forgotResetPassword";
import SendResetLink from "./components/sendResetLink.jsx";
import ResetPassword from "./components/forgotResetPassword.jsx";

function logout() {
  localStorage.clear();
  return <Navigate to="/" />;
}

function registerAndLogout() {
  localStorage.clear();
  return <LoginRegistration />;
}

function App() {
  return (
    <Router>
      <Homejs></Homejs>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} /> {/* Home page route */}
        <Route path="/login_reg" element={<LoginRegistration />} />{" "}
        <Route path="/reset-link-sent" element={<SendResetLink/>} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        {/* Home page route */}
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
