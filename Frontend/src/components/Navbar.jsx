// src/components/Navbar.jsx
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link to="/" className="font-bold">Anacaona</Link>

        <div className="flex items-center gap-4">
          <Link to="/contact">Contact</Link>
          <Link to="/terms">Terms</Link>

          {user ? (
            <>
              <span>Hi, {user.firstName ?? user.name ?? "User"}</span>
              {user.role === "student" && <Link to="/student-dashboard">My Dashboard</Link>}
              {user.role === "institution" && <Link to="/institution-dashboard">Institution Dashboard</Link>}
              {user.role === "admin" && <Link to="/admin/dashboard">Admin</Link>}
              <button onClick={logout} className="px-3 py-1 border rounded">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="px-3 py-1 border rounded">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
