// src/pages/TranslationPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import useAdminPerms from "../hooks/useAdminPerms";
import AssignAdminModal from "../components/AssignAdminModal";
import {
  RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Search, Filter, Download, XCircle,
  ChevronLeft, ChevronRight
} from "lucide-react";

// --- tiny helpers for UI formatting ---

function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-300 px-2 py-0.5 text-[11px] font-medium capitalize">
        —
      </span>
    );
  }
  if (status === "new") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-medium capitalize">
        <Clock className="w-3 h-3 mr-1" />
        New
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[11px] font-medium capitalize">
        <Clock className="w-3 h-3 mr-1" />
        In progress
      </span>
    );
  }
  if (status === "delivered") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium capitalize">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Delivered
      </span>
    );
  }
  if (status === "problem") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[11px] font-medium capitalize">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Problem
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-300 px-2 py-0.5 text-[11px] font-medium capitalize">
      {status}
    </span>
  );
}

function LangChip({ from, to }) {
  if (!from && !to) {
    return (
      <span className="inline-block rounded-md bg-slate-100 text-slate-600 border border-slate-300 px-2 py-0.5 text-[11px] font-medium">
        —
      </span>
    );
  }
  return (
    <span className="inline-block rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
      {from || "?"} → {to || "?"}
    </span>
  );
}

