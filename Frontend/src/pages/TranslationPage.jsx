// src/pages/TranslationPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import useAdminPerms from "../hooks/useAdminPerms";
import AssignAdminModal from "../components/AssignAdminModal";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Truck,
  MapPin,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function safeLower(v) {
  return String(v || "").toLowerCase().trim();
}

function normalizeDeliveryMethod(v) {
  const s = safeLower(v);
  if (!s) return "";
  if (s === "hard copy" || s === "hardcopy" || s === "mail" || s === "shipping") return "hard copy";
  if (s === "both") return "both";
  if (s === "email" || s === "digital") return "email";
  return s;
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

function getDate(iso) {
  const d = iso ? new Date(iso) : null;
  return Number.isNaN(d?.getTime?.()) ? null : d;
}

function StatusBadge({ status }) {
  const s = safeLower(status);

  if (!s) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-300 px-2 py-0.5 text-[11px] font-medium">
        —
      </span>
    );
  }

  if (s === "pending") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-medium capitalize">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  }

  if (s === "locked") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[11px] font-medium capitalize">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Locked
      </span>
    );
  }

  if (s === "paid") {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[11px] font-medium capitalize">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Paid
      </span>
    );
  }

  if (s === "completed") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium capitalize">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Completed
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
  if (!name) return <span className="text-[11px] text-slate-500 italic">Unassigned</span>;
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 text-[11px] font-medium">
      {name}
    </span>
  );
}

function DeliveryChip({ deliveryMethod }) {
  const dm = normalizeDeliveryMethod(deliveryMethod);

  if (!dm) {
    return (
      <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-600 border border-slate-300 px-2 py-0.5 text-[11px] font-medium">
        —
      </span>
    );
  }

  if (dm === "email") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 text-[11px] font-medium">
        <Mail className="w-3 h-3" />
        Email
      </span>
    );
  }

  if (dm === "hard copy") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[11px] font-medium">
        <Truck className="w-3 h-3" />
        Hard copy
      </span>
    );
  }

  if (dm === "both") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[11px] font-medium">
        <Mail className="w-3 h-3" />
        <Truck className="w-3 h-3 -ml-0.5" />
        Both
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-600 border border-slate-300 px-2 py-0.5 text-[11px] font-medium capitalize">
      {dm}
    </span>
  );
}

