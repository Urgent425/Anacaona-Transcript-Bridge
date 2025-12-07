// src/components/AssignAdminModal.jsx
import { useEffect, useState } from "react";
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogFooter
} from "./ui/dialog";
import { Button } from "./ui/button";

/**
 * Props:
 *  - entity: "transcript" | "translation"
 *  - entityId: string
 *  - currentAssignee: { _id, name, role } | null
 *  - onAssigned: () => void
 *  - roles: optional CSV of roles to show (default: "TRANSLATOR,REVIEWER")
 */
export default function AssignAdminModal({
  entity,
  entityId,
  currentAssignee,
  onAssigned,
  roles = "Translator,Reviewer",
}) {
  const [open, setOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // fetch the list **when the dialog opens**
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token"); // 🔐 IMPORTANT
        if (!token) throw new Error("Missing admin token");

        const res = await fetch(`http://localhost:5000/api/admin/users?roles=${encodeURIComponent(roles)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Non-JSON response (${res.status}) ${text.slice(0,80)}`);
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        setAdmins(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("AssignAdminModal: load admins failed", e);
        setAdmins([]);
        setError(e.message || "Failed to load admins");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, roles]);

  const assign = async () => {
    try {
      const token = localStorage.getItem("token"); // 🔐 IMPORTANT
      if (!token) throw new Error("Missing admin token");

      const path =
        entity === "transcript"
          ? `http://localhost:5000/api/admin/assignments/transcripts/${entityId}/assign-admin`
          : `http://localhost:5000/api/admin/assignments/translation-requests/${entityId}/assign-admin`;

      const res = await fetch(path, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminId: selected }),
      });

      const ct = res.headers.get("content-type") || "";
      const okJson = ct.includes("application/json");
      const payload = okJson ? await res.json() : await res.text();

      if (!res.ok) throw new Error((okJson ? payload?.message : payload) || `HTTP ${res.status}`);

      setOpen(false);
      onAssigned?.(); // refresh the row/table so currentAssignee updates
    } catch (e) {
      alert(e.message || "Assign failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelected(""); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {currentAssignee ? "Reassign" : "Assign"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {currentAssignee ? `Reassign (current: ${currentAssignee.name})` : "Assign to Admin"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-gray-500">Loading admins…</p>
        ) : error ? (
          <p className="text-sm text-red-600">Error: {error}</p>
        ) : (
          <select
            className="w-full border rounded px-2 py-1"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Select admin…</option>
            {admins.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} — {a.role}
              </option>
            ))}
          </select>
        )}

        <DialogFooter>
          <Button disabled={!selected || loading || !!error} onClick={assign}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
