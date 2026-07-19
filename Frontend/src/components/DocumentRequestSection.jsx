// src/components/DocumentRequestSection.jsx
import React, { useEffect, useState } from "react";
import { ShieldCheck, Upload, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";

// Hardcoded for now — keep in sync with Backend/routes/documentRequestRoutes.js
const DOCUMENT_TREE = {
  academic: {
    label: "Academic Documents",
    types: ["Transcript", "Diploma", "Degree Certificate", "Enrollment Letter", "Academic Record"],
  },
  civil: {
    label: "Civil Documents",
    types: ["Birth Certificate", "Marriage Certificate", "Death Certificate", "Divorce Certificate", "National ID Records"],
  },
  professional: {
    label: "Professional Documents",
    types: ["Medical License", "Engineering License", "Bar Certificate", "Professional Certifications"],
  },
  government: {
    label: "Government Documents",
    types: ["Police Certificate", "Tax Certificate", "Business Registration", "Others"],
  },
};

// Display-only copy of Backend/config/documentRequestPricing.js — the backend
// price is what's actually charged. Keep these two in sync when you edit prices.
const PRICE_DISPLAY_CENTS = {
  academic: {
    "Transcript": 4000,
    "Diploma": 5000,
    "Degree Certificate": 5000,
    "Enrollment Letter": 3000,
    "Academic Record": 4000,
  },
  civil: {
    "Birth Certificate": 3500,
    "Marriage Certificate": 3500,
    "Death Certificate": 3500,
    "Divorce Certificate": 4000,
    "National ID Records": 3000,
  },
  professional: {
    "Medical License": 6000,
    "Engineering License": 6000,
    "Bar Certificate": 6000,
    "Professional Certifications": 5000,
  },
  government: {
    "Police Certificate": 4500,
    "Tax Certificate": 4000,
    "Business Registration": 5000,
    "Others": 4000,
  },
};

function formatCents(cents) {
  if (typeof cents !== "number") return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function getDisplayPrice(category, type) {
  return PRICE_DISPLAY_CENTS[category]?.[type] ?? null;
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function StatusBadge({ status }) {
  const map = {
    pending: { icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200" },
    approved: { icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { icon: XCircle, cls: "bg-rose-50 text-rose-700 border-rose-200" },
  };
  const entry = map[status] || { icon: Clock, cls: "bg-slate-100 text-slate-600 border-slate-300" };
  const Icon = entry.icon;
  return (
    <span className={classNames("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", entry.cls)}>
      <Icon className="w-3 h-3" />
      {status || "pending"}
    </span>
  );
}

export default function DocumentRequestSection() {
  const [category, setCategory] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [legalName, setLegalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [identityDocument, setIdentityDocument] = useState(null);
  const [supportingFiles, setSupportingFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState("");

  const [mine, setMine] = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);

  const [payingId, setPayingId] = useState(null);
  const [payingTotal, setPayingTotal] = useState(false);

  const payNow = async (submissionId) => {
    setPayingId(submissionId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/create-document-request-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not start payment");
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert(e.message || "Could not start payment");
    } finally {
      setPayingId(null);
    }
  };

  const payTotal = async () => {
    setPayingTotal(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/create-document-requests-total-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not start payment");
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert(e.message || "Could not start payment");
    } finally {
      setPayingTotal(false);
    }
  };

  const fetchMine = async () => {
    setLoadingMine(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/document-requests/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMine(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const handleCategoryChange = (value) => {
    setCategory(value);
    setDocumentType(""); // reset dependent select
  };

  const resetForm = () => {
    setCategory("");
    setDocumentType("");
    setLegalName("");
    setDateOfBirth("");
    setIdNumber("");
    setNotes("");
    setIdentityDocument(null);
    setSupportingFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessId("");

    if (!category || !documentType) {
      setError("Please select a document category and type.");
      return;
    }
    if (!legalName.trim() || !dateOfBirth) {
      setError("Legal name and date of birth are required.");
      return;
    }
    if (!identityDocument) {
      setError("A copy of a government-issued ID is required for document requests.");
      return;
    }
    if (supportingFiles.length === 0) {
      setError("Please upload at least one copy of the document you are requesting.");
      return;
    }

    const formData = new FormData();
    formData.append("documentCategory", category);
    formData.append("documentType", documentType);
    formData.append("legalName", legalName.trim());
    formData.append("dateOfBirth", dateOfBirth);
    formData.append("idNumber", idNumber.trim());
    formData.append("notes", notes.trim());
    formData.append("identityDocument", identityDocument);
    supportingFiles.forEach((file) => formData.append("files", file));

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/document-requests/submit`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Submission failed");

      setSuccessId(data.submissionId);
      resetForm();
      fetchMine();
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const [deletingKey, setDeletingKey] = useState(null);

  const deleteDocument = async (sub, idx) => {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    setDeletingKey(`${sub._id}-${idx}`);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/document-requests/${sub._id}/document/${idx}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not delete document");
      fetchMine();
    } catch (e) {
      alert(e.message || "Could not delete document");
    } finally {
      setDeletingKey(null);
    }
  };

  const totalDueCents = mine
    .filter((sub) => sub.paymentStatus !== "paid")
    .reduce((sum, sub) => sum + (getDisplayPrice(sub.documentCategory, sub.documentType) || 0), 0);
  const unpaidCount = mine.filter((sub) => sub.paymentStatus !== "paid").length;

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-xl bg-sky-50 ring-1 ring-sky-200 text-sky-800 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="text-sm">
          <div className="font-medium">Identity verification required</div>
          <p className="mt-1">
            Official document requests (civil, professional, or government records) are reviewed by our
            team before being sent to the relevant institution. Please upload a clear copy of a
            government-issued ID matching the legal name on the request.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {successId && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
          Request submitted successfully. Your reference ID is <strong>{successId}</strong>.
          Complete payment below to send it to our review team.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Document Category</span>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="mt-1 block w-full p-2 border border-slate-300 rounded-lg"
              required
            >
              <option value="">Select a category…</option>
              {Object.entries(DOCUMENT_TREE).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Document Type</span>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="mt-1 block w-full p-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
              disabled={!category}
              required
            >
              <option value="">{category ? "Select a document type…" : "Choose a category first"}</option>
              {category && DOCUMENT_TREE[category].types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {category && documentType && (
              <div className="text-xs text-slate-500 mt-1">
                Fee: <span className="font-medium text-slate-700">{formatCents(getDisplayPrice(category, documentType))}</span>
              </div>
            )}
          </label>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Applicant Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Full Legal Name</span>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="mt-1 block w-full p-2 border border-slate-300 rounded-lg"
                placeholder="As it appears on your ID"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Date of Birth</span>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="mt-1 block w-full p-2 border border-slate-300 rounded-lg"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">National ID / Passport # <span className="text-slate-400 font-normal">(optional)</span></span>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="mt-1 block w-full p-2 border border-slate-300 rounded-lg"
              />
            </label>
          </div>

          <label className="block text-sm mt-4">
            <span className="text-slate-700 font-medium">Government ID Upload (required)</span>
            <div className="mt-1 flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3">
              <Upload className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setIdentityDocument(e.target.files?.[0] || null)}
                className="text-sm"
                required
              />
            </div>
            {identityDocument && (
              <div className="text-xs text-slate-500 mt-1">Selected: {identityDocument.name}</div>
            )}
          </label>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Document Copy <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(the document you want the institution to certify/issue — e.g. an existing scan or photo)</span></span>
            <input
              type="file"
              multiple
              onChange={(e) => setSupportingFiles(Array.from(e.target.files || []))}
              className="mt-1 block w-full text-sm"
              required
            />
          </label>

          <label className="block text-sm mt-4">
            <span className="text-slate-700 font-medium">Notes <span className="text-slate-400 font-normal">(optional)</span></span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full p-2 border border-slate-300 rounded-lg"
              placeholder="Anything the reviewing team should know about this request."
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Document Request"}
        </button>
      </form>

      {/* Past requests */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Your Document Requests
            <button
              type="button"
              onClick={fetchMine}
              className="ml-2 text-xs font-normal text-slate-500 underline hover:text-slate-700"
            >
              Refresh
            </button>
          </h3>

          {unpaidCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-600">
                {unpaidCount} unpaid · Total due: <span className="font-semibold text-slate-900">{formatCents(totalDueCents)}</span>
              </div>
              <button
                type="button"
                onClick={payTotal}
                disabled={payingTotal}
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {payingTotal ? "Redirecting…" : `Pay Total Due (${formatCents(totalDueCents)})`}
              </button>
            </div>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {loadingMine ? (
            <div className="p-5 text-sm text-slate-500">Loading…</div>
          ) : mine.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No document requests yet.</div>
          ) : (
            mine.map((sub) => (
              <div key={sub._id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {sub.documentType || "—"}
                      <span className="ml-2 text-xs text-slate-500 capitalize">({sub.documentCategory})</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{sub.submissionId}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={sub.approvalStatus} />
                    <span
                      className={classNames(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
                        sub.paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {sub.paymentStatus === "paid" ? "Paid" : "Payment due"}
                    </span>
                  </div>
                </div>

                {Array.isArray(sub.documents) && sub.documents.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sub.documents.map((d, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 pl-2 pr-1 py-1"
                      >
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("token");
                              const res = await fetch(
                                `${process.env.REACT_APP_API_URL}/api/document-requests/${sub._id}/document/${idx}/download`,
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              const data = await res.json();
                              if (!res.ok || !data.url) throw new Error(data?.error || "Could not open file");
                              window.open(data.url, "_blank", "noopener,noreferrer");
                            } catch (e) {
                              alert(e.message || "Could not open file");
                            }
                          }}
                          className="text-xs text-slate-700 hover:text-slate-900 truncate max-w-[200px]"
                          title={d.filename}
                        >
                          {d.filename}
                        </button>
                        {sub.paymentStatus !== "paid" && (
                          <button
                            type="button"
                            onClick={() => deleteDocument(sub, idx)}
                            disabled={deletingKey === `${sub._id}-${idx}`}
                            title="Delete this document"
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-50 px-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {sub.paymentStatus !== "paid" && (
                  <button
                    type="button"
                    onClick={() => payNow(sub.submissionId)}
                    disabled={payingId === sub.submissionId}
                    className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {payingId === sub.submissionId
                      ? "Redirecting…"
                      : `Pay Now (${formatCents(getDisplayPrice(sub.documentCategory, sub.documentType))})`}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
