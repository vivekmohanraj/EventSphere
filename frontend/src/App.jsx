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
import AdminDashboard from "./components/admindashboard/adminDashboard.jsx";
import CoordinatorDashboard from "./components/coordinatordashboard/coordinatorDashboard.jsx";
import UserDashboard from "./components/userdashboard/userDashboard.jsx";
// Import global CSS for font consistency
import "./assets/css/fonts.css";

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
      {/* Preloader handler component */}
      <Homejs />
      
      <Routes>
        {/* Dashboard routes with their own layout - no Header/Footer */}
        <Route
          path="/admin-dashboard/*"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator-dashboard/*"
          element={
            <ProtectedRoute>
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-dashboard/*"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Legacy dashboard route - redirects to the admin dashboard */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Navigate to="/admin-dashboard" replace />
            </ProtectedRoute>
          }
        />
        
        {/* Routes with Header and Footer */}
        <Route
          path="/*"
          element={
            <>
              {/* Include Header for all routes except dashboard */}
              <Header />
              
              <Routes>
                {/* Main routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login_reg" element={<LoginRegistration />} />
                
                {/* Protected routes */}
                <Route
                  path="/reset-link-sent"
                  element={
                    <ProtectedRoute>
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
              </Routes>
              
              {/* Include Footer for all routes except dashboard */}
              <Footer />
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
