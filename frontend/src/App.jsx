import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./home.jsx";
import Header from "./header.jsx";
import Footer from "./footer.jsx";
import LoginRegistration from "./login_reg.jsx";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<LoginRegistration />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
