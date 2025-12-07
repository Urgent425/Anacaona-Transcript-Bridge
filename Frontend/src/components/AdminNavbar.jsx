// components/AdminNavbar.jsx
import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  }
  return (
    <header className="bg-white shadow-md fixed top-0 left-0 w-full z-50 px-8 py-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-yellow-600">Anacaona Admin</div>

      <nav className="space-x-6 hidden md:flex">
        {user?.role === "SuperAdmin"||"Translator"||"Reviewer" ? (
          <>
            <span class="text-2xl text-green-600">Hi, {user?.firstName ?? user?.name ?? "Admin"}</span>
            <button onClick={onLogout} className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700">
              Logout
            </button>
          </>
        ) : (
          <Link to="/admin/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Admin Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default AdminNavbar;
