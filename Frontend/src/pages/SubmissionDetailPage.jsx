// src/pages/SubmissionDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { AssignInstitutionModal } from "../components/AssignInstitutionModal";
import {
  ArrowLeft, RefreshCw, Printer, Clipboard, FileText, Download,
  Building2, CheckCircle2, XCircle, Clock
} from "lucide-react";

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchDetail = async () => {
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/transcripts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return navigate("/admin/login", { replace: true });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setSub(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); /* eslint-disable-next-line */ }, [id]);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(sub?._id || id);
      alert("Submission ID copied.");
    } catch {
      alert("Could not copy ID.");
    }
  };

  const approve = async () => {
    if (!window.confirm("Approve this submission?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/transcripts/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return alert(`Approve failed (${res.status})`);
    fetchDetail();
  };

  const reject = async () => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/transcripts/${id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) return alert(`Reject failed (${res.status})`);
    fetchDetail();
  };

  const totalPages = useMemo(() => {
    if (!sub?.documents?.length) return 0;
    return sub.documents.reduce((sum, d) => sum + (Number(d.pageCount) || 0), 0);
  }, [sub]);

  const downloadAll = () => {
    // If you have a zip endpoint later, point here. For now, open each in a new tab.
    if (!sub?.documents?.length) return;
    sub.documents.forEach((d) => {
      const url = `/api/download/${sub._id}/${encodeURIComponent(d.filename)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  };

  // ---------- STATES ----------
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-6 animate-pulse text-slate-600">
            Loading submission…
          </div>
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {err}
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              ← Back
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!sub) return null;

  // ---------- BADGES ----------
  const Badge = ({ children, className = "" }) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>
      {children}
    </span>
  );

  const statusBadge = (label, tone) => {
    const tones = {
      green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      amber: "bg-amber-50 text-amber-700 border border-amber-200",
      red:   "bg-rose-50 text-rose-700 border border-rose-200",
      gray:  "bg-slate-100 text-slate-700 border border-slate-300",
      blue:  "bg-sky-50 text-sky-700 border border-sky-200",
    };
    return <Badge className={tones[tone] || tones.gray}>{label}</Badge>;
  };

  const approval = (sub.approvalStatus || "").toLowerCase();
  const finalS   = (sub.finalStatus || "").toLowerCase();
  const payment  = (sub.paymentStatus || "").toLowerCase();

  const approvalPill =
    approval === "approved" ? statusBadge("Approved", "green") :
    approval === "rejected" ? statusBadge("Rejected", "red") :
    approval === "inreview" ? statusBadge("In Review", "blue") :
    statusBadge("Pending", "amber");

  const finalPill =
    finalS === "completed" ? statusBadge("Completed", "green") :
    finalS === "canceled"  ? statusBadge("Canceled", "red") :
    finalS === "processing"? statusBadge("Processing", "blue") :
    statusBadge("Open", "gray");

  const paymentPill =
    payment === "paid"        ? statusBadge("Paid", "green") :
    payment === "refunded"    ? statusBadge("Refunded", "blue") :
    payment === "unpaid"      ? statusBadge("Unpaid", "amber") :
    payment === "failed"      ? statusBadge("Failed", "red") :
    statusBadge(sub.paymentStatus || "—", "gray");

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Link
                to="/admin/submissions"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Submissions
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchDetail}
                className="inline-flex items-center gap-2 h-8 text-xs"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 h-8 text-xs"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button
                variant="outline"
                onClick={copyId}
                className="inline-flex items-center gap-2 h-8 text-xs"
              >
                <Clipboard className="w-4 h-4" />
                Copy ID
              </Button>
            </div>
          </div>

          {/* Title row */}
          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Submission #{sub.submissionId || sub._id}
              </h1>
              <p className="text-xs text-slate-500">
                Created {new Date(sub.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Institution Approval: {approvalPill}
              --Progress Status: {finalPill}
              --Payment:{paymentPill}
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">Student</div>
            <div className="mt-1 text-slate-900 font-medium">
              {(sub.student?.firstName || "Unknown") + (sub.student?.lastName ? " " + sub.student.lastName : "")}
            </div>
            <div className="text-xs text-slate-500">{sub.student?.email || ""}</div>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">Method / Purpose</div>
            <div className="mt-1 text-slate-900 font-medium">
              {sub.submissionMethod || "—"}
            </div>
            <div className="text-xs text-slate-500 capitalize">{sub.purpose || "—"}</div>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">Institution</div>
            <div className="mt-1 flex items-center gap-2 text-slate-900 font-medium">
              <Building2 className="w-4 h-4 text-slate-400" />
              {sub.assignedInstitution?.name || "—"}
            </div>
            <div className="text-xs text-slate-500">
              {sub.assignedInstitution?.contactEmail || ""}
            </div>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">Documents</div>
            <div className="mt-1 text-slate-900 font-medium">
              {(sub.documents?.length || 0)} files
            </div>
            <div className="text-xs text-slate-500">{totalPages} pages total</div>
          </div>
        </section>

        {/* ACTIONS BAR */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600 leading-snug">
            <div className="font-medium text-slate-800">Review Actions</div>
            <div className="text-xs text-slate-500">
              Approvals are handled by assigned institutions. Use these controls to override in edge cases.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AssignInstitutionModal
              submissionId={sub._id}
              onAssigned={fetchDetail}
              assignedInstitution={sub.assignedInstitution}
            />

            <Button
              variant="outline"
              onClick={approve}
              className="inline-flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={reject}
              className="inline-flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
          </div>
        </section>

        {/* DOCUMENTS */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Documents
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={downloadAll}
                disabled={!sub.documents?.length}
                className="inline-flex items-center gap-2 h-8 text-xs"
              >
                <Download className="w-4 h-4" />
                Download all
              </Button>
            </div>
          </div>

          {!sub.documents?.length ? (
            <div className="p-8 text-center text-sm text-slate-500 bg-white">
              No documents uploaded for this submission.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px] text-left">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Filename</th>
                    <th className="px-4 py-3 font-medium">Pages</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className= "px-4 py-3 font-medium" > Needs Translation</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sub.documents.map((d, idx) => {
                    const url = `/api/download/${sub._id}/${encodeURIComponent(d.filename)}`;
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="text-slate-900 font-medium break-all">{d.filename}</div>
                          {d.note ? (
                            <div className="text-[11px] text-slate-500 mt-0.5">{d.note}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">{d.pageCount ?? "—"}</td>
                        <td className="px-4 py-3">{d.mimetype || "—"}</td>
                        <td className="px-4 py-3">{d.needsTranslation === true ? "Yes" :
                            d.needsTranslation === false ? "No" : "—"}</td>
                        <td className="px-4 py-3">
                          <a
                            className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">Total</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{totalPages}</td>
                    <td className="px-4 py-3" colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {/* OPTIONAL: ACTIVITY (if your API returns history array) */}
        {Array.isArray(sub.history) && sub.history.length > 0 && (
          <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
            <div className="text-sm font-medium text-slate-800 mb-3">Activity</div>
            <ul className="space-y-3">
              {sub.history.map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div className="text-sm">
                    <div className="text-slate-800">
                      {h.action || "Update"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {h.by ? `by ${h.by}` : ""} · {h.at ? new Date(h.at).toLocaleString() : ""}
                    </div>
                    {h.note && (
                      <div className="text-[12px] text-slate-600 mt-1">{h.note}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
