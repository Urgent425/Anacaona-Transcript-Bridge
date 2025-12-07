//src/pages/Dashboard.jsx
import React from "react";
import { jwtDecode } from "jwt-decode";
import StudentDashboard from "./StudentDashboard";
import InstitutionDashboard from "./InstitutionDashboard";

const Dashboard = () => {
  const token = localStorage.getItem("token");
  if (!token) return <p>Please log in</p>;

  const { role } = jwtDecode(token);
  return role === "institution" ? <InstitutionDashboard/> : <StudentDashboard />;
};

export default Dashboard;