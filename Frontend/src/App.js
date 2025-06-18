import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SubmitTranscript from './pages/SubmitTranscript';
import RegisterPage from './pages/RegisterPage';

const App = () => (
  <Router>
    <Navbar />
    <div className="p-6">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/submit-transcript" element={<SubmitTranscript />} />
      </Routes>
    </div>
  </Router>
);

export default App;