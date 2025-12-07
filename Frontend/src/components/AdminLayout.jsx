
import AdminNavbar from "../components/AdminNavbar";

import { Outlet, NavLink } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-white">
      <AdminNavbar/>
      {/* Sidebar */}
      <aside className="w-64 bg-gray-200  border-r">
        <div className="p-4 text-xl font-bold">Anacaona Admin</div>
        <nav className="mt-6">
          <ul className="space-y-2">
            {[
              { to: "dashboard", label: "Dashboard" },
              { to: "submissions", label: "Submissions" },
              { to: "translation", label: "Translation" },
              { to: "institutions", label: "Institutions" },
              { to: "reports", label: "Reports" },
               { to: "translation-queue", label: "Translation Queue" },
              { to: "users", label: "Users" },
              { to: "officials", label: "Official Transcripts" },
            ].map((link) => (
              <li key={link.to}>
                <NavLink
                  to={`/admin/${link.to}`}
                  className={({ isActive }) =>
                    isActive
                      ? "block px-4 py-2 bg-indigo-100 text-indigo-700 rounded"
                      : "block px-4 py-2 hover:bg-gray-100 rounded"
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pt-20 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}