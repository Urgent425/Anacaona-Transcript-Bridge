// src/pages/admin/TranslationQueuePage.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  FileText,
  BarChart3,
  Table,
  Truck,
  Mail,
  MapPin,
  Phone,
  X,
  Copy,
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

/* ─────────────────────────────────────────────────────────────
   Small helpers
───────────────────────────────────────────────────────────── */

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
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

function normalizeDeliveryMethod(v) {
  const s = String(v || "").toLowerCase().trim();
  if (!s) return null;
  if (s === "hard copy" || s === "hardcopy" || s === "mail" || s === "shipping") return "hard copy";
  if (s === "both") return "both";
  if (s === "email" || s === "digital") return "email";
  return s;
}

function needsShipping(job) {
  const dm = normalizeDeliveryMethod(job?.deliveryMethod);
  return dm === "hard copy" || dm === "both";
}

function formatAddressLines(addr) {
  // expected shape:
  // { name, address1, address2, city, state, country, zip, phone }
  if (!addr || typeof addr !== "object") return [];
  const name = addr.name || addr.fullName || "";
  const a1 = addr.address1 || "";
  const a2 = addr.address2 || "";
  const city = addr.city || "";
  const state = addr.state || addr.province || "";
  const country = addr.country || "";
  const zip = addr.zip || addr.postalCode || "";
  const phone = addr.phone || "";

  const line1 = [name].filter(Boolean).join("");
  const line2 = [a1].filter(Boolean).join("");
  const line3 = [a2].filter(Boolean).join("");
  const line4 = [city, state, zip].filter(Boolean).join(", ").replace(", ,", ",");
  const line5 = [country].filter(Boolean).join("");
  const line6 = phone ? `Phone: ${phone}` : "";

  return [line1, line2, line3, line4, line5, line6].filter((x) => x && x.trim());
}

function DeliveryChip({ deliveryMethod }) {
  const dm = normalizeDeliveryMethod(deliveryMethod);

  if (!dm) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[11px] font-medium">
        —
      </span>
    );
  }

  if (dm === "email") {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[11px] font-medium">
        <Mail className="w-3 h-3 mr-1" />
        Email
      </span>
    );
  }

  if (dm === "hard copy") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-medium">
        <Truck className="w-3 h-3 mr-1" />
        Hard copy
      </span>
    );
  }

  if (dm === "both") {
    return (
      <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[11px] font-medium">
        <Truck className="w-3 h-3 mr-1" />
        Both
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[11px] font-medium capitalize">
      {dm}
    </span>
  );
}

// pending | locked | paid | completed
function statusChip(status) {
  const s = String(status || "").toLowerCase();
  if (!s) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[11px] font-medium">
        —
      </span>
    );
  }
  if (s === "pending") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-medium">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  }
  if (s === "locked") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[11px] font-medium">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Locked
      </span>
    );
  }
  if (s === "paid") {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[11px] font-medium">
        <Clock className="w-3 h-3 mr-1" />
        Paid
      </span>
    );
  }
  if (s === "completed") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[11px] font-medium capitalize">
      {s}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Address modal
───────────────────────────────────────────────────────────── */

