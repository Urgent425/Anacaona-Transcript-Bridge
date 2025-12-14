// src/pages/ReportsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";

const CHART_COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#facc15", "#f97316", "#ef4444"];

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/admin/reports/dashboard-stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.status === 401) {
          navigate("/admin/login", { replace: true });
          return;
        }

        if (!res.ok) {
          throw new Error(`Server error ${res.status}`);
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError("Could not load reporting data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  // Safe fallback for render
  const {
    totalTranscripts = 0,
    byApprovalStatus = [],
    byPurpose = [],
    byInstitution = [],
  } = stats || {};

  // Make a quick lookup for status counts
  const statusMap = useMemo(() => {
    const m = { pending: 0, approved: 0, rejected: 0 };
    byApprovalStatus.forEach((row) => {
      if (!row?._id) return;
      m[row._id] = row.count;
    });
    return m;
  }, [byApprovalStatus]);

  // Pick top 5 institutions for the ranking table
  const topInstitutions = useMemo(() => {
    return [...byInstitution]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [byInstitution]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
        <div className="max-w-7xl mx-auto text-slate-600 text-sm">
          Loading reports…
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

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* PAGE HEADER */}
        <section className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Admin Reports
            </h1>
            <p className="text-slate-500 text-sm">
              System-wide activity across student submissions, institutional approvals, and purposes.
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Last updated: {new Date().toLocaleString()}</div>
            <div>Scope: All institutions</div>
          </div>
        </section>

        {/* KPI CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Activity className="w-4 h-4 text-indigo-600" />}
            label="Total Submissions"
            value={totalTranscripts}
            footer={`${totalTranscripts} total requests in system`}
            bgClass="bg-white"
            ringClass="ring-indigo-100"
          />

          <KpiCard
            icon={<Clock className="w-4 h-4 text-amber-500" />}
            label="Pending Review"
            value={statusMap.pending || 0}
            footer="Waiting on institution"
            bgClass="bg-white"
            ringClass="ring-amber-100"
          />

          <KpiCard
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            label="Approved"
            value={statusMap.approved || 0}
            footer="Ready / cleared"
            bgClass="bg-white"
            ringClass="ring-emerald-100"
          />

          <KpiCard
            icon={<XCircle className="w-4 h-4 text-red-600" />}
            label="Rejected"
            value={statusMap.rejected || 0}
            footer="Returned to student"
            bgClass="bg-white"
            ringClass="ring-red-100"
          />
        </section>

        {/* CHARTS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Approval status pie */}
          <CardPanel title="Submissions by Approval Status">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byApprovalStatus}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ _id, percent }) =>
                    `${_id || "unknown"} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {byApprovalStatus.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: "0.8rem",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardPanel>

          {/* Purpose pie */}
          <CardPanel title="Submissions by Stated Purpose">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byPurpose}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ _id, percent }) =>
                    `${_id || "Other"} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {byPurpose.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: "0.8rem",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardPanel>

          {/* Institution volume bar */}
          <CardPanel
            className="lg:col-span-2"
            title="Volume by Institution"
            description="Which institutions are generating the most outbound academic verifications."
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byInstitution} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                <XAxis
                  dataKey="institution"
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
                <Legend />
                <Bar
                  dataKey="count"
                  name="Submissions"
                  fill="#0ea5e9"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Top performers table */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Top Institutions
              </h4>
              {topInstitutions.length === 0 ? (
                <div className="text-xs text-slate-500">
                  No institution data.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 font-medium">Institution</th>
                        <th className="px-3 py-2 font-medium text-right">
                          Submissions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topInstitutions.map((inst, idx) => (
                        <tr
                          key={idx}
                          className="border-b last:border-b-0 border-slate-100"
                        >
                          <td className="px-3 py-2 text-slate-700 font-medium truncate">
                            {inst.institution || "—"}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-900 font-semibold">
                            {inst.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardPanel>
        </section>
      </div>
    </main>
  );
}

/* ========== Reusable subcomponents ========== */

function KpiCard({ icon, label, value, footer, bgClass, ringClass }) {
  return (
    <div
      className={`rounded-xl ${bgClass} ring-1 ${ringClass} p-4 flex flex-col shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="text-slate-500 text-xs font-medium uppercase tracking-wide flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
      </div>

      <div className="mt-3 text-3xl font-semibold text-slate-900 leading-tight">
        {value}
      </div>

      <div className="mt-2 text-xs text-slate-500">{footer}</div>
    </div>
  );
}

function CardPanel({ title, description, className = "", children }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-slate-900 text-base font-semibold leading-tight">
          {title}
        </h3>
        {description && (
          <p className="text-slate-500 text-sm mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
