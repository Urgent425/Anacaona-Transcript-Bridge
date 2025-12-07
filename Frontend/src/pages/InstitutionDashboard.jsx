// src/pages/InstitutionDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CheckCircle2, XCircle, Eye, FileCheck } from "lucide-react";
// eslint-disable-next-line
import { API_BASE } from "../lib/apiBase";

/* ---------- Small helper components ---------- */

function Info({ label, value, mono = false }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500">{label}</div>
      <div
        className={`truncate text-sm text-white ${
          mono ? "font-mono" : "font-medium"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------- Reject dialog (modal) ---------- */
function RejectDialog({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/90 border border-white/10 text-white shadow-[0_30px_120px_-10px_rgba(0,0,0,0.9)] p-5">
        <h3 className="text-lg font-semibold text-white mb-2">
          Reject submission
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Please explain briefly why this request is being rejected. The note
          may be visible to the student.
        </p>

        <textarea
          className="w-full rounded-lg bg-slate-800/60 border border-white/10 text-white text-sm px-3 py-2.5 outline-none placeholder-slate-500 focus:ring-2 focus:ring-red-400/30 focus:border-red-400/30"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Missing stamp from registrar..."
        />

        <div className="mt-4 flex justify-end gap-2 text-sm">
          <button
            className="px-4 py-2 rounded-lg border border-white/20 text-slate-200 hover:bg-white/10 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={!reason.trim()}
            onClick={() => onSubmit(reason.trim())}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Upload official transcript block ---------- */
function OfficialUploader({ submissionId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const token = localStorage.getItem("token");

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(
        `${API_BASE}/api/institution/submissions/${submissionId}/official-upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }
      );

      const text = await res.text();
      if (!res.ok) {
        let msg = text;
        try {
          msg = JSON.parse(text).message || msg;
        } catch {}
        throw new Error(msg || "Upload failed");
      }

      setFile(null);
      onUploaded?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl bg-slate-800/60 border border-white/10 p-4 text-white text-sm">
      <div className="font-medium text-white flex items-center gap-2">
        <FileCheck className="w-4 h-4 text-emerald-400" />
        <span>Upload Official Transcript (PDF)</span>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-xs text-slate-300 mt-3
          file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-slate-200
          hover:file:bg-slate-600 file:cursor-pointer"
      />

      <button
        onClick={submit}
        disabled={!file || busy}
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-medium px-4 py-2 border border-white/10 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}

