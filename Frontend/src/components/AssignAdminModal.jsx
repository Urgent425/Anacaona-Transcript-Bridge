// src/components/AssignAdminModal.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";

/**
 * Props:
 *  - entity: "transcript" | "translation"
 *  - entityId: string
 *  - currentAssignee: { _id, name, role } | null
 *  - onAssigned: () => void
 *  - roles: CSV roles filter for /api/admin/users (must match backend role strings)
 *  - allowUnassign: boolean (optional)
 */
export default function AssignAdminModal({
  entity,
  entityId,
  currentAssignee,
  onAssigned,
  roles = "Translator,Reviewer",
  allowUnassign = false,
}) {
  const [open, setOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);

  const assignPath =
    entity === "transcript"
      ? `${process.env.REACT_APP_API_URL}/api/admin/assignments/transcripts/${entityId}/assign-admin`
      : `${process.env.REACT_APP_API_URL}/api/admin/assignments/translation-requests/${entityId}/assign-admin`;

  // When dialog opens, preselect current assignee if we have a usable _id
  useEffect(() => {
    if (!open) return;
    setSelected(currentAssignee?._id || "");
  }, [open, currentAssignee?._id]);

  // Fetch admins only when dialog opens
  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        if (!token) throw new Error("Missing admin token");

        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/admin/users?roles=${encodeURIComponent(
            roles
          )}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Non-JSON response (${res.status}) ${text.slice(0, 120)}`);
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
  }, [open, roles, token]);

  const assign = async () => {
    try {
      if (!token) throw new Error("Missing admin token");

      const body = allowUnassign && selected === "__UNASSIGN__"
        ? { adminId: null }
        : { adminId: selected };

      const res = await fetch(assignPath, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const ct = res.headers.get("content-type") || "";
      const okJson = ct.includes("application/json");
      const payload = okJson ? await res.json() : await res.text();

      if (!res.ok) {
        throw new Error((okJson ? payload?.message : payload) || `HTTP ${res.status}`);
      }

      setOpen(false);
      onAssigned?.();
    } catch (e) {
      alert(e.message || "Assign failed");
    }
  };

  const title = currentAssignee?.name
    ? `Reassign (current: ${currentAssignee.name})`
    : "Assign to Admin";

  const confirmDisabled =
    loading ||
    !!error ||
    (!selected && !(allowUnassign && selected === "__UNASSIGN__"));

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setError("");
          setSelected("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {currentAssignee ? "Reassign" : "Assign"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-gray-500">Loading admins…</p>
        ) : error ? (
          <p className="text-sm text-red-600">Error: {error}</p>
        ) : (
          <div className="space-y-2">
            <select
              className="w-full border rounded px-2 py-2 text-sm"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">
                Select admin…
              </option>

              {allowUnassign && (
                <option value="__UNASSIGN__">Unassign</option>
              )}

              {admins.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} — {a.role}
                </option>
              ))}
            </select>

            {!currentAssignee?._id && currentAssignee?.name ? (
              <p className="text-[11px] text-amber-700">
                Note: current assignee has no id in this view. To preselect correctly, pass
                currentAssignee as {"{ _id, name, role }"} from the backend list endpoint.
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button disabled={confirmDisabled} onClick={assign}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
