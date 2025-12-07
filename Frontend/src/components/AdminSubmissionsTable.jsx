// src/components/AdminSubmissionsTable.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { AssignInstitutionModal } from "./AssignInstitutionModal";
import useAdminPerms from "../hooks/useAdminPerms";
import AssignAdminModal from "./AssignAdminModal";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

// small helper: status pill
function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-300 px-2 py-0.5 text-[11px] font-medium capitalize">
        —
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-medium capitalize">
        <Clock className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  }

  if (status === "approved") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium capitalize">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[11px] font-medium capitalize">
        <XCircle className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-300 px-2 py-0.5 text-[11px] font-medium capitalize">
      {status}
    </span>
  );
}

// just capitalize+fallback for purpose
function PurposeChip({ purpose }) {
  if (!purpose) {
    return (
      <span className="inline-block rounded-md bg-slate-100 text-slate-600 border border-slate-300 px-2 py-0.5 text-[11px] font-medium">
        —
      </span>
    );
  }
  return (
    <span className="inline-block rounded-md bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[11px] font-medium capitalize">
      {purpose}
    </span>
  );
}

// helper: relative age text, super basic
function formatAge(createdAt) {
  if (!createdAt) return "";
  const createdMs = new Date(createdAt).getTime();
  const diffMs = Date.now() - createdMs;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export default function AdminSubmissionsTable({
  submissions,
  onRefresh,
  loading, // optional prop we added from page
}) {
  const navigate = useNavigate();
  const { loading: permsLoading, canSelfAssign, canAssignToOthers } =
    useAdminPerms();

  const selfAssign = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admin/assignments/transcripts/${id}/self-assign`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 409) {
        alert("Someone else already took this submission.");
        return onRefresh?.();
      }
      if (!res.ok) throw new Error(`Self-assign failed (${res.status})`);
      onRefresh?.();
    } catch (e) {
      console.error(e);
      alert("Could not self-assign.");
    }
  };

  // EMPTY STATE
  if (!loading && (!submissions || submissions.length === 0)) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 bg-white">
        <div className="text-slate-900 font-medium mb-1">
          No submissions found
        </div>
        <div className="text-[12px] text-slate-500">
          All clear — nothing to review right now.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[1000px] text-left">
        <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 font-medium">Student</th>
            <th className="px-4 py-3 font-medium">Submission ID</th>
            <th className="px-4 py-3 font-medium">Purpose</th>
            <th className="px-4 py-3 font-medium">Approval Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium">Assigning</th>
            <th className="px-4 py-3 font-medium">Assigned Admin</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-slate-700">
          {/* LOADING STATE ROW SKELETONS */}
          {loading ? (
            <tr>
              <td
                className="px-4 py-6 text-center text-slate-400 text-sm"
                colSpan={8}
              >
                Loading…
              </td>
            </tr>
          ) : (
            submissions.map((sub) => (
              <tr
                key={sub._id}
                className={
                  sub.approvalStatus === "rejected"
                    ? "bg-red-50/40"
                    : sub.approvalStatus === "approved"
                    ? "bg-emerald-50/30"
                    : ""
                }
              >
                {/* STUDENT */}
                <td className="align-top px-4 py-4">
                  <div className="text-slate-900 font-medium">
                    {sub.student?.firstName || "Unknown"}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    {sub.student?.lastName || ""}
                  </div>
                </td>

                {/* SUBMISSION ID */}
                <td className="align-top px-4 py-4 text-slate-800">
                  <div className="font-mono text-[12px] text-slate-800 break-all">
                    {sub.submissionId || sub._id}
                  </div>
                </td>

                {/* PURPOSE */}
                <td className="align-top px-4 py-4 whitespace-nowrap">
                  <PurposeChip purpose={sub.purpose} />
                </td>

                {/* APPROVAL STATUS */}
                <td className="align-top px-4 py-4 whitespace-nowrap">
                  <StatusBadge status={sub.approvalStatus} />
                  {sub.rejectionReason && (
                    <div
                      className="text-[11px] text-red-600 mt-1 max-w-[180px] truncate"
                      title={sub.rejectionReason}
                    >
                      {sub.rejectionReason}
                    </div>
                  )}
                </td>

                {/* CREATED AT */}
                <td className="align-top px-4 py-4 text-slate-700 whitespace-nowrap">
                  <div className="text-[13px] font-medium text-slate-800">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    {formatAge(sub.createdAt)}
                  </div>
                </td>

                {/* ASSIGNING CONTROLS */}
                <td className="align-top px-4 py-4 text-slate-700">
                  {/* self assign */}
                  {!permsLoading &&
                    canSelfAssign &&
                    !sub.adminAssignee && (
                      <Button
                        size="sm"
                        onClick={() => selfAssign(sub._id)}
                        className="h-8 text-xs px-3 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                      >
                        Take
                      </Button>
                    )}

                  {/* assign to others */}
                  {!permsLoading && canAssignToOthers && (
                    <div className="mt-2">
                      <AssignAdminModal
                        entity="transcript"
                        entityId={sub._id}
                        currentAssignee={sub.adminAssignee}
                        onAssigned={onRefresh}
                      />
                    </div>
                  )}
                </td>

                {/* CURRENT ASSIGNEE */}
                <td className="align-top px-4 py-4 text-slate-700 whitespace-nowrap">
                  {sub.adminAssignee?.name ? (
                    <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 text-[11px] font-medium">
                      {sub.adminAssignee.name}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      Unassigned
                    </span>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="align-top px-4 py-4 text-right whitespace-nowrap">
                  <div className="flex flex-col items-end gap-2">
                    {/* View button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/admin/submissions/${sub._id}`)
                      }
                      className="h-8 text-xs px-3 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </Button>

                    {/* assign institution */}
                    <AssignInstitutionModal
                      submissionId={sub._id}
                      onAssigned={onRefresh}
                      assignedInstitution={sub.assignedInstitution}
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