/* ---------- Official file list ---------- */
function OfficialList({ submissionId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/institution/submissions/${submissionId}/officials`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  if (loading)
    return (
      <div className="text-xs text-slate-500 mt-1">Loading official files…</div>
    );
  if (!items.length)
    return (
      <div className="text-xs text-slate-500 mt-1">
        No official files uploaded yet.
      </div>
    );

  return (
    <ul className="mt-2 space-y-2 text-xs text-slate-300">
      {items.map((f, i) => (
        <li
          key={i}
          className="flex items-center justify-between rounded-lg bg-slate-800/50 border border-white/10 px-3 py-2"
        >
          <span className="truncate" title={f.filename}>
            {f.filename}{" "}
            {f.size ? `(${Math.round(f.size / 1024)} KB)` : ""}
          </span>
          <a
            className="underline text-amber-300 hover:text-amber-200 transition-colors"
            href={`${API_BASE}/api/institution/submissions/${submissionId}/officials/${i}/download`}
            target="_blank"
            rel="noreferrer"
          >
            Download
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Right-side drawer for details ---------- */
function DetailsDrawer({ open, onClose, submissionId }) {
  const [loading, setLoading] = useState(false);
  const [sub, setSub] = useState(null);

  const loadDetails = async () => {
    if (!open || !submissionId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/institution/submissions/${submissionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to load details");
      setSub(await res.json());
    } catch (e) {
      console.error(e);
      setSub(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submissionId]);

  return (
    <div
      className={`fixed inset-y-0 right-0 z-[90] w-full max-w-xl transform transition-transform ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* backdrop click area */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm ${
          open ? "block" : "hidden"
        }`}
        onClick={onClose}
      />

      {/* drawer panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-slate-900/95 border-l border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.9)] text-white flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          <h3 className="text-white font-semibold text-lg">
            Submission Details
          </h3>
          <button
            className="px-3 py-1.5 rounded-lg border border-white/20 text-slate-200 hover:bg-white/10 text-xs"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 text-sm">
          {loading ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : sub ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Info
                  label="Submission ID"
                  value={sub._id}
                  mono
                />
                <Info
                  label="Status"
                  value={sub.approvalStatus || "—"}
                />
                <Info
                  label="Student"
                  value={
                    `${sub.student?.firstName || ""} ${
                      sub.student?.lastName || ""
                    }`.trim() || "—"
                  }
                />
                <Info
                  label="Email"
                  value={sub.student?.email || "—"}
                />
                <Info
                  label="Purpose"
                  value={sub.purpose || "—"}
                />
                <Info
                  label="Created"
                  value={
                    sub.createdAt
                      ? new Date(sub.createdAt).toLocaleString()
                      : "—"
                  }
                />
              </div>

              <div>
                <div className="text-white font-medium text-sm">
                  Documents
                </div>
                <div className="mt-3 space-y-2">
                  {(sub.documents || []).map((d) => (
                    <div
                      key={d._id || d.filename}
                      className="rounded-lg bg-slate-800/60 border border-white/10 px-3 py-2 flex items-start justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white text-sm">
                          {d.filename}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {d.mimetype || "file"} •{" "}
                          {d.pageCount
                            ? `${d.pageCount} page${
                                d.pageCount === 1 ? "" : "s"
                              }`
                            : "pages: —"}
                        </div>
                      </div>
                      <a
                        className="text-amber-300 underline text-xs ml-3 hover:text-amber-200 transition-colors"
                        href={`${API_BASE}/api/download/${sub._id}/${encodeURIComponent(
                          d.filename
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-white font-medium text-sm">
                  Official Files
                </div>
                <OfficialList submissionId={sub._id} />
              </div>

              {sub.approvalStatus === "approved" && (
                <OfficialUploader
                  submissionId={sub._id}
                  onUploaded={loadDetails}
                />
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No data.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Institution Dashboard ---------- */
export default function InstitutionDashboard() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("pending"); // pending | approved | rejected
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [toRejectId, setToRejectId] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState(null);

  const pages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const fetchSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const qs = new URLSearchParams({
        status: tab,
        q: q || "",
        page: String(page),
        pageSize: String(pageSize),
      }).toString();

      const res = await fetch(
        `${API_BASE}/api/institution/submissions?${qs}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401) {
        return navigate("/login", { replace: true });
      }
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const payload = await res.json();
      if (Array.isArray(payload)) {
        setSubmissions(payload);
        setTotal(payload.length);
      } else {
        setSubmissions(payload.items || []);
        setTotal(payload.total || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/institution/submissions/${id}/approve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error(`Approve failed (${res.status})`);
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      alert("Could not approve submission.");
    }
  };

  const openReject = (id) => {
    setToRejectId(id);
    setRejectOpen(true);
  };

  const submitReject = async (reason) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/institution/submissions/${toRejectId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );
      if (!res.ok) throw new Error(`Reject failed (${res.status})`);
      setRejectOpen(false);
      setToRejectId(null);
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      alert("Could not reject submission.");
    }
  };

  const openDetails = (id) => {
    setDetailsId(id);
    setDetailsOpen(true);
  };

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, pageSize]);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <section className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Institution Dashboard
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Review, approve, or reject transcript submissions assigned to your
            institution. Upload official, signed copies when ready.
          </p>
        </section>

        {/* FILTER BAR / TABS / SEARCH */}
        <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Tab group */}
          <div className="inline-flex rounded-xl bg-slate-800/60 border border-white/10 p-1 backdrop-blur self-start">
            {["pending", "approved", "rejected"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setPage(1);
                }}
                className={`px-4 py-2.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  tab === t
                    ? "bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 text-slate-900 shadow-[0_8px_20px_-5px_rgba(251,191,36,0.4)]"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {t === "pending" && "Pending review"}
                {t === "approved" && "Approved"}
                {t === "rejected" && "Rejected"}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl p-3 w-full md:w-auto md:min-w-[320px] flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              className="bg-transparent text-sm text-white placeholder-slate-500 w-full outline-none"
              placeholder="Search student or submission ID…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => e.key === "Enter" && fetchSubmissions()}
            />
            <button
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-white/20 text-slate-200 hover:bg-white/10 transition-colors shrink-0"
              onClick={fetchSubmissions}
            >
              Search
            </button>
          </div>
        </section>

        {/* TABLE CARD */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_30px_120px_-10px_rgba(251,191,36,0.15)] overflow-hidden">
          {/* table header / loading / empty / error states */}
          {loading ? (
            <div className="p-6 text-slate-400 text-sm">Loading…</div>
          ) : error ? (
            <div className="p-6 text-red-400 text-sm">
              Error: {error}
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-6 text-slate-400 text-sm">
              No submissions found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-white/10 text-slate-300 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Purpose</th>
                      <th className="px-4 py-3 font-medium">Documents</th>
                      <th className="px-4 py-3 font-medium text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {submissions.map((s) => (
                      <tr key={s._id} className="text-slate-200">
                        {/* Short ID */}
                        <td className="align-top px-4 py-3 font-mono text-xs text-slate-400">
                          {s._id.slice(-8)}
                        </td>

                        {/* Student info */}
                        <td className="align-top px-4 py-3">
                          <div className="text-white text-sm font-medium">
                            {`${s.student?.firstName || ""} ${
                              s.student?.lastName || ""
                            }`.trim() || "Unknown Student"}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {s.student?.email || "—"}
                          </div>
                        </td>

                        {/* Purpose */}
                        <td className="align-top px-4 py-3 capitalize text-sm text-slate-300">
                          {s.purpose || "—"}
                        </td>

                        {/* Docs */}
                        <td className="align-top px-4 py-3">
                          <div className="space-y-1">
                            {(s.documents || []).map((d) => (
                              <a
                                key={`${s._id}-${d.filename}`}
                                href={`/api/download/${s._id}/${encodeURIComponent(
                                  d.filename
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-amber-300 text-xs underline truncate hover:text-amber-200 transition-colors"
                                title={d.filename}
                              >
                                {d.filename}{" "}
                                {d.pageCount
                                  ? `(${d.pageCount} page${
                                      d.pageCount === 1 ? "" : "s"
                                    })`
                                  : ""}
                              </a>
                            ))}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="align-top px-4 py-3 text-center whitespace-nowrap text-xs">
                          <div className="flex flex-col items-center gap-2">
                            {/* View button */}
                            <button
                              onClick={() => openDetails(s._id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>

                            {/* Approve / Reject row */}
                            {tab === "pending" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(s._id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => openReject(s._id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : tab === "rejected" && s.rejectionReason ? (
                              <span
                                className="text-[11px] text-slate-500 max-w-[180px] block"
                                title={s.rejectionReason}
                              >
                                Reason: {s.rejectionReason}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-white/10 bg-slate-900/40 px-4 py-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">Rows per page</span>
                  <select
                    className="bg-slate-800/60 border border-white/10 rounded-lg px-2 py-1 text-slate-200"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {[10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-center md:text-left">
                  Page {page} of {pages} — {total} total
                </div>

                <div className="flex items-center justify-center md:justify-end gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg border border-white/20 text-slate-200 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-white/20 text-slate-200 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={page === pages}
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Modals / drawers */}
      <RejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={submitReject}
      />

      <DetailsDrawer
        open={detailsOpen}
        submissionId={detailsId}
        onClose={() => setDetailsOpen(false)}
      />
    </main>
  );
}
