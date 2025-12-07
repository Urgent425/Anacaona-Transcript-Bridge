// src/components/RequireAdminAuth.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAdminAuth({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Optionally decode and verify role here

  return children;
}
