//src/pages/LoginPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirect = new URLSearchParams(location.search).get("redirect");

  const destinationFor = (role) => {
    if (redirect) return redirect;
    if (role === "admin") return "/admin/dashboard";
    if (role === "institution") return "/institution-dashboard";
    if (role === "student") return "/student-dashboard";
    return "/dashboard";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr("");

    try {
      // 1️⃣ Login to get token
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        {
          email,
          password,
        }
      );

      // 2️⃣ Fetch user info right after
      const meRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const me = meRes.data;

      // 3️⃣ Save both in context — this updates Navbar instantly
      login(data.token, me);

      // 4️⃣ Redirect based on role
      navigate(destinationFor(me?.role), { replace: true });
    } catch (error) {
      console.error(error);
      setErr("Login failed: Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-slate-950 text-white px-6 py-24">
      {/* subtle radial brand glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.12),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-slate-900 font-bold text-[10px] leading-none shadow-[0_15px_40px_rgba(251,191,36,0.45)]">
            ATB
          </div>

          <h1 className="mt-4 text-2xl font-semibold text-white tracking-tight">
            Sign in
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            Access your dashboard and track your requests.
          </p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-[0_30px_120px_-10px_rgba(251,191,36,0.4)]">
          {err && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 placeholder-slate-500"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 placeholder-slate-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 text-slate-900 font-semibold text-sm px-4 py-3 shadow-[0_20px_60px_-10px_rgba(251,191,36,0.5)] hover:shadow-[0_30px_80px_-10px_rgba(251,191,36,0.7)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Helper links */}
          <div className="mt-5 flex flex-col gap-3 text-center text-sm">
            <Link
              to="/forgot-password"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Forgot your password?
            </Link>

            <div className="text-slate-400">
              New to Anacaona Transcript Bridge?{" "}
              <Link
                to="/register"
                className="text-amber-300 hover:text-amber-200 font-medium"
              >
                Create an account
              </Link>
            </div>
          </div>

          {/* reassurance */}
          <p className="text-[11px] text-slate-500 leading-relaxed mt-6 text-center">
            We verify transcripts directly with Haitian institutions.
            You always see the status. Nothing is sent without consent.
          </p>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
