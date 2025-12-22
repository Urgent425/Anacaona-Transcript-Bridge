// src/components/SubmissionsTable.jsx
import React, { useMemo, useState } from "react";
import {
  FileText,
  Files,
  Receipt,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  Hash,
  BadgeCheck,
  Clock3,
} from "lucide-react";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function fmtDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  } catch {
    return "—";
  }
}

function Pill({ variant = "neutral", children }) {
  const styles =
    variant === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : variant === "warning"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : variant === "danger"
      ? "bg-red-50 text-red-700 border-red-200"
      : variant === "info"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        styles
      )}
    >
      {children}
    </span>
  );
}

/**
 * Supports both legacy shapes:
 * - s.files[] (older)
 * - s.documents[] (current)
 */
function getFiles(submission) {
  if (Array.isArray(submission?.documents)) return submission.documents;
  if (Array.isArray(submission?.files)) return submission.files;
  return [];
}

function totalPagesOf(files = []) {
  return files.reduce((sum, f) => sum + (Number(f.pageCount) || 1), 0);
}

function isPaidOf(s) {
  // tolerate multiple historical flags
  return (
    s?.paymentStatus === "paid" ||
    s?.status === "paid" ||
    !!s?.paid ||
    !!s?.locked
  );
}

function receiptUrlOf(s) {
  return s?.receiptUrl || s?.receiptURL || null;
}

export default function SubmissionsTable({ submissions = [], onDelete }) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | paid | pending
  const [expanded, setExpanded] = useState(() => new Set());

  const openReceipt = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const filtered = useMemo(() => {
    const list = Array.isArray(submissions) ? submissions : [];
    const query = q.trim().toLowerCase();

    return list.filter((s) => {
      const paid = isPaidOf(s);

      if (statusFilter === "paid" && !paid) return false;
      if (statusFilter === "pending" && paid) return false;

      if (!query) return true;

      const files = getFiles(s);
      const fileNames = files
        .map((f) => String(f?.filename || "").toLowerCase())
        .join(" ");

      const idText = String(s?.submissionId || s?._id || "").toLowerCase();

      const createdText = fmtDate(s?.createdAt).toLowerCase();

      return (
        fileNames.includes(query) ||
        idText.includes(query) ||
        createdText.includes(query)
      );
    });
  }, [submissions, q, statusFilter]);

  if (!filtered || filtered.length === 0) {
    return (
      <div className="mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Files className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              No submissions yet
            </div>
            <div className="text-sm text-slate-600 mt-1">
              When you submit an evaluation package, it will appear here with its
              payment status and receipt.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const toggleExpanded = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section className="mt-4 space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Pill variant="neutral">
            <Files className="w-3.5 h-3.5" />
            {filtered.length} submission{filtered.length === 1 ? "" : "s"}
          </Pill>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 shadow-sm px-3 py-2 w-full sm:w-[340px]">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by file name or ID…"
              className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Status filter */}
          <select
            className="rounded-xl bg-white border border-slate-200 shadow-sm px-3 py-2 text-sm text-slate-800"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending payment</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        <table className="min-w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs font-semibold text-slate-600">
              <th className="px-4 py-3">
                <div className="inline-flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  <span>Request ID</span>
                </div>
              </th>
              <th className="px-4 py-3">
                <div className="inline-flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Files</span>
                </div>
              </th>
              <th className="px-4 py-3">Pages</th>
              <th className="px-4 py-3">
                <div className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Submitted</span>
                </div>
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filtered.map((s) => {
              const files = getFiles(s);
              const totalPages = totalPagesOf(files);

              const paid = isPaidOf(s);
              const receiptUrl = receiptUrlOf(s);

              const canDelete = !s?.locked && !paid;
              const canReceipt = paid && !!receiptUrl;

              const key = String(s?.submissionId || s?._id);

              const firstNames = files
                .slice(0, 2)
                .map((f) => f?.filename)
                .filter(Boolean);

              const moreCount = Math.max(0, files.length - firstNames.length);

              return (
                <React.Fragment key={key}>
                  <tr className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {s?.submissionId || (s?.requestId ? s.requestId.slice(0) : "—")}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {files.length ? (
                        <div className="space-y-1">
                          <div className="text-sm text-slate-800">
                            {firstNames.join(", ")}
                            {moreCount > 0 ? (
                              <span className="text-slate-500">
                                {" "}
                                +{moreCount} more
                              </span>
                            ) : null}
                          </div>

                          {files.length > 2 && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(key)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                            >
                              {expanded.has(key) ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Hide list
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  View all files
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-800">
                      {totalPages || "—"}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700">
                      {fmtDate(s?.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      {paid ? (
                        <Pill variant="success">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          Paid
                        </Pill>
                      ) : (
                        <Pill variant="warning">
                          <Clock3 className="w-3.5 h-3.5" />
                          Pending payment
                        </Pill>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canReceipt && (
                          <button
                            type="button"
                            onClick={() => openReceipt(receiptUrl)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            title="Open Stripe receipt in a new tab"
                          >
                            <Receipt className="w-4 h-4" />
                            Receipt
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(s?._id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded file list */}
                  {expanded.has(key) && (
                    <tr className="bg-slate-50/60">
                      <td className="px-4 py-3" colSpan={6}>
                        <div className="rounded-xl bg-white border border-slate-200 p-4">
                          <div className="text-xs font-semibold text-slate-700">
                            Files in this submission
                          </div>
                          <ul className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-2">
                            {files.map((f, idx) => (
                              <li
                                key={`${key}-${f?.filename || idx}`}
                                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-slate-900">
                                    {f?.filename || "—"}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {Number(f?.pageCount) || 1} page(s)
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((s) => {
          const files = getFiles(s);
          const totalPages = totalPagesOf(files);
          const paid = isPaidOf(s);
          const receiptUrl = receiptUrlOf(s);

          const canDelete = !s?.locked && !paid;
          const canReceipt = paid && !!receiptUrl;

          const key = String(s?.submissionId || s?._id);

          return (
            <div
              key={key}
              className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    Submission #{s?.submissionId || (s?._id ? s._id.slice(-8) : "—")}
                  </div>
                  <div className="text-xs text-slate-500">
                    Submitted: {fmtDate(s?.createdAt)}
                  </div>
                </div>
                {paid ? (
                  <Pill variant="success">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Paid
                  </Pill>
                ) : (
                  <Pill variant="warning">
                    <Clock3 className="w-3.5 h-3.5" />
                    Pending
                  </Pill>
                )}
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Files</span>
                  <span className="font-semibold text-slate-900">{files.length}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                  <span>Pages</span>
                  <span className="font-semibold text-slate-900">{totalPages || "—"}</span>
                </div>

                {files.length > 0 && (
                  <div className="mt-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">First:</span>{" "}
                    <span className="text-slate-700">{files[0]?.filename || "—"}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                {canReceipt && (
                  <button
                    type="button"
                    onClick={() => openReceipt(receiptUrl)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Receipt className="w-4 h-4" />
                    Receipt
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(s?._id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
