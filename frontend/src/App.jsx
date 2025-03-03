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
import EventList from "./components/events.jsx";
import EventCreation from "./components/eventCreatoin.jsx";
import EventDetails from "./components/eventDetails";

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
        <Route
          path="/reset-link-sent"
          element={
            <ProtectedRoute>
              {" "}
              <SendResetLink />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reset-password/:uid/:token"
          element={
            <ProtectedRoute>
              <ResetPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <EventList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-event"
          element={
            <ProtectedRoute>
              <EventCreation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <EventDetails />
            </ProtectedRoute>
          }
        />
        {/* Home page route */}
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
