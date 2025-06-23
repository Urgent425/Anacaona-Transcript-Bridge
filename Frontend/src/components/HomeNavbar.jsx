import React from "react";
import { Link, useNavigate } from "react-router-dom";

const HomeNavbar = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 w-full z-50 px-8 py-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-yellow-600">
        Anacaona Transcript Bridge
      </div>

      <nav className="space-x-6 hidden md:flex">
        <a href="#mission" className="hover:text-blue-600">Mission</a>
        <a href="#services" className="hover:text-blue-600">Services</a>
        <a href="#news" className="hover:text-blue-600">News</a>
        <a href="#contact" className="hover:text-blue-600">Contact</a>

        {token ? (
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default HomeNavbar;