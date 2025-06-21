import React from "react";
import { jwtDecode } from "jwt-decode";
import StudentDashboard from "./StudentDashboard";
import SchoolDashboard from "./SchoolDashboard";

const Dashboard = () => {
  const token = localStorage.getItem("token");
  if (!token) return <p>Please log in</p>;

  const { role } = jwtDecode(token);
  return role === "school" ? <SchoolDashboard /> : <StudentDashboard />;
};

export default Dashboard;