import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from "./pages/HomePage";
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SubmitTranscript from './pages/SubmitTranscript';
import RegisterPage from './pages/RegisterPage';
import ContactPage from "./pages/ContactPage";
import TermsOfService from "./pages/TermsOfService";
import StudentDashboard from "./pages/StudentDashboard";
import SchoolDashboard from "./pages/SchoolDashboard";
import PublicRoute from "./components/PublicRoute";


const App = () => (
  <Router>
    <Navbar />
    <div className="p-6">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/submit-transcript" element={<SubmitTranscript />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/school-dashboard" element={<SchoolDashboard />} />
        <Route path="/login" element={<PublicRoute><LoginPage /> </PublicRoute>} />
        <Route path="/register" element={<PublicRoute> <RegisterPage /></PublicRoute>} />
      </Routes>
    </div>
  </Router>
);

export default App;