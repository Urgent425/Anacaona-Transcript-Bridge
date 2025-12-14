// src/pages/UsersPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";     // <- optional helper we provided
import { Badge } from "../components/ui/badge";     // <- optional helper we provided

export default function UsersPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Translator" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // UI state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL | Translator | Reviewer | SuperAdmin

  // Reset password modal state
  const [resetForId, setResetForId] = useState(null);
  const [tempPassword, setTempPassword] = useState("");

  const token = localStorage.getItem("token");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      // If you want server-side filtering, use ?roles=Translator,Reviewer,SuperAdmin (comma-separated)
      const rolesQuery = roleFilter !== "ALL" ? `?roles=${encodeURIComponent(roleFilter)}` : "";
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users${rolesQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  // If you want live re-query on role filter via server: uncomment next line
  // useEffect(() => { load(); }, [roleFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter(u => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      );
    });
  }, [list, search, roleFilter]);

  const createUser = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      setForm({ name: "", email: "", password: "", role: "Translator" });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const activate = async (id) => {
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users/${id}/activate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const suspend = async (id) => {
    if (!window.confirm("Suspend this admin user? They won't be able to log in.")) return;
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users/${id}/suspend`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const changeRole = async (id, role) => {
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const submitResetPassword = async (e) => {
    e.preventDefault();
    if (!resetForId) return;
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users/${resetForId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tempPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      setTempPassword("");
      setResetForId(null);
      alert("Temporary password set.");
    } catch (e) {
      setError(e.message);
    }
  };

  const RoleBadge = ({ role }) => {
    const map = {
      SuperAdmin: "bg-purple-100 text-purple-800",
      Translator: "bg-sky-100 text-sky-800",
      Reviewer:   "bg-amber-100 text-amber-800",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[role] || "bg-gray-100 text-gray-700"}`}>
        {role}
      </span>
    );
  };

  // We don't have isActive in GET payload yet; expose it if you add projection
  // For now, assume inactive users won't be returned. If you include isActive, show badge:
  const StatusBadge = ({ isActive }) => {
    return isActive === false ? (
      <Badge variant="danger">Suspended</Badge>
    ) : (
      <Badge variant="success">Active</Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Admin Users & Roles</h2>
          <p className="text-sm text-gray-500">Create, suspend, change roles, and reset passwords for admin accounts.</p>
        </div>
        <Button variant="outline" onClick={load}>↻ Refresh</Button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Create admin */}
      <form onSubmit={createUser} className="rounded-xl border bg-white p-4 shadow-sm grid md:grid-cols-5 gap-2">
        <Input placeholder="Full name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        <Input placeholder="email@anacaona.org" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
        <Input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
        <select className="border rounded px-3 py-2 text-sm" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
          <option value="Translator">Translator</option>
          <option value="Reviewer">Reviewer</option>
          <option value="SuperAdmin">Super Admin</option>
        </select>
        <Button type="submit">Create</Button>
      </form>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1">
          <Input placeholder="Search name/email/role…" value={search} onChange={(e)=>setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["ALL","Translator","Reviewer","SuperAdmin"].map(r => (
            <button
              key={r}
              className={`px-3 py-2 text-sm rounded border ${roleFilter===r ? "bg-gray-100 font-medium" : "bg-white hover:bg-gray-50"}`}
              onClick={()=>setRoleFilter(r)}
              type="button"
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-500 animate-pulse">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No users found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-left text-gray-700">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={u.role} />
                        {/* Inline role change */}
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={u.role}
                          onChange={(e)=>changeRole(u._id, e.target.value)}
                        >
                          <option value="Translator">Translator</option>
                          <option value="Reviewer">Reviewer</option>
                          <option value="SuperAdmin">Super Admin</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {/* If you include isActive in GET projection, show it here */}
                      {"isActive" in u && u.isActive === false ? (<span className="text-xs text-gray-400">Inactive</span>) 
                      : (<span className="text-xs text-gray-400">Active</span>)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        {/* Activate/Suspend */}
                        {"isActive" in u && u.isActive === false ? (
                          <Button size="sm" onClick={()=>activate(u._id)}>Activate</Button>
                        ) : (
                          <Button size="sm" variant="destructive" onClick={()=>suspend(u._id)}>Suspend</Button>
                        )}
                        {/* Reset password */}
                        <Button size="sm" variant="outline" onClick={()=>setResetForId(u._id)}>Reset PW</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple reset password modal (inline) */}
      {resetForId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-2">Set Temporary Password</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter a temporary password (min 8 chars). The user will be asked to change it on first login (implement on your admin login flow).
            </p>
            <form onSubmit={submitResetPassword} className="space-y-3">
              <Input
                type="password"
                placeholder="Temporary password"
                value={tempPassword}
                onChange={(e)=>setTempPassword(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={()=>{ setResetForId(null); setTempPassword(""); }}>
                  Cancel
                </Button>
                <Button type="submit">Set Password</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
