// src/pages/InstitutionDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  FileCheck,
  RefreshCcw,
  AlertTriangle,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";
// eslint-disable-next-line
import { API_BASE } from "../lib/apiBase";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

/**
 * LIGHT theme pill variants
 * (keeps same semantics as your dark version, just inverted)
 */
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

function IconBadge({ icon: Icon, variant = "neutral", label }) {
  return (
    <Pill variant={variant}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </Pill>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 w-full">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-72 bg-slate-100 rounded" />
          <div className="h-3 w-52 bg-slate-100 rounded" />
        </div>
        <div className="h-8 w-24 bg-slate-200 rounded-lg" />
      </div>
      <div className="mt-4 h-20 bg-slate-100 rounded-xl" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Reject dialog (light)
───────────────────────────────────────────────────────────── */
function RejectDialog({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-[0_30px_120px_-20px_rgba(15,23,42,0.35)] p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Reject submission
        </h3>
        <p className="text-slate-600 text-sm mb-4">
          Please explain briefly why this request is being rejected. The note may
          be visible to the student.
        </p>

        <textarea
          className="w-full rounded-lg bg-white border border-slate-200 text-slate-900 text-sm px-3 py-2.5 outline-none placeholder-slate-400 focus:ring-2 focus:ring-red-200 focus:border-red-300"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Missing stamp from registrar..."
        />

        <div className="mt-4 flex justify-end gap-2 text-sm">
          <button
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
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

/* ─────────────────────────────────────────────────────────────
   Official uploader (light)
───────────────────────────────────────────────────────────── */
function OfficialUploader({ submissionMongoId, onUploaded }) {
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
        `${API_BASE}/api/institution/submissions/${submissionMongoId}/official-upload`,
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
    <div className="rounded-xl bg-white border border-slate-200 p-4 text-sm shadow-sm">
      <div className="font-medium text-slate-900 flex items-center gap-2">
        <FileCheck className="w-4 h-4 text-emerald-600" />
        <span>Upload Official Transcript (PDF)</span>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-xs text-slate-600 mt-3
          file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-700
          hover:file:bg-slate-200 file:cursor-pointer"
      />

      <button
        onClick={submit}
        disabled={!file || busy}
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-semibold px-4 py-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? "Uploading…" : "Upload"}
      </button>

      <p className="text-[11px] text-slate-500 mt-2">
        Only approved submissions can accept official uploads.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Official list (light)
───────────────────────────────────────────────────────────── */
function OfficialList({ submissionMongoId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/institution/submissions/${submissionMongoId}/officials`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [submissionMongoId]);

  if (loading) return <div className="text-xs text-slate-500 mt-1">Loading official files…</div>;
  if (!items.length) return <div className="text-xs text-slate-500 mt-1">No official files uploaded yet.</div>;

  return (
    <ul className="mt-2 space-y-2 text-xs text-slate-700">
      {items.map((f, i) => (
        <li
          key={`${f.filename}-${i}`}
          className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2"
        >
          <span className="truncate" title={f.filename}>
            {f.filename} {f.size ? `(${Math.round(f.size / 1024)} KB)` : ""}
          </span>
          <a
            className="underline text-blue-700 hover:text-blue-800 transition-colors"
            href={`${API_BASE}/api/institution/submissions/${submissionMongoId}/officials/${i}/download`}
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

/* ─────────────────────────────────────────────────────────────
   Details drawer (light)
───────────────────────────────────────────────────────────── */
function Info({ label, value, mono = false }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={cx("truncate text-sm text-slate-900", mono ? "font-mono" : "font-medium")}>
        {value}
      </div>
    </div>
  );
}

function DetailsDrawer({ open, onClose, submissionMongoId, onDidUpdate }) {
  const [loading, setLoading] = useState(false);
  const [sub, setSub] = useState(null);

  const loadDetails = async () => {
    if (!open || !submissionMongoId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/institution/submissions/${submissionMongoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
  }, [open, submissionMongoId]);

  const approvalStatus = sub?.approvalStatus || "—";
  const created = sub?.createdAt ? new Date(sub.createdAt).toLocaleString() : "—";
  const studentName =
    `${sub?.student?.firstName || ""} ${sub?.student?.lastName || ""}`.trim() || "—";

  return (
    <div
      className={cx(
        "fixed inset-y-0 right-0 z-[90] w-full max-w-xl transform transition-transform",
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Backdrop */}
      <div
        className={cx("fixed inset-0 bg-black/30 backdrop-blur-sm", open ? "block" : "hidden")}
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white border-l border-slate-200 shadow-[0_40px_120px_rgba(15,23,42,0.25)] text-slate-900 flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200">
          <div className="min-w-0">
            <div className="font-semibold text-lg truncate">
              Submission {sub?.submissionId ? `#${sub.submissionId}` : "Details"}
            </div>
            <div className="text-[11px] text-slate-500">
              {loading ? "Loading…" : `Status: ${approvalStatus}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
              onClick={async () => {
                await loadDetails();
                onDidUpdate?.();
              }}
            >
              Refresh
            </button>
            <button
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 text-sm">
          {loading ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : sub ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Info label="Submission ID" value={sub.submissionId || sub._id} mono />
                <Info label="Approval Status" value={approvalStatus} />
                <Info label="Student" value={studentName} />
                <Info label="Email" value={sub?.student?.email || "—"} />
                <Info label="Purpose" value={sub?.purpose || "—"} />
                <Info label="Created" value={created} />
              </div>

              <div>
                <div className="font-medium text-sm">Documents</div>
                <div className="mt-3 space-y-2">
                  {(sub.documents || []).map((d) => (
                    <div
                      key={d._id || d.filename}
                      className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex items-start justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900 text-sm">{d.filename}</div>
                        <div className="text-slate-500 text-[11px]">
                          {d.mimetype || "file"} •{" "}
                          {d.pageCount ? `${d.pageCount} page${d.pageCount === 1 ? "" : "s"}` : "pages: —"}
                        </div>
                      </div>

                      <a
                        className="text-blue-700 underline text-xs ml-3 hover:text-blue-800 transition-colors"
                        href={`${API_BASE}/api/download/${sub._id}/${encodeURIComponent(d.filename)}`}
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
                <div className="font-medium text-sm">Official Files</div>
                <OfficialList submissionMongoId={sub._id} />
              </div>

              {sub.approvalStatus === "approved" && (
                <OfficialUploader
                  submissionMongoId={sub._id}
                  onUploaded={async () => {
                    await loadDetails();
                    onDidUpdate?.();
                  }}
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

/* ─────────────────────────────────────────────────────────────
   Workflow status derivation (same logic, light labels)
───────────────────────────────────────────────────────────── */
function deriveInstitutionWorkflowStatus(s) {
  const approval = (s?.approvalStatus || "").toLowerCase();

  const uploadsCount = Number(s?.officialUploadsCount || 0);
  const latestOfficialStatus = s?.latestOfficialStatus || null;
  const hasOfficial = uploadsCount > 0;

  if (approval === "rejected") {
    return {
      stage: "rejected",
      badge: { variant: "danger", label: "Rejected", icon: XCircle },
      actionRequired: false,
      hint: "No action required.",
      stepIndex: 0,
    };
  }

  if (approval === "pending") {
    return {
      stage: "pending_review",
      badge: { variant: "warning", label: "Pending review", icon: AlertTriangle },
      actionRequired: true,
      hint: "Approve or reject this submission.",
      stepIndex: 0,
    };
  }

  if (approval === "approved") {
    if (hasOfficial) {
      if (latestOfficialStatus === "infected") {
        return {
          stage: "infected",
          badge: { variant: "danger", label: "Scan failed", icon: ShieldAlert },
          actionRequired: true,
          hint: "Official file flagged. Please re-upload a clean PDF.",
          stepIndex: 2,
        };
      }
      if (latestOfficialStatus === "pending_scan") {
        return {
          stage: "scanning",
          badge: { variant: "info", label: "Scanning", icon: RefreshCcw },
          actionRequired: false,
          hint: "Awaiting scan/verification.",
          stepIndex: 2,
        };
      }
      if (latestOfficialStatus === "clean") {
        return {
          stage: "clean",
          badge: { variant: "success", label: "Verified (clean)", icon: BadgeCheck },
          actionRequired: false,
          hint: "Official file verified.",
          stepIndex: 3,
        };
      }

      return {
        stage: "official_uploaded",
        badge: { variant: "info", label: "Official uploaded", icon: FileCheck },
        actionRequired: false,
        hint: "Official file uploaded.",
        stepIndex: 2,
      };
    }

    return {
      stage: "approved",
      badge: { variant: "success", label: "Approved", icon: CheckCircle2 },
      actionRequired: true,
      hint: "Upload official transcript PDF (in details).",
      stepIndex: 1,
    };
  }

  return {
    stage: "unknown",
    badge: { variant: "neutral", label: "Unknown", icon: Eye },
    actionRequired: false,
    hint: "—",
    stepIndex: 0,
  };
}

function ProgressStepper({ stepIndex = 0 }) {
  const steps = [{ label: "Review" }, { label: "Approved" }, { label: "Official Upload" }, { label: "Verified" }];

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 flex-wrap">
        {steps.map((s, idx) => {
          const on = idx <= stepIndex;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className={cx(
                  "h-2.5 w-2.5 rounded-full border",
                  on ? "bg-amber-400 border-amber-400" : "bg-white border-slate-200"
                )}
                aria-hidden="true"
              />
              <span className={cx("text-xs", on ? "text-slate-900 font-medium" : "text-slate-500")}>
                {s.label}
              </span>
              {idx < steps.length - 1 && (
                <div className={cx("h-px w-10", on ? "bg-amber-300" : "bg-slate-200")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Institution Dashboard (LIGHT THEME)
───────────────────────────────────────────────────────────── */
export default function InstitutionDashboard() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [toRejectId, setToRejectId] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchSubmissions = async ({ soft = false } = {}) => {
    if (soft) setRefreshing(true);
    else setLoading(true);

    setError("");
    try {
      const token = localStorage.getItem("token");
      const qs = new URLSearchParams({
        status: tab,
        q: q || "",
        page: String(page),
        pageSize: String(pageSize),
      }).toString();

      const res = await fetch(`${API_BASE}/api/institution/submissions?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) return navigate("/login", { replace: true });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const payload = await res.json();
      setSubmissions(payload.items || []);
      setTotal(payload.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load submissions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [tab, page, pageSize]);

  const stats = useMemo(() => {
    const pending = submissions.filter((s) => s.approvalStatus === "pending").length;
    const approved = submissions.filter((s) => s.approvalStatus === "approved").length;
    const rejected = submissions.filter((s) => s.approvalStatus === "rejected").length;
    const actionRequired = submissions.filter((s) => deriveInstitutionWorkflowStatus(s).actionRequired).length;
    return { pending, approved, rejected, actionRequired };
  }, [submissions]);

  const handleApprove = async (mongoId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/institution/submissions/${mongoId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Approve failed (${res.status})`);
      await fetchSubmissions({ soft: true });
    } catch (err) {
      console.error(err);
      alert("Could not approve submission.");
    }
  };

  const openReject = (mongoId) => {
    setToRejectId(mongoId);
    setRejectOpen(true);
  };

  const submitReject = async (reason) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/institution/submissions/${toRejectId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error(`Reject failed (${res.status})`);
      setRejectOpen(false);
      setToRejectId(null);
      await fetchSubmissions({ soft: true });
    } catch (err) {
      console.error(err);
      alert("Could not reject submission.");
    }
  };

  const openDetails = (mongoId) => {
    setDetailsId(mongoId);
    setDetailsOpen(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <section className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Institution Dashboard
          </h2>
          <p className="text-slate-600 text-sm max-w-2xl">
            Review, approve, or reject transcript submissions assigned to your institution.
            After approval, upload official signed copies (PDF).
          </p>
        </section>

        {/* Summary strip */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="On this page" value={submissions.length} hint="Loaded results (page scope)" />
          <StatCard label="Awaiting action" value={stats.actionRequired} hint="Approve/reject or upload official" />
          <StatCard label="Pending" value={stats.pending} hint="Needs review" />
          <StatCard label="Approved" value={stats.approved} hint="Ready for official upload" />
        </section>

        {/* FILTER BAR */}
        <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Tabs */}
          <div className="inline-flex rounded-xl bg-white border border-slate-200 p-1 shadow-sm self-start">
            {["pending", "approved", "rejected"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setPage(1);
                }}
                className={cx(
                  "px-4 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all",
                  tab === t
                    ? "bg-amber-100 text-amber-900 border border-amber-200 shadow-sm"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {t === "pending" && "Pending review"}
                {t === "approved" && "Approved"}
                {t === "rejected" && "Rejected"}
              </button>
            ))}
          </div>

          {/* Search + Refresh */}
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-3 w-full md:min-w-[380px] flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                className="bg-transparent text-sm text-slate-900 placeholder-slate-400 w-full outline-none"
                placeholder="Search by student name, email, or submissionId…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                onKeyDown={(e) => e.key === "Enter" && fetchSubmissions({ soft: true })}
              />
              <button
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                onClick={() => fetchSubmissions({ soft: true })}
              >
                Search
              </button>
            </div>

            <button
              className={cx(
                "inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm",
                refreshing ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50"
              )}
              onClick={() => fetchSubmissions({ soft: true })}
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCcw className={cx("w-4 h-4", refreshing ? "animate-spin" : "")} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </section>

        {/* Content */}
        {loading ? (
          <section className="grid grid-cols-1 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </section>
        ) : error ? (
          <section className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-800">
            <div className="font-semibold">Error</div>
            <div className="text-sm mt-1">{error}</div>
          </section>
        ) : submissions.length === 0 ? (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center">
            <div className="text-lg font-semibold text-slate-900">No submissions found</div>
            <p className="text-sm text-slate-600 mt-2">
              Try adjusting the status tab or your search terms.
            </p>
          </section>
        ) : (
          <>
            {/* Cards */}
            <section className="grid grid-cols-1 gap-4">
              {submissions.map((s) => {
                const wf = deriveInstitutionWorkflowStatus(s);
                const BadgeIcon = wf.badge.icon;

                const studentName =
                  `${s.student?.firstName || ""} ${s.student?.lastName || ""}`.trim() ||
                  "Unknown Student";

                const docCount = Array.isArray(s.documents) ? s.documents.length : 0;
                const totalPages = (s.documents || []).reduce(
                  (sum, d) => sum + (Number(d.pageCount) || 0),
                  0
                );

                return (
                  <div
                    key={s._id}
                    className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5"
                  >
                    {/* Top row */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-lg font-semibold text-slate-900 truncate">
                            Submission #{s.submissionId || s._id?.slice(-8)}
                          </div>

                          <IconBadge icon={BadgeIcon} variant={wf.badge.variant} label={wf.badge.label} />

                          {wf.actionRequired && (
                            <Pill variant="warning">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Action required
                            </Pill>
                          )}

                          <Pill variant="neutral">
                            <span className="uppercase tracking-wide text-[10px] text-slate-700">
                              {s.purpose || "—"}
                            </span>
                          </Pill>
                        </div>

                        <div className="mt-1 text-xs text-slate-600">
                          Student:{" "}
                          <span className="text-slate-900 font-semibold">{studentName}</span>{" "}
                          <span className="text-slate-400">•</span>{" "}
                          <span className="text-slate-700">{s.student?.email || "—"}</span>
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Created: {formatDateTime(s.createdAt)}
                        </div>

                        <ProgressStepper stepIndex={wf.stepIndex} />

                        <div className="mt-3 text-xs text-slate-600">{wf.hint}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <button
                          onClick={() => openDetails(s._id)}
                          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-semibold"
                        >
                          <Eye className="w-4 h-4" />
                          View details
                        </button>

                        {tab === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(s._id)}
                              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-semibold"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => openReject(s._id)}
                              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-xs font-semibold"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom strip */}
                    <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Pill variant="info">
                            <FileCheck className="w-3.5 h-3.5" />
                            {docCount} document{docCount === 1 ? "" : "s"}
                          </Pill>

                          <Pill variant="neutral">
                            Pages:{" "}
                            <span className="text-slate-900 font-semibold">{totalPages || "—"}</span>
                          </Pill>

                          {typeof s.officialUploadsCount === "number" && (
                            <Pill variant={s.officialUploadsCount > 0 ? "success" : "warning"}>
                              Official uploads:{" "}
                              <span className="text-slate-900 font-semibold">{s.officialUploadsCount}</span>
                            </Pill>
                          )}

                          {s.latestOfficialStatus && (
                            <Pill
                              variant={
                                s.latestOfficialStatus === "clean"
                                  ? "success"
                                  : s.latestOfficialStatus === "infected"
                                  ? "danger"
                                  : "info"
                              }
                            >
                              Scan:{" "}
                              <span className="text-slate-900 font-semibold">{s.latestOfficialStatus}</span>
                            </Pill>
                          )}
                        </div>

                        {tab === "rejected" && s.rejectionReason ? (
                          <div
                            className="text-xs text-slate-600 max-w-2xl truncate"
                            title={s.rejectionReason}
                          >
                            Reason: {s.rejectionReason}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">
                            Tip: Upload official PDF after approval (in details).
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Pagination */}
            <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-medium">Rows per page</span>
                <select
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
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
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page === pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                >
                  Next
                </button>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Modals / drawers */}
      <RejectDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onSubmit={submitReject} />

      <DetailsDrawer
        open={detailsOpen}
        submissionMongoId={detailsId}
        onClose={() => setDetailsOpen(false)}
        onDidUpdate={() => fetchSubmissions({ soft: true })}
      />
    </main>
  );
}