function AddressModal({ open, onClose, job }) {
  if (!open || !job) return null;

  const addr =
    job.shippingAddress ||
    job.deliveryAddress ||
    job.address || // tolerate older payloads
    null;

  const lines = formatAddressLines(addr);
  const canShip = needsShipping(job);

  const copyText = async () => {
    const txt = lines.length ? lines.join("\n") : "";
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      // Minimal feedback (no toast dependency)
      alert("Address copied.");
    } catch {
      alert("Could not copy. Please copy manually.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white ring-1 ring-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <div className="text-base font-semibold text-slate-900 truncate">
              Shipping Details
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Request #{job.requestId || job._id}
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-600 hover:bg-slate-50"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusChip(job.status)}
            <DeliveryChip deliveryMethod={job.deliveryMethod} />
            {canShip ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-medium">
                <Truck className="w-3 h-3 mr-1" />
                Shipping required
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 text-[11px] font-medium">
                No shipping needed
              </span>
            )}
          </div>

          {!canShip ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
              This request is not configured for hard-copy delivery. No shipping address is expected.
            </div>
          ) : lines.length ? (
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  Ship to
                </div>
                <button
                  onClick={copyText}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
              </div>

              <div className="mt-3 space-y-1 text-sm text-slate-800">
                {lines.map((ln, i) => (
                  <div key={i}>{ln}</div>
                ))}
              </div>

              {/* phone emphasis if present */}
              {addr?.phone ? (
                <div className="mt-3 text-xs text-slate-600 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{addr.phone}</span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Shipping is required, but no shipping address was found in the payload.
              Ensure the backend returns <span className="font-mono">shippingAddress</span> for deliveryMethod hard copy/both.
            </div>
          )}

          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600">
            Backend field recommendation:
            <span className="font-mono"> deliveryMethod </span>
            and
            <span className="font-mono"> shippingAddress &#123; name,address1,address2,city,state,country,zip,phone &#125;</span>.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */

export default function TranslationQueuePage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending"); // all|pending|locked|paid|completed
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("table"); // table|graph

  // Address modal
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrJob, setAddrJob] = useState(null);

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/admin/translation-requests?status=` +
            encodeURIComponent(statusFilter),
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          // Fallback mock that matches the new shape (includes shippingAddress)
          const fallback = [
            {
              _id: "abc123",
              requestId: "TRQ-20251221-0001",
              studentName: "Marie Baptiste",
              documentName: "Transcript_Licence.pdf",
              fromLang: "French",
              toLang: "English",
              status: "pending",
              assignee: "J. Pierre",
              createdAt: "2025-10-24T14:00:00Z",
              deliveryMethod: "both",
              shippingAddress: {
                name: "Marie Baptiste",
                address1: "123 Main St",
                address2: "Apt 4B",
                city: "Miami",
                state: "FL",
                country: "USA",
                zip: "33101",
                phone: "+1 (305) 555-0199",
              },
            },
            {
              _id: "def456",
              requestId: "TRQ-20251221-0002",
              studentName: "Jean Paul",
              documentName: "Lettre_Recommandation.jpg",
              fromLang: "French",
              toLang: "English",
              status: "locked",
              assignee: null,
              createdAt: "2025-10-24T09:12:00Z",
              deliveryMethod: "email",
            },
            {
              _id: "ghi789",
              requestId: "TRQ-20251221-0003",
              studentName: "L. Etienne",
              documentName: "Baccalaureat_Certificat.pdf",
              fromLang: "French",
              toLang: "English",
              status: "completed",
              assignee: "C. Louis",
              createdAt: "2025-10-20T10:41:00Z",
              deliveryMethod: "hard copy",
              shippingAddress: {
                name: "L. Etienne",
                address1: "55 Oak Ave",
                city: "Orlando",
                state: "FL",
                country: "USA",
                zip: "32801",
                phone: "+1 (407) 555-0123",
              },
            },
            {
              _id: "jkl999",
              requestId: "TRQ-20251221-0004",
              studentName: "S. Charles",
              documentName: "Diplome_Nursing.png",
              fromLang: "French",
              toLang: "English",
              status: "paid",
              assignee: null,
              createdAt: "2025-10-26T13:05:00Z",
              deliveryMethod: "email",
            },
          ];

          setJobs(
            statusFilter === "all"
              ? fallback
              : fallback.filter((j) => String(j.status).toLowerCase() === statusFilter)
          );
          setLoading(false);
          return;
        }

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

  const chartData = useMemo(() => {
    const counts = {};
    for (const job of jobs) {
      const key =
        job.assignee && String(job.assignee).trim() !== "" ? job.assignee : "Unassigned";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([assignee, count]) => ({ assignee, count }));
  }, [jobs]);

  const openAddress = (job) => {
    setAddrJob(job);
    setAddrOpen(true);
  };

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
              Monitor translation requests, who owns them, and delivery needs (email vs shipping).
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
                className={cx(
                  "px-3 py-2 rounded-lg capitalize transition-all",
                  statusFilter === s
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                )}
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
                className={cx(
                  "flex items-center gap-1 px-3 py-2 hover:bg-slate-50",
                  viewMode === "table" ? "bg-slate-900 text-white" : "text-slate-600"
                )}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                onClick={() => setViewMode("graph")}
                className={cx(
                  "flex items-center gap-1 px-3 py-2 hover:bg-slate-50",
                  viewMode === "graph" ? "bg-slate-900 text-white" : "text-slate-600"
                )}
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
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 leading-tight">
                  Workload by Assignee
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  How many requests each admin currently owns in the “{statusFilter}” filter.
                </p>
              </div>

              {chartData.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 bg-white">
                  <div className="text-slate-900 font-medium mb-1">No data to plot</div>
                  <div className="text-[12px] text-slate-500">Try a different status filter above.</div>
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
                        contentStyle={{ fontSize: "0.8rem", borderRadius: "0.5rem" }}
                        cursor={{ fill: "rgba(148,163,184,0.15)" }}
                      />
                      <Bar dataKey="count" name="Requests" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1120px] text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Document</th>
                      <th className="px-4 py-3 font-medium">Lang Pair</th>
                      <th className="px-4 py-3 font-medium">Delivery</th>
                      <th className="px-4 py-3 font-medium">Assignee</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Submitted</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loading ? (
                      <tr>
                        <td className="px-4 py-6 text-center text-slate-400 text-sm" colSpan={7}>
                          Loading…
                        </td>
                      </tr>
                    ) : jobs.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-center text-slate-400 text-sm" colSpan={7}>
                          No translation requests in this status.
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => {
                        const ship = needsShipping(job);

                        return (
                          <tr
                            key={job._id}
                            className={cx(
                              job.status === "locked" && "bg-red-50/40",
                              job.status === "completed" && "bg-emerald-50/40"
                            )}
                          >
                            {/* Student */}
                            <td className="px-4 py-4 align-top">
                              <div className="text-slate-900 font-medium flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-[10px] font-semibold">
                                  <User className="w-3 h-3" />
                                </span>
                                <div className="min-w-0">
                                  <div className="truncate">{job.studentName || "—"}</div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    Request #{job.requestId || job._id}
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

                            {/* Delivery + address */}
                            <td className="px-4 py-4 align-top whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <DeliveryChip deliveryMethod={job.deliveryMethod} />
                                {ship && (
                                  <button
                                    type="button"
                                    onClick={() => openAddress(job)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                    title="View shipping address"
                                  >
                                    <MapPin className="w-3.5 h-3.5" />
                                    Address
                                  </button>
                                )}
                              </div>
                              {ship && !job.shippingAddress && (
                                <div className="mt-1 text-[11px] text-red-600">
                                  Missing address
                                </div>
                              )}
                            </td>

                            {/* Assignee */}
                            <td className="px-4 py-4 align-top text-sm text-slate-700 whitespace-nowrap">
                              {job.assignee ? (
                                <div className="font-medium text-slate-800">{job.assignee}</div>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4 align-top whitespace-nowrap">
                              {statusChip(job.status)}
                            </td>

                            {/* Submitted */}
                            <td className="px-4 py-4 align-top text-right text-sm whitespace-nowrap">
                              <div className="font-medium text-slate-800">
                                {formatDate(job.createdAt)}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {formatAge(job.createdAt)}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  Delivery “Hard copy” / “Both” requires a shipping address (US only).
                </div>
                <div>
                  “Locked” can indicate billing issue, unclear scan, or validation hold.
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <AddressModal
        open={addrOpen}
        job={addrJob}
        onClose={() => {
          setAddrOpen(false);
          setAddrJob(null);
        }}
      />
    </main>
  );
}
