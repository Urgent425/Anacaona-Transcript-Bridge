// src/pages/SubmissionsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSubmissionsTable from "../components/AdminSubmissionsTable";
import {
  RefreshCw,
  Search,
  Download,
  Filter,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  // --- New UI state ---
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL"); // ALL | Pending | Approved | Rejected | InReview | NeedsTranslation
  const [fromDate, setFromDate] = useState(""); // yyyy-mm-dd
  const [toDate, setToDate] = useState("");     // yyyy-mm-dd
  const [pageSize, setPageSize] = useState(25); // 10/25/50/100
  const [page, setPage] = useState(1);          // 1-indexed

  // Fetch all transcript submissions for admin
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setErr("");

      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/transcripts`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        return navigate("/admin/login", { replace: true });
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch submissions: ${res.statusText}`);
      }

      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
      setErr("Unable to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    
  }, [navigate]);

  // Helpers to read fields safely
  const getSubmittedAt = (row) => {
    const raw = row?.submittedAt || row?.createdAt || row?.updatedAt;
    const d = raw ? new Date(raw) : null;
    return isNaN(d?.getTime?.()) ? null : d;
  };
  const getStatus = (row) =>
    (row?.status || row?.reviewStatus || "").toString();

  const matchesQuery = (row, q) => {
    if (!q) return true;
    const blob = [
      row?._id,
      getStatus(row),
      row?.studentName || `${row?.student?.firstName || ""} ${row?.student?.lastName || ""}`,
      row?.institutionName || row?.institution?.name,
      row?.purpose,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return blob.includes(q.toLowerCase());
  };

  // Derived + filtered data
  const filtered = useMemo(() => {
    let arr = submissions;

    // Status filter (defensive: map a few common variants)
    if (status !== "ALL") {
      const normalized = status.toLowerCase();
      arr = arr.filter((r) => getStatus(r).toLowerCase() === normalized);
    }

    // Date range
    if (fromDate) {
      const from = new Date(fromDate + "T00:00:00");
      arr = arr.filter((r) => {
        const d = getSubmittedAt(r);
        return d ? d >= from : true;
      });
    }
    if (toDate) {
      const to = new Date(toDate + "T23:59:59");
      arr = arr.filter((r) => {
        const d = getSubmittedAt(r);
        return d ? d <= to : true;
      });
    }

    // Query
    if (query.trim()) {
      arr = arr.filter((r) => matchesQuery(r, query.trim()));
    }

    return arr;
  }, [submissions, status, fromDate, toDate, query]);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const paged = filtered.slice(startIdx, endIdx);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [query, status, fromDate, toDate, pageSize]);

  const clearFilters = () => {
    setQuery("");
    setStatus("ALL");
    setFromDate("");
    setToDate("");
    setPage(1);
    setPageSize(25);
  };

  const exportCSV = () => {
    // Build a small, safe CSV from common fields
    const rows = filtered.map((r) => {
      const submittedAt = getSubmittedAt(r);
      return {
        id: r?._id || "",
        status: getStatus(r),
        student:
          r?.studentName ||
          `${r?.student?.firstName || ""} ${r?.student?.lastName || ""}`.trim(),
        institution: r?.institutionName || r?.institution?.name || "",
        purpose: r?.purpose || "",
        submittedAt: submittedAt ? submittedAt.toISOString() : "",
        documentsCount: Array.isArray(r?.files) ? r.files.length : r?.documentsCount || "",
      };
    });

    const headers = Object.keys(rows[0] || { id: "", status: "", student: "", institution: "", purpose: "", submittedAt: "", documentsCount: "" });
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const v = (row[h] ?? "").toString().replace(/"/g, '""');
            // quote if contains comma/quote/newline
            return /[",\n]/.test(v) ? `"${v}"` : v;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dt = new Date();
    const stamp = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}_${String(dt.getHours()).padStart(2,"0")}${String(dt.getMinutes()).padStart(2,"0")}`;
    a.download = `submissions_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* PAGE HEADER */}
        <section className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Transcript Submissions
            </h1>
            <p className="text-slate-500 text-sm">
              All evaluation requests coming from students and institutions.
              Review status, documents, and routing.
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Last updated: {lastUpdated.toLocaleString()}</div>
            <div>
              Showing{" "}
              <span className="text-slate-700 font-semibold">
                {total}
              </span>{" "}
              filtered records
            </div>
          </div>
        </section>

        {/* TOOLBAR CARD */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-4 space-y-4">
          {/* Filters row */}
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
                  placeholder="Student, institution, status, ID…"
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="inreview">InReview</option>
                  <option value="needstranslation">NeedsTranslation</option>
                </select>
              </div>
            </div>

            {/* From */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Submitted From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* To */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Submitted To
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

          {/* Actions row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

              <button
                onClick={fetchSubmissions}
                disabled={loading}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </section>

        {/* TABLE CARD */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <AdminSubmissionsTable
            submissions={paged}
            onRefresh={fetchSubmissions}
            loading={loading}
          />
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
          Admin visibility includes all submissions across all schools.
          Rejections with suspicious reasons may indicate attempted fraud or
          falsified documents.
        </section>
      </div>
    </main>
  );
}
