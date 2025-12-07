// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    role: "student",
    institutionId: "",   // added to match usage
    institutionName: "", // you had these in state
    position: "",
  });

  // Institutions list
  const [institutions, setInstitutions] = useState([]);

  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // Load institutions
  useEffect(() => {
    fetch("http://localhost:5000/api/institutions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInstitutions(data);
      })
      .catch((fetchErr) => {
        console.error("Failed to load institutions", fetchErr);
      });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (form.password !== form.confirmPassword) {
        setErr("Passwords do not match.");
        return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        // You were doing alert() + navigate, we'll keep navigate
        navigate("/login");
      } else {
        setErr(data.message || "Registration failed");
      }
    } catch (catchErr) {
      console.error(catchErr);
      setErr("Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-slate-950 text-white px-6 py-24">
      {/* golden glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.12),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Branding / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-slate-900 font-bold text-[10px] leading-none shadow-[0_15px_40px_rgba(251,191,36,0.45)]">
            ATB
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-white tracking-tight">
            Create Your Account
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Start your evaluation or request certified translation.
          </p>
        </div>

        {/* Glass card */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-[0_30px_120px_-10px_rgba(251,191,36,0.4)]">
          {err && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-white mb-1"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  required
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none placeholder-slate-500 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  required
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none placeholder-slate-500 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
                />
              </div>
            </div>

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
                name="email"
                required
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none placeholder-slate-500 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
              />
            </div>

            {/* Password / Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  required
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none placeholder-slate-500 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none placeholder-slate-500 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-white mb-1"
              >
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none placeholder-slate-500 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
              />
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-white mb-1"
              >
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none placeholder-slate-500 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-white mb-1"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
              >
                <option value="student">Student</option>
                <option value="institution">Institution</option>
              </select>
            </div>

            {/* Institution-only fields */}
            {form.role === "institution" && (
              <>
                <div>
                  <label
                    htmlFor="institutionId"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Institution
                  </label>
                  <select
                    id="institutionId"
                    name="institutionId"
                    value={form.institutionId}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
                  >
                    <option value="">Select institution…</option>
                    {institutions.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="position"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Position / Title
                  </label>
                  <input
                    id="position"
                    name="position"
                    required
                    placeholder="Registrar, Administrator, etc."
                    value={form.position}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none placeholder-slate-500 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
                  />
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 text-slate-900 font-semibold text-sm px-4 py-3 shadow-[0_20px_60px_-10px_rgba(251,191,36,0.5)] hover:shadow-[0_30px_80px_-10px_rgba(251,191,36,0.7)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {submitting ? "Creating account..." : "Create account"}
            </button>

            <div className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-amber-300 hover:text-amber-200 font-medium"
              >
                Sign in
              </Link>
            </div>
          </form>

          {/* tiny reassurance */}
          <p className="text-[11px] text-slate-500 leading-relaxed mt-6 text-center">
            Your institution will confirm authenticity before any transcript is
            released to evaluation services or immigration.
          </p>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
