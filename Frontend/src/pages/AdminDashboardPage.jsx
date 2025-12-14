// src/pages/admin/AdmindashboradPage.jsx
import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  Languages,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOverview() {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/admin/dashboard-overview`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // If backend is not ready / 500 / 401 etc,
        // we provide a tiny sanity fallback so UI still renders.
        if (!res.ok) {
          console.warn("dashboard-overview non-200:", res.status);

          // lightweight fallback shape so cards don't crash
          setOverview({
            evalCounts: {
              total: 0,
              pending: 0,
              approved: 0,
              rejected: 0,
            },
            translationCounts: {
              total: 0,
              pending: 0,
              locked: 0,
              paid: 0,
              completed: 0,
            },
            backlogAging: [
              { label: "0-2 days", count: 0 },
              { label: "3-7 days", count: 0 },
              { label: "8+ days", count: 0 },
            ],
            recentApprovals: [],
          });

          setLoading(false);
          return;
        }

        const data = await res.json();
        setOverview(data || null);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Unable to load dashboard overview.");
        setLoading(false);
      }
    }

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
        <div className="max-w-7xl mx-auto text-slate-600 text-sm">
          Loading dashboard…
        </div>
      </main>
    );
  }

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

  // Safe destructuring with fallbacks
  const {
    evalCounts = { total: 0, pending: 0, approved: 0, rejected: 0 },
    translationCounts = {
      total: 0,
      pending: 0,
      locked: 0,
      paid: 0,
      completed: 0,
    },
    backlogAging = [],
    recentApprovals = [],
  } = overview || {};

  // Prep data for chart
  const backlogChartData = backlogAging.map((b) => ({
    bucket: b.label,
    count: b.count,
  }));

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* HEADER */}
        <section className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 text-sm">
              High-level activity across transcript evaluations and translation
              requests.
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Last updated: {new Date().toLocaleString()}</div>
            <div>Internal view only</div>
          </div>
        </section>

        {/* KPI ROWS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transcript Evaluations KPI Card */}
          <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium tracking-wide text-slate-500 uppercase flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Transcript Evaluations</span>
                </div>
                <div className="text-3xl font-semibold text-slate-900 mt-2 leading-tight">
                  {evalCounts.total}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Total submissions received
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 text-sm">
              <MiniStat
                label="Pending"
                value={evalCounts.pending}
                colorClass="text-amber-600 bg-amber-50 border-amber-200"
              />
              <MiniStat
                label="Approved"
                value={evalCounts.approved}
                colorClass="text-emerald-600 bg-emerald-50 border-emerald-200"
              />
              <MiniStat
                label="Rejected"
                value={evalCounts.rejected}
                colorClass="text-red-600 bg-red-50 border-red-200"
              />
            </div>

            <div className="mt-6 text-right">
              <a
                href="/admin/submissions"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                View evaluation reports
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Translation Requests KPI Card */}
          <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium tracking-wide text-slate-500 uppercase flex items-center gap-2">
                  <Languages className="w-4 h-4 text-sky-600" />
                  <span>Translation Requests</span>
                </div>
                <div className="text-3xl font-semibold text-slate-900 mt-2 leading-tight">
                  {translationCounts.total}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Total translation orders
                </div>
              </div>
            </div>

            {/* We show your real lifecycle: pending / locked / paid / completed */}
            <div className="grid grid-cols-4 gap-4 mt-6 text-sm">
              <MiniStat
                label="Pending"
                value={translationCounts.pending}
                colorClass="text-amber-600 bg-amber-50 border-amber-200"
              />
              <MiniStat
                label="Locked"
                value={translationCounts.locked}
                colorClass="text-red-600 bg-red-50 border-red-200"
              />
              <MiniStat
                label="Paid"
                value={translationCounts.paid}
                colorClass="text-sky-600 bg-sky-50 border-sky-200"
              />
              <MiniStat
                label="Completed"
                value={translationCounts.completed}
                colorClass="text-emerald-600 bg-emerald-50 border-emerald-200"
              />
            </div>

            <div className="mt-6 text-right">
              <a
                href="/admin/translation-queue"
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
              >
                View translation queue
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* WORKLOAD / AGING + RECENT ACTIVITY */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending backlog aging chart */}
          <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-5 flex flex-col">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900 leading-tight">
                Pending Workload Aging
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                How long transcripts have been waiting for institution approval.
              </p>
            </div>

            <div className="flex-1">
              {backlogChartData.length === 0 ? (
                <div className="text-xs text-slate-500">
                  No pending backlog data.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={backlogChartData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fontSize: 12, fill: "#475569" }}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tickLine={{ stroke: "#E2E8F0" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#475569" }}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tickLine={{ stroke: "#E2E8F0" }}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: "0.8rem",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Requests"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Items waiting 8+ days = bottleneck (the institution might not be
                responding).
              </span>
            </div>
          </div>

          {/* Recent approvals timeline */}
          <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-5 flex flex-col">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900 leading-tight">
                Recent Activity
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Latest approved transcripts and where they came from.
              </p>
            </div>

            {recentApprovals.length === 0 ? (
              <div className="text-xs text-slate-500">
                No recent approvals.
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 text-sm">
                {recentApprovals.map((row, idx) => (
                  <li
                    key={idx}
                    className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-900 font-medium truncate">
                        {row.student || "Unnamed student"}
                      </div>
                      <div className="text-slate-500 text-xs truncate">
                        {(row.institution || "—") +
                          (row.purpose ? ` • ${row.purpose}` : "")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {row.at
                          ? new Date(row.at).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>
                Unusual patterns (lots of locked translations or stalled
                approvals) can signal fraud attempts or missing paperwork.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* small subcomponent for colored mini stats in KPI cards */
function MiniStat({ label, value, colorClass }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 flex flex-col items-start ${colorClass}`}
    >
      <div className="text-[10px] font-medium uppercase tracking-wide leading-none">
        {label}
      </div>
      <div className="text-lg font-semibold leading-tight">{value}</div>
    </div>
  );
}
