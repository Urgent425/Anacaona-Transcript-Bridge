//src/components/AssignInstitutionModal
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";

export function AssignInstitutionModal({ submissionId, onAssigned, assignedInstitution }) {
  const [open, setOpen] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");

  const isAssigned = !!assignedInstitution; // ← key line
  const assignedName = assignedInstitution?.name;

  // Only load institutions when the dialog opens (and only if not already assigned)
  useEffect(() => {
    if (!open || isAssigned) return;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/institutions`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setInstitutions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load institutions:", err);
        setInstitutions([]);
        setError("Could not load institutions");
      }
    })();
  }, [open, isAssigned]);

  const assign = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/transcripts/${submissionId}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ institutionId: selected }),
        }
      );
      if (!res.ok) throw new Error(`Assign failed (${res.status})`);
      setOpen(false);
      onAssigned(); // parent will re-fetch and pass updated assignedInstitution
    } catch (err) {
      console.error("Assign error:", err);
      setError("Assignment failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={isAssigned ? "secondary" : "outline"}
          disabled={isAssigned}
          title={isAssigned && assignedName ? `Assigned to ${assignedName}` : undefined}
        >
          {isAssigned ? (assignedName ? `Assigned: ${assignedName}` : "Assigned") : "Assign to institution"}
        </Button>
      </DialogTrigger>

      {/* If already assigned, don’t show the modal content */}
      {!isAssigned && (
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign to Institution</DialogTitle>
          </DialogHeader>

          {error && <p className="text-red-600 mb-2">{error}</p>}

          <div className="py-4">
            <select
              className="w-full border rounded px-2 py-1"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Select institution…</option>
              {institutions.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button disabled={!selected} onClick={assign}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
