// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();

  // NOTE:
  // - "role" is what your backend already expects: "student" | "institution"
  // - "accountType" is UI-only: "student" | "other" | "institution"
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    role: "student",
    institutionId: "",
    institutionName: "",
    position: "",
    // Optional: UI hint (backend can ignore safely)
    clientType: "student", // "student" | "other"
  });

  const [accountType, setAccountType] = useState("student"); // UI selector
  const [institutions, setInstitutions] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // Load institutions
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/institutions`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInstitutions(data);
      })
      .catch((fetchErr) => {
        console.error("Failed to load institutions", fetchErr);
      });
  }, []);

  // Keep backend role aligned with UI accountType
  useEffect(() => {
    if (accountType === "institution") {
      setForm((prev) => ({
        ...prev,
        role: "institution",
        clientType: "student", // not used for institution; keep stable
      }));
      return;
    }

    // accountType === "student" OR "other" -> backend role is "student"
    setForm((prev) => ({
      ...prev,
      role: "student",
      clientType: accountType === "other" ? "other" : "student",
      // If switching away from institution, clear institution-only fields
      institutionId: "",
      institutionName: "",
      position: "",
    }));
  }, [accountType]);

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
      const payload = { ...form };

      // Safety: force correct role at submit time too
      if (accountType === "institution") {
        payload.role = "institution";
      } else {
        payload.role = "student";
      }

      // If not institution, ensure institution-only fields are not sent (optional but cleaner)
      if (payload.role !== "institution") {
        delete payload.institutionId;
        delete payload.position;
      }

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
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

  const isInstitution = accountType === "institution";
  const isOther = accountType === "other";

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-slate-950 text-white px-6 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.12),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-slate-900 font-bold text-[10px] leading-none shadow-[0_15px_40px_rgba(251,191,36,0.45)]">
            ATB
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-white tracking-tight">
            Create Your Account
          </h1>
          <p className="text-slate-200 text-sm mt-2">
            {isInstitution
              ? "Register as a Haitian institution to submit/verify official records."
              : isOther
              ? "Register for Translation Only — for individuals and organizations (no student status required)."
              : "Register as a student for evaluation workflows and optional translation."}
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-[0_30px_120px_-10px_rgba(251,191,36,0.4)]">
          {err && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account type (UI) */}
            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-white mb-1">
                Account Type
              </label>
              <select
                id="accountType"
                name="accountType"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
              >
                <option value="student">Student (Evaluation)</option>
                <option value="other">Individual / Organization (Translation Only)</option>
                <option value="institution">Haitian Institution (Official Records)</option>
              </select>

              <p className="mt-2 text-[12px] text-slate-200 leading-relaxed">
                {isInstitution ? (
                  <>
                    Choose this only if you are a Haitian school/university staff member submitting or confirming
                    official academic records.
                  </>
                ) : isOther ? (
                  <>
                    Not a student? No problem. Choose this for translation-only requests. (Just a different service path.)
                  </>
                ) : (
                  <>
                    Choose this if you are submitting transcript packages for evaluation workflows (education or immigration).
                  </>
                )}
              </p>
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-white mb-1">
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
                <label htmlFor="lastName" className="block text-sm font-medium text-white mb-1">
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
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
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
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
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
              <label htmlFor="phone" className="block text-sm font-medium text-white mb-1">
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
              <label htmlFor="address" className="block text-sm font-medium text-white mb-1">
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

            {/* Institution-only fields */}
            {isInstitution && (
              <>
                <div>
                  <label htmlFor="institutionId" className="block text-sm font-medium text-white mb-1">
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
                  <label htmlFor="position" className="block text-sm font-medium text-white mb-1">
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 text-slate-900 font-semibold text-sm px-4 py-3 shadow-[0_20px_60px_-10px_rgba(251,191,36,0.5)] hover:shadow-[0_30px_80px_-10px_rgba(251,191,36,0.7)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {submitting ? "Creating account..." : "Create account"}
            </button>

            <div className="text-center text-sm text-slate-200">
              Already have an account?{" "}
              <Link to="/login" className="text-amber-300 hover:text-amber-200 font-medium">
                Sign in
              </Link>
            </div>
          </form>

          {/* tiny reassurance - make it contextual */}
          <p className="text-[11px] text-slate-200 leading-relaxed mt-6 text-center">
            {isInstitution
              ? "Institutions can submit or confirm official records for students when required."
              : isOther
              ? "Translation-only requests do not require school verification."
              : "Your institution will confirm authenticity before any transcript is released to evaluation services or immigration."}
          </p>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
