// src/pages/admin/AdminLoginPage.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // optional redirect support
  const from = new URLSearchParams(location.search).get("redirect") || "/admin/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // 1) Login (use your admin endpoint, or switch to /api/auth/login if unified)
      const { data } = await axios.post("http://localhost:5000/api/admin/auth/login", {
        email,
        password,
      });

      // 2) Fetch profile (prefer the universal /api/auth/me; fallback to /api/admin/me if you kept separate)
      let me;
      try {
        const meRes = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        me = meRes.data;
      } catch (err) {
        // fallback if /api/auth/me isn't available for admins
        const meRes = await axios.get("http://localhost:5000/api/admin/me", {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        me = meRes.data;
      }

      // 3) Update global auth context (this makes AdminNavbar/AdminLayout re-render immediately)
      const raw = (me?.role ?? "").toString().trim().toLowerCase();
      const allowed = ["superadmin", "translator", "reviewer"];

      if (!allowed.includes(raw)) {
        return setError("This account is not authorized for the admin area.");
      }

      login(data.token, me);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Admin login failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="p-8 bg-white shadow rounded w-full max-w-sm">
        <h1 className="text-2xl mb-6 font-bold text-center">Admin Login</h1>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <label className="block mb-3">
          <span className="text-sm">Email</span>
          <input
            type="email"
            className="mt-1 p-2 w-full border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm">Password</span>
          <input
            type="password"
            className="mt-1 p-2 w-full border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Log In"}
        </button>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">
            Forgot your password?
          </Link>
        </div>
      </form>
    </div>
  );
}
