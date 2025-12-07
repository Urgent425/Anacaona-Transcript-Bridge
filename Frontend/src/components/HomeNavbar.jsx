//src/components/HomeNavbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function HomeNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Add blur / border / shadow once user scrolls a bit
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Resolve dashboard path based on role
  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "student") return "/student-dashboard";
    if (user.role === "institution") return "/institution-dashboard";
    if (
      user.role === "admin" ||
      user.role === "superadmin" ||
      user.role === "translator" ||
      user.role === "reviewer"
    ) {
      // you told me earlier you actually use "SuperAdmin", "Translator", "Reviewer"
      // not plain "admin", so we include them all here.
      return "/admin/dashboard";
    }
    return "/login";
  };

  // handle logout then go home
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // little helper for greeting text
  const helloName = user?.firstName ?? user?.name ?? "User";

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all",
        scrolled
          ? "bg-slate-900/70 backdrop-blur-xl border-b border-white/10 shadow-[0_20px_80px_-10px_rgba(0,0,0,0.8)]"
          : "bg-transparent border-b border-transparent",
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* ===== BRAND / LOGO ===== */}
        <Link
          to="/"
          className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-slate-900 font-bold text-[10px] leading-none shadow-[0_15px_40px_rgba(251,191,36,0.45)]">
            ATB
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white">
              Anacaona
            </span>
            <span className="text-[10px] font-normal text-slate-400 -mt-0.5">
              Transcript Bridge
            </span>
          </div>
        </Link>

        {/* ===== DESKTOP NAV ===== */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {/* Marketing links (always visible) */}
          <a
            href="#how"
            className="text-slate-300 hover:text-white transition-colors"
          >
            How it works
          </a>

          <a
            href="#pricing"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Pricing
          </a>

          {/* If logged in: dashboard link + greeting + logout */}
          {user ? (
            <>
              <Link
                to={getDashboardLink()}
                className="text-slate-200 hover:text-white transition-colors"
              >
                Dashboard
              </Link>

              <span className="text-slate-400 text-xs">
                Hi,{" "}
                <span className="text-white font-medium">{helloName}</span>
              </span>

              <button
                onClick={handleLogout}
                className="inline-flex items-center rounded-xl border border-white/20 text-slate-200 hover:bg-white/10 hover:text-white text-xs font-medium px-3 py-2 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </>
          ) : (
            /* If logged out: Login + Get Started */
            <>
              <Link
                to="/login"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 text-slate-900 font-medium px-4 py-2 text-xs shadow-[0_20px_60px_-10px_rgba(251,191,36,0.5)] hover:shadow-[0_30px_80px_-10px_rgba(251,191,36,0.7)] transition-shadow"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>

        {/* ===== MOBILE MENU BUTTON ===== */}
        <button
          onClick={() => setOpen(true)}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-200 hover:bg-white/10 hover:text-white transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ===== MOBILE DRAWER ===== */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* dark backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* side panel */}
          <div className="absolute top-0 right-0 h-full w-[80%] max-w-[320px] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.9)] flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
              <div className="flex items-center gap-2 text-white">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-slate-900 font-bold text-[10px] leading-none shadow-[0_15px_40px_rgba(251,191,36,0.45)]">
                  ATB
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-white">
                    Anacaona
                  </span>
                  <span className="text-[10px] font-normal text-slate-400 -mt-0.5">
                    Transcript Bridge
                  </span>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:bg-white/10 hover:text-white transition"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer body nav */}
            <nav className="flex-1 flex flex-col px-5 py-6 text-sm text-slate-200">
              {/* Public links */}
              <a
                href="#how"
                onClick={() => setOpen(false)}
                className="py-3 border-b border-white/5 hover:text-white"
              >
                How it works
              </a>

              <a
                href="#pricing"
                onClick={() => setOpen(false)}
                className="py-3 border-b border-white/5 hover:text-white"
              >
                Pricing
              </a>

              {/* Auth-aware area */}
              {user ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    onClick={() => setOpen(false)}
                    className="py-3 border-b border-white/5 hover:text-white flex justify-between items-center"
                  >
                    <span>Dashboard</span>
                    <span className="text-[11px] text-slate-500">
                      {helloName}
                    </span>
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="mt-6 inline-flex items-center justify-center rounded-xl border border-white/20 text-slate-200 hover:bg-white/10 hover:text-white text-xs font-medium px-4 py-3 transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="py-3 border-b border-white/5 hover:text-white"
                  >
                    Login
                  </Link>

                    <Link
                      to="/register"
                      onClick={() => setOpen(false)}
                      className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 text-slate-900 font-medium px-4 py-3 text-xs shadow-[0_20px_60px_-10px_rgba(251,191,36,0.5)] hover:shadow-[0_30px_80px_-10px_rgba(251,191,36,0.7)] transition-shadow w-full"
                    >
                      Get Started
                    </Link>
                </>
              )}

              {/* tagline */}
              <div className="mt-8 text-[11px] text-slate-500 leading-relaxed">
                Secure transcript, verification, and translation services
                for Haitian students worldwide.
              </div>
            </nav>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t border-white/10 text-[11px] text-slate-600">
              © {new Date().getFullYear()} Anacaona Transcript Bridge
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
