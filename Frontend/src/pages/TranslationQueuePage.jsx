//src/pages/admin/TranslationQueuePage.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  FileText,
  BarChart3,
  Table,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function TranslationQueuePage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending"); // "all" | "pending" | "locked" | "paid" | "completed"
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" | "graph"

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          "http://localhost:5000/api/admin/translations?status=" +
            encodeURIComponent(statusFilter),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // if backend returns non-200, try to show message or fallback mock:
        if (!res.ok) {
          let fallback = [];
          // local fallback mock that matches new shape
          fallback = [
            {
              _id: "abc123",
              studentName: "Marie Baptiste",
              documentName: "Transcript_Licence.pdf",
              fromLang: "French",
              toLang: "English",
              status: "pending",
              assignee: "J. Pierre",
              createdAt: "2025-10-24T14:00:00Z",
            },
            {
              _id: "def456",
              studentName: "Jean Paul",
              documentName: "Lettre_Recommandation.jpg",
              fromLang: "French",
              toLang: "English",
              status: "locked",
              assignee: null,
              createdAt: "2025-10-24T09:12:00Z",
            },
            {
              _id: "ghi789",
              studentName: "L. Etienne",
              documentName: "Baccalaureat_Certificat.pdf",
              fromLang: "French",
              toLang: "English",
              status: "completed",
              assignee: "C. Louis",
              createdAt: "2025-10-20T10:41:00Z",
            },
            {
              _id: "jkl999",
              studentName: "S. Charles",
              documentName: "Diplome_Nursing.png",
              fromLang: "French",
              toLang: "English",
              status: "paid",
              assignee: null,
              createdAt: "2025-10-26T13:05:00Z",
            },
          ];

          if (statusFilter === "all") {
            setJobs(fallback);
          } else {
            setJobs(fallback.filter((j) => j.status === statusFilter));
          }
          setLoading(false);
          return;
        }

        // good response
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Unable to load translation queue.");
        setLoading(false);
      }
    };

    fetchQueue();
  }, [statusFilter]);

  // helpers
  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const formatAge = (iso) => {
    if (!iso) return "";
    const createdMs = new Date(iso).getTime();
    const diffMs = Date.now() - createdMs;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  // Make a colored chip for our real statuses:
  // pending | locked | paid | completed
  const statusChip = (status) => {
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
          Pending
        </span>
      );
    }

    if (status === "locked") {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[11px] font-medium capitalize">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Locked
        </span>
      );
    }

    if (status === "paid") {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[11px] font-medium capitalize">
          <Clock className="w-3 h-3 mr-1" />
          Paid
        </span>
      );
    }

    if (status === "completed") {
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
  };

  // ===== GRAPH DATA =====
  // We'll group by assignee (adminAssignee on backend -> "assignee" here).
  // If no assignee, group as "Unassigned".
  const chartData = useMemo(() => {
    const counts = {};
    for (const job of jobs) {
      const key = job.assignee && job.assignee.trim() !== ""
        ? job.assignee
        : "Unassigned";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([assignee, count]) => ({
      assignee,
      count,
    }));
  }, [jobs]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* HEADER */}
        <section className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Translation Queue
            </h1>
            <p className="text-slate-500 text-sm">
              Monitor translation requests, who owns them, and whether they’re moving.
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Last updated: {new Date().toLocaleString()}</div>
            <div>Internal view only</div>
          </div>
        </section>

        {/* FILTER BAR / VIEW TOGGLE */}
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Status filter pills */}
          <div className="inline-flex rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-1 text-xs font-medium text-slate-600">
            {["all", "pending", "locked", "paid", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg capitalize transition-all ${
                  statusFilter === s
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Right: record count + view toggle */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 text-[11px] text-slate-500 leading-tight">
            <div>
              <strong className="text-slate-700">{jobs.length}</strong>{" "}
              job{jobs.length === 1 ? "" : "s"} in this view
              <div>Statuses: pending / locked / paid / completed</div>
            </div>

            <div className="inline-flex rounded-lg bg-white ring-1 ring-slate-200 shadow-sm text-[11px] font-medium overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1 px-3 py-2 hover:bg-slate-50 ${
                  viewMode === "table"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                onClick={() => setViewMode("graph")}
                className={`flex items-center gap-1 px-3 py-2 hover:bg-slate-50 ${
                  viewMode === "graph"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Graph View</span>
              </button>
            </div>
          </div>
        </section>

        {/* ERROR STATE */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* MAIN CONTENT CARD */}
        <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          {viewMode === "graph" ? (
            // ===== GRAPH VIEW =====
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 leading-tight">
                  Workload by Assignee
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  How many requests each admin (or translator) currently owns in
                  the “{statusFilter}” filter.
                  “Unassigned” means nobody has taken responsibility yet.
                </p>
              </div>

              {chartData.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 bg-white">
                  <div className="text-slate-900 font-medium mb-1">
                    No data to plot
                  </div>
                  <div className="text-[12px] text-slate-500">
                    Try a different status filter above.
                  </div>
                </div>
              ) : (
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                      <XAxis
                        dataKey="assignee"
                        tick={{ fontSize: 12, fill: "#475569" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={{ stroke: "#E2E8F0" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "#475569" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={{ stroke: "#E2E8F0" }}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: "0.8rem",
                          borderRadius: "0.5rem",
                        }}
                        cursor={{ fill: "rgba(148,163,184,0.15)" }}
                      />
                      <Bar
                        dataKey="count"
                        name="Requests"
                        fill="#0ea5e9"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            // ===== TABLE VIEW =====
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px] text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Document</th>
                      <th className="px-4 py-3 font-medium">Lang Pair</th>
                      <th className="px-4 py-3 font-medium">Assignee</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Submitted
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loading ? (
                      <tr>
                        <td
                          className="px-4 py-6 text-center text-slate-400 text-sm"
                          colSpan={6}
                        >
                          Loading…
                        </td>
                      </tr>
                    ) : jobs.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-6 text-center text-slate-400 text-sm"
                          colSpan={6}
                        >
                          No translation requests in this status.
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr
                          key={job._id}
                          className={
                            job.status === "locked"
                              ? "bg-red-50/40"
                              : job.status === "completed"
                              ? "bg-emerald-50/40"
                              : ""
                          }
                        >
                          {/* Student */}
                          <td className="px-4 py-4 align-top">
                            <div className="text-slate-900 font-medium flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-[10px] font-semibold">
                                <User className="w-3 h-3" />
                              </span>
                              <div className="min-w-0">
                                <div className="truncate">
                                  {job.studentName || "—"}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  Request #{job._id}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Document */}
                          <td className="px-4 py-4 align-top">
                            <div className="flex items-start gap-2 min-w-0">
                              <div className="mt-0.5">
                                <FileText className="w-4 h-4 text-slate-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-slate-800 font-medium text-sm truncate">
                                  {job.documentName || "Document"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Language pair */}
                          <td className="px-4 py-4 align-top text-sm text-slate-700 whitespace-nowrap">
                            <div className="font-medium text-slate-800">
                              {job.fromLang || "—"} → {job.toLang || "—"}
                            </div>
                          </td>

                          {/* Assignee */}
                          <td className="px-4 py-4 align-top text-sm text-slate-700 whitespace-nowrap">
                            {job.assignee ? (
                              <div className="font-medium text-slate-800">
                                {job.assignee}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">
                                Unassigned
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 align-top whitespace-nowrap">
                            {statusChip(job.status)}
                          </td>

                          {/* Submitted (createdAt) */}
                          <td className="px-4 py-4 align-top text-right text-sm whitespace-nowrap">
                            <div className="font-medium text-slate-800">
                              {formatDate(job.createdAt)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {formatAge(job.createdAt)}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* FOOTNOTE */}
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  "Locked" can mean admin put a hold (billing issue, unclear scan,
                  ID mismatch).
                </div>
                <div>
                  "Paid" means fees settled. "Completed" means translation is ready.
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