function AssigneeChip({ name }) {
  if (!name) {
    return (
      <span className="text-[11px] text-slate-500 italic">
        Unassigned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 text-[11px] font-medium">
      {name}
    </span>
  );
}

function formatAge(iso) {
  if (!iso) return "";
  const createdMs = new Date(iso).getTime();
  const diffMs = Date.now() - createdMs;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

// --- main component ---

export default function TranslationPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  // who is logged in & what they can do
  const { me, canSelfAssign, canAssignToOthers } = useAdminPerms();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/admin/login", { replace: true });

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/translation-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Non-JSON response (${res.status}) ${text.slice(0, 80)}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      setRequests(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || "Failed to load translation requests");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const selfAssign = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/assignments/translation-requests/${id}/self-assign`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 409) {
        alert("Someone else already took this.");
        return fetchRequests();
      }

      if (!res.ok) {
        const maybeJSON = res.headers.get("content-type")?.includes("application/json");
        const body = maybeJSON ? await res.json() : await res.text();
        throw new Error((maybeJSON ? body?.message : body) || `HTTP ${res.status}`);
      }

      fetchRequests();
    } catch (e) {
      alert(e.message || "Could not self-assign.");
    }
  };

  // ---------- NEW FILTERS / PAGINATION STATE ----------
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL"); // ALL | new | in-progress | delivered | problem
  const [fromLang, setFromLang] = useState(""); // e.g., "French"
  const [toLang, setToLang] = useState("");     // e.g., "English"
  const [fromDate, setFromDate] = useState(""); // yyyy-mm-dd
  const [toDate, setToDate] = useState("");     // yyyy-mm-dd
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [myQueue, setMyQueue] = useState(false); // show only items assigned to me
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const getDate = (r) => {
    const raw = r?.createdAt || r?.submittedAt || r?.updatedAt;
    const d = raw ? new Date(raw) : null;
    return isNaN(d?.getTime?.()) ? null : d;
  };

  const matchesQuery = (r, q) => {
    if (!q) return true;
    const blob = [
      r?._id,
      r?.status,
      r?.student?.firstName, r?.student?.lastName,
      r?.sourceLanguage, r?.targetLanguage,
      r?.adminAssignee?.name,
    ].filter(Boolean).join(" ").toLowerCase();
    return blob.includes(q.toLowerCase());
  };

  // Derived: filtered list
  const filtered = useMemo(() => {
    let arr = requests;

    if (status !== "ALL") {
      arr = arr.filter((r) => (r?.status || "").toLowerCase() === status.toLowerCase());
    }
    if (fromLang.trim()) {
      arr = arr.filter((r) => (r?.sourceLanguage || "").toLowerCase() === fromLang.trim().toLowerCase());
    }
    if (toLang.trim()) {
      arr = arr.filter((r) => (r?.targetLanguage || "").toLowerCase() === toLang.trim().toLowerCase());
    }
    if (fromDate) {
      const from = new Date(fromDate + "T00:00:00");
      arr = arr.filter((r) => {
        const d = getDate(r);
        return d ? d >= from : true;
      });
    }
    if (toDate) {
      const to = new Date(toDate + "T23:59:59");
      arr = arr.filter((r) => {
        const d = getDate(r);
        return d ? d <= to : true;
      });
    }
    if (onlyUnassigned) {
      arr = arr.filter((r) => !r?.adminAssignee);
    }
    if (myQueue && me?.id) {
      arr = arr.filter((r) => r?.adminAssignee?._id === me.id || r?.adminAssignee?.id === me.id);
    }
    if (query.trim()) {
      arr = arr.filter((r) => matchesQuery(r, query.trim()));
    }

    return arr;
  }, [requests, status, fromLang, toLang, fromDate, toDate, onlyUnassigned, myQueue, query, me?.id]);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const paged = filtered.slice(startIdx, endIdx);

  // reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [query, status, fromLang, toLang, fromDate, toDate, onlyUnassigned, myQueue, pageSize]);

  const clearFilters = () => {
    setQuery("");
    setStatus("ALL");
    setFromLang("");
    setToLang("");
    setFromDate("");
    setToDate("");
    setOnlyUnassigned(false);
    setMyQueue(false);
    setPageSize(25);
    setPage(1);
  };

  const exportCSV = () => {
    const rows = filtered.map((r) => ({
      id: r?._id || "",
      status: r?.status || "",
      student: `${r?.student?.firstName || ""} ${r?.student?.lastName || ""}`.trim(),
      from: r?.sourceLanguage || "",
      to: r?.targetLanguage || "",
      assignee: r?.adminAssignee?.name || "",
      createdAt: getDate(r)?.toISOString() || "",
    }));
    const headers = Object.keys(rows[0] || { id:"", status:"", student:"", from:"", to:"", assignee:"", createdAt:"" });
    const csv = [
      headers.join(","),
      ...rows.map(row =>
        headers.map(h => {
          const v = (row[h] ?? "").toString().replace(/"/g, '""');
          return /[",\n]/.test(v) ? `"${v}"` : v;
        }).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dt = new Date();
    const stamp = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}_${String(dt.getHours()).padStart(2,"0")}${String(dt.getMinutes()).padStart(2,"0")}`;
    a.href = url;
    a.download = `translation_requests_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // PAGE-LEVEL LOADING STATE
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
        <div className="max-w-7xl mx-auto text-slate-600 text-sm">
          Loading translation requests…
        </div>
      </main>
    );
  }

  // PAGE-LEVEL ERROR STATE
  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <section className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Translation Requests
            </h1>
            <p className="text-slate-500 text-sm">
              Live queue of documents waiting for certified human translation.
              Assign, track, and deliver.
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Last updated: {lastUpdated.toLocaleString()}</div>
            <div>
              Showing{" "}
              <span className="text-slate-700 font-semibold">
                {total}
              </span>{" "}
              filtered request{total === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        {/* TOOLBAR CARD (Filters + Actions) */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="md:col-span-4">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Student, id, status, languages…"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            {/* Status */}
            <div className="md:col-span-3">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Status
              </label>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="ALL">All</option>
                  <option value="new">New</option>
                  <option value="in-progress">In progress</option>
                  <option value="delivered">Delivered</option>
                  <option value="problem">Problem</option>
                </select>
              </div>
            </div>

            {/* From Lang */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                From (source language)
              </label>
              <input
                value={fromLang}
                onChange={(e) => setFromLang(e.target.value)}
                placeholder="e.g., French"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* To Lang */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                To (target language)
              </label>
              <input
                value={toLang}
                onChange={(e) => setToLang(e.target.value)}
                placeholder="e.g., English"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* From Date */}
            <div className="md:col-span-1">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* To Date */}
            <div className="md:col-span-1">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Page size */}
            <div className="md:col-span-1">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Page
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}/pg</option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles + actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={onlyUnassigned}
                  onChange={(e) => setOnlyUnassigned(e.target.checked)}
                />
                Only Unassigned
              </label>

              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={myQueue}
                  onChange={(e) => setMyQueue(e.target.checked)}
                />
                My Queue
              </label>

              <div className="text-xs text-slate-500">
                {total > 0 ? (
                  <>
                    Showing{" "}
                    <span className="text-slate-700 font-semibold">{startIdx + 1}</span>
                    {"–"}
                    <span className="text-slate-700 font-semibold">{endIdx}</span> of{" "}
                    <span className="text-slate-700 font-semibold">{total}</span> filtered
                  </>
                ) : (
                  "No results for current filters"
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50"
              >
                <XCircle className="w-4 h-4" />
                Clear Filters
              </button>

              <button
                onClick={exportCSV}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>

              <Button
                onClick={fetchRequests}
                className="inline-flex items-center gap-2 h-8 text-xs px-3 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </section>

        {/* TABLE CARD */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          {paged.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 bg-white">
              <div className="text-slate-900 font-medium mb-1">
                No translation requests match your filters
              </div>
              <div className="text-[12px] text-slate-500">
                Try clearing filters or refreshing the queue.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px] text-left">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Request ID</th>
                    <th className="px-4 py-3 font-medium">Languages</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3 font-medium">Assignee</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paged.map((req) => (
                    <tr
                      key={req._id}
                      className={
                        req.status === "problem"
                          ? "bg-red-50/40"
                          : req.status === "delivered"
                          ? "bg-emerald-50/30"
                          : ""
                      }
                    >
                      {/* STUDENT */}
                      <td className="align-top px-4 py-4">
                        <div className="text-slate-900 font-medium">
                          {req.student?.firstName || "Unknown"}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight">
                          {req.student?.lastName || ""}
                        </div>
                      </td>

                      {/* ID */}
                      <td className="align-top px-4 py-4 text-slate-800">
                        <div className="font-mono text-[12px] text-slate-800 break-all">
                          {req.requestId}
                        </div>
                      </td>

                      {/* LANG PAIR */}
                      <td className="align-top px-4 py-4 whitespace-nowrap">
                        <LangChip from={req.sourceLanguage} to={req.targetLanguage} />
                      </td>

                      {/* STATUS */}
                      <td className="align-top px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                        {req.problemNote && req.status === "problem" && (
                          <div
                            className="text-[11px] text-red-600 mt-1 max-w-[200px] truncate"
                            title={req.problemNote}
                          >
                            {req.problemNote}
                          </div>
                        )}
                      </td>

                      {/* SUBMITTED */}
                      <td className="align-top px-4 py-4 text-slate-700 whitespace-nowrap">
                        <div className="text-[13px] font-medium text-slate-800">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight">
                          {formatAge(req.createdAt)}
                        </div>
                      </td>

                      {/* ASSIGNEE */}
                      <td className="align-top px-4 py-4 text-slate-700 whitespace-nowrap">
                        <AssigneeChip name={req.adminAssignee?.name} />
                      </td>

                      {/* ACTIONS */}
                      <td className="align-top px-4 py-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/translation-requests/${req._id}`)}
                            className="h-8 text-xs px-3 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </Button>

                          {canSelfAssign && !req.adminAssignee && (
                            <Button
                              size="sm"
                              onClick={() => selfAssign(req._id)}
                              className="h-8 text-xs px-3 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                            >
                              Take
                            </Button>
                          )}

                          {canAssignToOthers && (
                            <AssignAdminModal
                              entity="translation"
                              entityId={req._id}
                              currentAssignee={req.adminAssignee}
                              onAssigned={fetchRequests}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* PAGINATION */}
        <section className="flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-slate-600">
            Page <span className="font-semibold text-slate-800">{currentPage}</span> of{" "}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        {/* FOOTNOTE */}
        <section className="text-[11px] text-slate-500 leading-relaxed">
          “Problem” usually means missing pages, illegible scans, or mismatch
          between declared language and actual content. High volume of problem
          jobs from one school may indicate fraud or low scan quality.
        </section>
      </div>
    </main>
  );
}