function AddressBlock({ address }) {
  if (!address) return <span className="text-[11px] text-slate-500">—</span>;

  const parts = [
    address.name,
    address.address1,
    address.address2,
    [address.city, address.state, address.zip].filter(Boolean).join(", "),
    address.country,
    address.phone ? `Phone: ${address.phone}` : null,
  ].filter(Boolean);

  if (parts.length === 0) return <span className="text-[11px] text-slate-500">—</span>;

  return (
    <div className="text-[11px] text-slate-700 leading-snug">
      {parts.map((p, idx) => (
        <div key={idx} className="truncate" title={p}>
          {p}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────── */

export default function TranslationPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const navigate = useNavigate();
  const { me, canSelfAssign, canAssignToOthers } = useAdminPerms();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/admin/login", { replace: true });

      // Your controller is used by TranslationQueuePage as:
      // GET /api/admin/translations?status=<pending|locked|paid|completed|all>
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/translation-requests?status=all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Non-JSON response (${res.status}) ${text.slice(0, 120)}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      setJobs(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || "Failed to load translation jobs");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const selfAssign = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/assignments/translation-requests/${id}/self-assign`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 409) {
        alert("Someone else already took this.");
        return fetchJobs();
      }

      if (!res.ok) {
        const maybeJSON = res.headers.get("content-type")?.includes("application/json");
        const body = maybeJSON ? await res.json() : await res.text();
        throw new Error((maybeJSON ? body?.message : body) || `HTTP ${res.status}`);
      }

      fetchJobs();
    } catch (e) {
      alert(e.message || "Could not self-assign.");
    }
  };

  // ───────────────── Filters / Pagination ─────────────────
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL"); // ALL | pending | locked | paid | completed
  const [fromLang, setFromLang] = useState("");
  const [toLang, setToLang] = useState("");
  const [delivery, setDelivery] = useState("ALL"); // ALL | email | hard copy | both
  const [needsShipOnly, setNeedsShipOnly] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [myQueue, setMyQueue] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const matchesQuery = (j, q) => {
    if (!q) return true;
    const blob = [
      j?._id,
      j?.requestId,
      j?.status,
      j?.studentName,
      j?.studentEmail,
      j?.documentName,
      j?.fromLang,
      j?.toLang,
      j?.assignee,
      j?.deliveryMethod,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return blob.includes(q.toLowerCase());
  };

  const filtered = useMemo(() => {
    let arr = jobs;

    if (status !== "ALL") {
      arr = arr.filter((j) => safeLower(j?.status) === safeLower(status));
    }

    if (fromLang.trim()) {
      arr = arr.filter((j) => safeLower(j?.fromLang) === safeLower(fromLang.trim()));
    }

    if (toLang.trim()) {
      arr = arr.filter((j) => safeLower(j?.toLang) === safeLower(toLang.trim()));
    }

    if (delivery !== "ALL") {
      arr = arr.filter(
        (j) => normalizeDeliveryMethod(j?.deliveryMethod) === normalizeDeliveryMethod(delivery)
      );
    }

    if (needsShipOnly) {
      arr = arr.filter((j) => !!j?.shippingAddress);
    }

    if (fromDate) {
      const from = new Date(fromDate + "T00:00:00");
      arr = arr.filter((j) => {
        const d = getDate(j?.createdAt);
        return d ? d >= from : true;
      });
    }

    if (toDate) {
      const to = new Date(toDate + "T23:59:59");
      arr = arr.filter((j) => {
        const d = getDate(j?.createdAt);
        return d ? d <= to : true;
      });
    }

    if (onlyUnassigned) {
      arr = arr.filter((j) => !j?.assignee);
    }

    if (myQueue && me?.name) {
      arr = arr.filter((j) => safeLower(j?.assignee) === safeLower(me.name));
    }

    if (query.trim()) {
      arr = arr.filter((j) => matchesQuery(j, query.trim()));
    }

    return arr;
  }, [jobs, status, fromLang, toLang, delivery, needsShipOnly, fromDate, toDate, onlyUnassigned, myQueue, query, me?.name]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const paged = filtered.slice(startIdx, endIdx);

  useEffect(() => {
    setPage(1);
  }, [query, status, fromLang, toLang, delivery, needsShipOnly, fromDate, toDate, onlyUnassigned, myQueue, pageSize]);

  const clearFilters = () => {
    setQuery("");
    setStatus("ALL");
    setFromLang("");
    setToLang("");
    setDelivery("ALL");
    setNeedsShipOnly(false);
    setFromDate("");
    setToDate("");
    setOnlyUnassigned(false);
    setMyQueue(false);
    setPageSize(25);
    setPage(1);
  };

  const exportCSV = () => {
    const rows = filtered.map((j) => ({
      id: j?._id || "",
      requestId: j?.requestId || "",
      status: j?.status || "",
      studentName: j?.studentName || "",
      studentEmail: j?.studentEmail || "",
      documentName: j?.documentName || "",
      fromLang: j?.fromLang || "",
      toLang: j?.toLang || "",
      assignee: j?.assignee || "",
      deliveryMethod: normalizeDeliveryMethod(j?.deliveryMethod),
      shipName: j?.shippingAddress?.name || "",
      shipAddress1: j?.shippingAddress?.address1 || "",
      shipCity: j?.shippingAddress?.city || "",
      shipState: j?.shippingAddress?.state || "",
      shipZip: j?.shippingAddress?.zip || "",
      shipCountry: j?.shippingAddress?.country || "",
      shipPhone: j?.shippingAddress?.phone || "",
      createdAt: j?.createdAt || "",
    }));

    const headers = Object.keys(rows[0] || { id: "" });
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const v = (row[h] ?? "").toString().replace(/"/g, '""');
            return /[",\n]/.test(v) ? `"${v}"` : v;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dt = new Date();
    const stamp = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(
      2,
      "0"
    )}_${String(dt.getHours()).padStart(2, "0")}${String(dt.getMinutes()).padStart(2, "0")}`;
    a.href = url;
    a.download = `translation_jobs_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
        <div className="max-w-7xl mx-auto text-slate-600 text-sm">Loading translation jobs…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
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
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Translation Requests</h1>
            <p className="text-slate-500 text-sm">
              Queue view aligned to the admin controller job shape (delivery + shipping included when needed).
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Last updated: {lastUpdated.toLocaleString()}</div>
            <div>
              Showing <span className="text-slate-700 font-semibold">{total}</span> filtered job{total === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="md:col-span-4">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Student, email, requestId, status, assignee…"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="ALL">All</option>
                  <option value="pending">Pending</option>
                  <option value="locked">Locked</option>
                  <option value="paid">Paid</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Delivery */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Delivery</label>
              <select
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="ALL">All</option>
                <option value="email">Email</option>
                <option value="hard copy">Hard copy</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* From */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">From</label>
              <input
                value={fromLang}
                onChange={(e) => setFromLang(e.target.value)}
                placeholder="French"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* To */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">To</label>
              <input
                value={toLang}
                onChange={(e) => setToLang(e.target.value)}
                placeholder="English"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Dates */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">From date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">To date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Page size */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Page size</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
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
                Only unassigned
              </label>

              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={myQueue}
                  onChange={(e) => setMyQueue(e.target.checked)}
                />
                My queue
              </label>

              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={needsShipOnly}
                  onChange={(e) => setNeedsShipOnly(e.target.checked)}
                />
                Needs shipping
              </label>

              <div className="text-xs text-slate-500">
                {total > 0 ? (
                  <>
                    Showing <span className="text-slate-700 font-semibold">{startIdx + 1}</span>–
                    <span className="text-slate-700 font-semibold">{endIdx}</span> of{" "}
                    <span className="text-slate-700 font-semibold">{total}</span>
                  </>
                ) : (
                  "No results"
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50"
              >
                <XCircle className="w-4 h-4" />
                Clear filters
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
                onClick={fetchJobs}
                className="inline-flex items-center gap-2 h-8 text-xs px-3 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        {/* TABLE */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          {paged.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 bg-white">
              <div className="text-slate-900 font-medium mb-1">No jobs match your filters</div>
              <div className="text-[12px] text-slate-500">Try clearing filters or refreshing.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1180px] text-left">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Request</th>
                    <th className="px-4 py-3 font-medium">Document</th>
                    <th className="px-4 py-3 font-medium">Languages</th>
                    <th className="px-4 py-3 font-medium">Delivery</th>
                    <th className="px-4 py-3 font-medium">Shipping address</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Assignee</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paged.map((job) => (
                    <tr
                      key={job._id}
                      className={
                        safeLower(job.status) === "locked"
                          ? "bg-red-50/30"
                          : safeLower(job.status) === "completed"
                          ? "bg-emerald-50/30"
                          : ""
                      }
                    >
                      {/* Student */}
                      <td className="align-top px-4 py-4">
                        <div className="text-slate-900 font-medium">{job.studentName || "—"}</div>
                        <div className="text-[11px] text-slate-500 leading-tight truncate max-w-[220px]">
                          {job.studentEmail || "—"}
                        </div>
                      </td>

                      {/* Request ID */}
                      <td className="align-top px-4 py-4">
                        <div className="font-mono text-[12px] text-slate-900 break-all">
                          {job.requestId || job._id}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {job.createdAt ? (
                            <>
                              {new Date(job.createdAt).toLocaleDateString()} • {formatAge(job.createdAt)}
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                      </td>

                      {/* Document */}
                      <td className="align-top px-4 py-4">
                        <div className="text-slate-900 font-medium truncate max-w-[260px]" title={job.documentName}>
                          {job.documentName || "—"}
                        </div>
                        <div className="text-[11px] text-slate-500">Open files in “View”.</div>
                      </td>

                      {/* Languages */}
                      <td className="align-top px-4 py-4 whitespace-nowrap">
                        <LangChip from={job.fromLang} to={job.toLang} />
                      </td>

                      {/* Delivery */}
                      <td className="align-top px-4 py-4 whitespace-nowrap">
                        <DeliveryChip deliveryMethod={job.deliveryMethod} />
                      </td>

                      {/* Shipping */}
                      <td className="align-top px-4 py-4">
                        {job.shippingAddress ? (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                            <AddressBlock address={job.shippingAddress} />
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="align-top px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={job.status} />
                      </td>

                      {/* Assignee */}
                      <td className="align-top px-4 py-4 whitespace-nowrap">
                        <AssigneeChip name={job.assignee} />
                      </td>

                      {/* Actions */}
                      <td className="align-top px-4 py-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/translation-requests/${job._id}`)}
                            className="h-8 text-xs px-3 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </Button>

                          {canSelfAssign && !job.assignee && (
                            <Button
                              size="sm"
                              onClick={() => selfAssign(job._id)}
                              className="h-8 text-xs px-3 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                            >
                              Take
                            </Button>
                          )}

                          {canAssignToOthers && (
                            <AssignAdminModal
                              entity="translation"
                              entityId={job._id}
                              // AssignAdminModal expects an object sometimes; provide minimal
                              currentAssignee={job.assignee ? { name: job.assignee } : null}
                              onAssigned={fetchJobs}
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
          Shipping address appears only when delivery requires it (“hard copy” or “both”). File downloads are available
          inside the request detail page (“View”), because the list endpoint intentionally returns a lightweight “job”
          shape.
        </section>
      </div>
    </main>
  );
}
