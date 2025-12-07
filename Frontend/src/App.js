// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layouts & guards
import Layout from "./components/Navbar";             // your public/app navbar
import Footer from "./components/Footer";
import AdminLayout from "./components/AdminLayout";
import RequireAdminAuth from "./components/RequireAdminAuth";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ContactPage from "./pages/ContactPage";
import TermsOfService from "./pages/TermsOfService";
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import InstitutionDashboard from "./pages/InstitutionDashboard";

import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import SubmissionDetailPage from "./pages/SubmissionDetailPage";
import TranslationPage from "./pages/TranslationPage";
import TranslationRequestDetailPage from "./pages/TranslationRequestDetailPage";
import InstitutionsPage from "./pages/InstitutionsPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminOfficialFiles from "./pages/AdminOfficialFiles";
import TranslationQueuePage from "./pages/TranslationQueuePage";

/** ---------- auth helpers (replace with your real auth) ---------- */
const getAuth = () => {
  // Example: token + role saved in localStorage after login
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // "student" | "institution" | "admin"
  return { isAuthed: !!token, role };
};

const ProtectedRoute = ({ children }) => {
  const { isAuthed } = getAuth();
  return isAuthed ? children : <Navigate to="/login" replace />;
};

const GuestOnlyRoute = ({ children }) => {
  const { isAuthed, role } = getAuth();
  if (!isAuthed) return children;
  // If already logged in, push to a sensible place by role
  if (role === "student") return <Navigate to="/student-dashboard" replace />;
  if (role === "institution") return <Navigate to="/institution-dashboard" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

/** ---------- layouts that wrap routes ---------- */
const PublicLayout = () => (
  <>
    <Layout />
    <div className="p-6">
      <Outlet />
    </div>
    <Footer />
  </>
);

// If you want a different navbar for logged-in users, swap Layout here.
// For now we reuse the same Layout to keep it simple.
const AppLayout = () => (
  <>
    <Layout />
    <div className="p-6">
      <Outlet />
    </div>
    <Footer />
  </>
);

export default function App() {
  return (
   <AuthProvider>
    <Router>
      <Routes>
        {/* ---------- Admin auth & area ---------- */}
        <Route
          path="/admin/login"
          element={
            <GuestOnlyRoute>
              <AdminLoginPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdminAuth>
              <AdminLayout />
            </RequireAdminAuth>
          }
        >
          {/* IMPORTANT: use RELATIVE paths under /admin so AdminLayout wraps them */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="submissions/:id" element={<SubmissionDetailPage />} />
          <Route path="translation" element={<TranslationPage />} />
          <Route path="translation-requests/:id" element={<TranslationRequestDetailPage />} />
          <Route path="institutions" element={<InstitutionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="translation-queue" element={<TranslationQueuePage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="officials" element={<AdminOfficialFiles />} />
        </Route>

        {/* ---------- Public area (no auth needed) ---------- */}
        <Route index element={<HomePage />} />
        <Route element={<PublicLayout />}>
          
          <Route
            path="/login"
            element={
              <GuestOnlyRoute>
                <LoginPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnlyRoute>
                <RegisterPage />
              </GuestOnlyRoute>
            }
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        {/* ---------- Authenticated app area (students/institutions) ---------- */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Generic user dashboard if you have it */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Role-specific dashboards */}
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/institution-dashboard" element={<InstitutionDashboard />} />
        </Route>

        {/* ---------- Fallback ---------- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
   </AuthProvider>  
  );
}
