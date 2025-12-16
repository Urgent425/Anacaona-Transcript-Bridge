// src/components/TranslationSection.jsx
import React, { useState, useEffect } from "react";
import TranslationUploadForm from "./TranslationUploadForm";
import SubmissionsTable from "./SubmissionsTable";
import PricingSummary from "./PricingSummary";
import { RefreshCw, CreditCard, Info, AlertTriangle } from "lucide-react";

const TranslationSection = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const pending = submissions.filter((s) => !s.locked);
  const canPay = pending.length > 0 && !loading && !fetching;

  useEffect(() => {
    fetchSubmissions();
   
  }, []);

  const fetchSubmissions = async () => {
    setFetching(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/translation-requests/mine`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Failed to load submissions (${res.status})`);
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("We couldn’t load your translation submissions. Please try again.");
    } finally {
      setFetching(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this submission?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/translation-requests/${id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Delete failed");
      fetchSubmissions();
    } catch (err) {
      alert("Delete failed.");
    }
  };

 const handleProceedToPayment = async () => {
  if (pending.length === 0) return;

  const ok = window.confirm(
    `Proceed to payment for ${pending.length} pending submission${
      pending.length > 1 ? "s" : ""
    }?`
  );
  if (!ok) return;

  try {
    setLoading(true);

    const token = localStorage.getItem("token");
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/translation-requests/lock-and-pay`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ submissionIds: pending.map((s) => s._id) }),
      }
    );

    const data = await res.json();
    if (!res.ok || !data?.paymentUrl) {
      throw new Error(data?.message || data?.error || "Payment initiation failed.");
    }

    // ✅ Open Stripe in a new tab/window (does not replace Anacaona page)
    const win = window.open(
      data.paymentUrl,
      "stripeCheckout",
      "noopener,noreferrer,width=520,height=720"
    );
    // ✅ If popup is BLOCKED, fall back to same-tab redirect
    if (!win) {
       window.location.href = data.paymentUrl;
       return;
    }


    // Optional: bring focus to the new tab
    win.focus?.();

    // Optional: refresh list so UI stays updated after session creation
    // (Especially useful if backend marks status like "pending_payment")
    fetchSubmissions();
  } catch (err) {
    alert(err.message || "Payment initiation failed.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Info Banner */}
      <div className="rounded-xl bg-sky-50 ring-1 ring-sky-200 text-sky-900 px-4 py-3 flex gap-3">
        <div className="shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-sm leading-relaxed">
          <div className="font-medium">Translation service</div>
          Upload documents that need certified translation. You’ll see a clear
          price before paying, and you can track progress from here.
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl bg-red-50 ring-1 ring-red-200 text-red-800 px-4 py-3 flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-slate-500">
          {lastUpdated ? (
            <>Last updated: {lastUpdated.toLocaleString()}</>
          ) : (
            <>Loading your submissions…</>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSubmissions}
            disabled={fetching}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
              fetching
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-slate-50 border-slate-300"
            }`}
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleProceedToPayment}
            disabled={!canPay}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white ${
              canPay
                ? "bg-slate-900 hover:bg-slate-800"
                : "bg-slate-400 cursor-not-allowed"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {loading ? "Preparing…" : "Proceed to Payment"}
          </button>
        </div>
      </div>

      {/* Upload Card */}
      <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
        <header className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            Upload documents for translation
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Accepted formats: PDF, JPG, PNG. You can add more later.
          </p>
        </header>
        <div className="p-4">
          <TranslationUploadForm onSubmitted={fetchSubmissions} />
        </div>
      </section>

      {/* Submissions Card */}
      <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
        <header className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Your translation submissions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {fetching
                ? "Loading…"
                : submissions.length
                ? `${submissions.length} total • ${pending.length} pending payment`
                : "No submissions yet — upload your first document above."}
            </p>
          </div>
        </header>
        <div className="p-4">
          {fetching ? (
            <TableSkeleton />
          ) : submissions.length === 0 ? (
            <EmptyState />
          ) : (
            <SubmissionsTable submissions={submissions} onDelete={handleDelete} />
          )}
        </div>
      </section>

      {/* Pricing / Checkout Card */}
      <section className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
        <header className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Summary & Payment</h3>
          <p className="text-xs text-slate-500 mt-1">
            Review estimated costs. You can proceed when ready.
          </p>
        </header>
        <div className="p-4">
          <PricingSummary
            submissions={submissions}
            onProceedToPayment={handleProceedToPayment}
          />
        </div>
      </section>
    </div>
  );
};

export default TranslationSection;

/* ------------ Little UI helpers (skeleton / empty) ------------ */

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10">
      <div className="text-4xl">📄</div>
      <h4 className="mt-2 text-slate-800 font-semibold">
        No translations yet
      </h4>
      <p className="text-sm text-slate-500 mt-1">
        Upload your first document above to get an instant estimate.
      </p>
    </div>
  );
}
