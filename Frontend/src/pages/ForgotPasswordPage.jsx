// src/pages/ForgotPasswordPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full px-3 py-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
        <p className="text-center mt-4">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
}
