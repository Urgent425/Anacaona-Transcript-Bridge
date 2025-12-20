// src/components/EvaluationSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import AddDocumentsForm from "./AddDocumentsForm";
import CostSummary from "./CostSummary";
import InstitutionPicker from "./InstitutionPicker";

function formatDateTime(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function StatusBadge({ variant, children }) {
  const styles =
    variant === "success"
      ? "bg-green-50 text-green-700 border-green-200"
      : variant === "warning"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : variant === "danger"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={classNames("px-2.5 py-1 rounded-full border text-xs font-semibold", styles)}>
      {children}
    </span>
  );
}

function MiniPill({ children }) {
  return (
    <span className="px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-700 text-xs font-medium">
      {children}
    </span>
  );
}

/**
 * Progress model (simple but effective):
 * - Step 1: Submitted
 * - Step 2: Payment
 * - Step 3: Processing (translation/evaluation)
 * - Step 4: Completed (if you later add delivered/completed status)
 *
 * This is intentionally conservative so it works with your current schema.
 */
function ProgressStepper({ isPaid, needsAction, isCompleted }) {
  const steps = [
    { key: "submitted", label: "Submitted" },
    { key: "paid", label: "Paid" },
    { key: "processing", label: needsAction ? "Action Needed" : "Processing" },
    { key: "done", label: "Completed" },
  ];

  // Determine active index
  let active = 0;
  if (isPaid) active = 1;
  if (isPaid && !needsAction) active = 2;
  if (isCompleted) active = 3;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        {steps.map((s, idx) => {
          const isActive = idx <= active;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={classNames(
                  "h-2.5 w-2.5 rounded-full border",
                  isActive ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
                )}
                aria-hidden="true"
              />
              <span className={classNames("text-xs", isActive ? "text-gray-900 font-medium" : "text-gray-500")}>
                {s.label}
              </span>
              {idx < steps.length - 1 && (
                <div className={classNames("h-px w-10", isActive ? "bg-blue-200" : "bg-gray-200")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 w-full">
          <div className="h-4 w-44 bg-gray-200 rounded" />
          <div className="h-3 w-72 bg-gray-100 rounded" />
        </div>
        <div className="h-8 w-20 bg-gray-100 rounded" />
      </div>
      <div className="mt-4 h-24 w-full bg-gray-50 rounded" />
    </div>
  );
}

export default function EvaluationSection() {
  const apiBase = process.env.REACT_APP_API_URL;

  const [submissionMethod, setSubmissionMethod] = useState("digital");
  const [purpose, setPurpose] = useState("education");

  const [requestedInstitutionId, setRequestedInstitutionId] = useState("");
  const [requestedInstitutionName, setRequestedInstitutionName] = useState("");

  const [files, setFiles] = useState([]);
  const [translationFlags, setTranslationFlags] = useState([]);
  const [sourceLanguages, setSourceLanguages] = useState([]);

  const [submissions, setSubmissions] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // popup control (avoid opening twice)
  const checkoutPopupRef = useRef(null);

  const canSubmit = useMemo(() => {
    return !loading && files.length > 0 && !!submissionMethod && !!purpose;
  }, [loading, files.length, submissionMethod, purpose]);

  const fetchSubmissions = async () => {
    setFetching(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/transcripts/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load submissions.");
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load submissions.");
      setSubmissions([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const hasUnpaidTranslation = (submission) => {
    return (submission.documents || []).some(
      (d) => d.needsTranslation && !d.translationPaid
    );
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setTranslationFlags(selectedFiles.map(() => false));
    setSourceLanguages(selectedFiles.map(() => "french"));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("submissionMethod", submissionMethod);
    formData.append("purpose", purpose);
    formData.append("requestedInstitutionId", requestedInstitutionId || "");
    formData.append("requestedInstitutionName", requestedInstitutionName || "");
    formData.append("translationFlags", JSON.stringify(translationFlags));
    formData.append("sourceLanguages", JSON.stringify(sourceLanguages));
    files.forEach((file) => formData.append("files", file));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/transcripts/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit evaluation package.");

      setFiles([]);
      setTranslationFlags([]);
      setSourceLanguages([]);

      await fetchSubmissions();
      alert("Evaluation package submitted successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to submit evaluation package.");
    } finally {
      setLoading(false);
    }
  };

  // After payment: allow deletes ONLY for docs that are NOT translationPaid.
  const handleDeleteFile = async (submission, index) => {
    const doc = submission?.documents?.[index];

    if (doc?.translationPaid === true) {
      alert("This document’s translation has already been paid, so it cannot be deleted.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this file?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${apiBase}/api/transcripts/${submission.submissionId}/document/${index}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete document.");

      alert(data?.message || "Document removed.");
      await fetchSubmissions();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete document.");
    }
  };

  const openPopup = (name) => {
    if (!checkoutPopupRef.current || checkoutPopupRef.current.closed) {
      checkoutPopupRef.current = window.open(
        "about:blank",
        name,
        "popup,width=520,height=720"
      );
    }
    return checkoutPopupRef.current;
  };

  const handleProceedToPayment = async (submission) => {
    const isPaid = submission?.paymentStatus === "paid";
    if (isPaid) {
      alert("This submission is already paid.");
      return;
    }

    const token = localStorage.getItem("token");
    const popup = openPopup("anacaona_eval_checkout");

    try {
      const res = await fetch(`${apiBase}/api/payments/create-evaluation-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ submissionId: submission.submissionId }),
      });

      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "Failed to create payment session.");

      popup.location.href = data.url;
    } catch (err) {
      console.error(err);
      popup?.close();
      alert(err.message || "Failed to create payment session.");
    }
  };

  const handlePayAdditionalTranslation = async (submissionId) => {
    const token = localStorage.getItem("token");
    const popup = openPopup("anacaona_eval_checkout");

    try {
      const res = await fetch(`${apiBase}/api/payments/create-additional-translation-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ submissionId }),
      });

      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "Failed to create translation checkout.");

      popup.location.href = data.url;
    } catch (err) {
      console.error(err);
      popup?.close();
      alert(err.message || "Failed to start translation payment.");
    }
  };

  // Summary counters for the top strip
  const summary = useMemo(() => {
    const active = submissions.length;
    const completed = submissions.filter((s) => s?.status === "completed" || s?.status === "delivered").length; // optional future statuses
    const actionRequired = submissions.filter((s) => {
      const unpaidTranslation = hasUnpaidTranslation(s);
      const unpaidEval = s?.paymentStatus !== "paid";
      return unpaidTranslation || unpaidEval;
    }).length;

    return { active, actionRequired, completed };
  }, [submissions]);

  return (
    <div className="space-y-10">
      {/* SECTION 0: Summary strip */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Evaluation Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Track your evaluation packages, payments, and translation status in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-500">Active submissions</div>
              <div className="text-lg font-semibold text-gray-900">{summary.active}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-500">Awaiting your action</div>
              <div className="text-lg font-semibold text-gray-900">{summary.actionRequired}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-500">Completed</div>
              <div className="text-lg font-semibold text-gray-900">{summary.completed}</div>
            </div>

            <button
              type="button"
              onClick={fetchSubmissions}
              disabled={fetching}
              className={classNames(
                "rounded-xl border px-4 py-3 text-sm font-semibold",
                fetching ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
              )}
            >
              {fetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 1: Create new submission */}
      <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-900">Start a New Evaluation Submission</h3>
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
              Step 1: Upload documents
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-2 leading-snug">
            Upload your diploma/transcripts and select your evaluation purpose. You can attach supporting documents later
            under “Your Submissions.”
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Submission Method
              </label>
              <select
                name="submissionMethod"
                value={submissionMethod}
                onChange={(e) => setSubmissionMethod(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Method</option>
                <option value="sealed">Sealed package from my school</option>
                <option value="digital">Digital approval by my school or MENFP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose of Evaluation
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="education">Education (University / College)</option>
                <option value="immigration">Immigration / Visa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Where should we send the result?
            </label>
            <InstitutionPicker
              valueId={requestedInstitutionId}
              valueName={requestedInstitutionName}
              onChange={({ id, name }) => {
                setRequestedInstitutionId(id);
                setRequestedInstitutionName(name);
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              You can leave this blank if you will decide later.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Your Documents
            </label>

            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer
                         file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {files.length > 0 && (
              <div className="mt-4 space-y-3">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 break-all">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Choose translation options (only if needed).
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-700 font-medium">Needs Translation?</span>
                        <select
                          value={translationFlags[index] ? "yes" : "no"}
                          onChange={(e) => {
                            const updated = [...translationFlags];
                            updated[index] = e.target.value === "yes";
                            setTranslationFlags(updated);

                            if (e.target.value !== "yes") {
                              const updatedLangs = [...sourceLanguages];
                              updatedLangs[index] = "french";
                              setSourceLanguages(updatedLangs);
                            }
                          }}
                          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>

                      {translationFlags[index] && (
                        <div className="flex flex-col">
                          <span className="text-gray-700 font-medium">Source Language</span>
                          <select
                            value={sourceLanguages[index]}
                            onChange={(e) => {
                              const updatedLangs = [...sourceLanguages];
                              updatedLangs[index] = e.target.value;
                              setSourceLanguages(updatedLangs);
                            }}
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="french">French</option>
                            <option value="spanish">Spanish</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className={classNames(
                "inline-flex items-center justify-center rounded-lg px-4 py-2 text-white text-sm font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-500",
                canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
              )}
            >
              {loading ? "Submitting…" : "Submit New Package"}
            </button>

            <span className="text-xs text-gray-500">
              Tip: PDFs are best for accurate page counting.
            </span>
          </div>
        </form>
      </section>

      {/* SECTION 2: Existing Submissions */}
      <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <header className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Your Submissions</h3>
          <p className="text-sm text-gray-600 leading-snug mt-1">
            You can upload additional documents anytime. Deletes are blocked only for documents with paid translation.
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {fetching ? (
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <div className="text-lg font-semibold text-gray-900">No submissions yet</div>
            <p className="text-sm text-gray-600 mt-2">
              Start a new evaluation submission above to track your progress, translation needs, and payment status.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => {
              const isPaid = submission?.paymentStatus === "paid";
              const needsAction = hasUnpaidTranslation(submission) || !isPaid;

              // Optional future completion status
              const isCompleted =
                submission?.status === "completed" ||
                submission?.status === "delivered";

              const updatedAt =
                submission?.updatedAt ||
                submission?.submittedAt ||
                submission?.createdAt;

              return (
                <div
                  key={submission._id}
                  className="rounded-2xl border border-gray-200 bg-white p-5"
                >
                  {/* Card header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base font-semibold text-gray-900">
                          Submission #{submission.submissionId}
                        </div>

                        {isCompleted ? (
                          <StatusBadge variant="success">Completed</StatusBadge>
                        ) : needsAction ? (
                          <StatusBadge variant="warning">Action Required</StatusBadge>
                        ) : isPaid ? (
                          <StatusBadge variant="success">Paid</StatusBadge>
                        ) : (
                          <StatusBadge variant="warning">Pending Payment</StatusBadge>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Last updated: {formatDateTime(updatedAt)}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <MiniPill>
                          {submission.purpose === "education" ? "Education" : "Immigration"}
                        </MiniPill>
                        <MiniPill>
                          {submission.submissionMethod === "sealed" ? "Sealed Package" : "Digital"}
                        </MiniPill>
                        {submission?.requestedInstitutionName ? (
                          <MiniPill>To: {submission.requestedInstitutionName}</MiniPill>
                        ) : null}
                      </div>

                      <ProgressStepper
                        isPaid={isPaid}
                        needsAction={needsAction}
                        isCompleted={isCompleted}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => handleProceedToPayment(submission)}
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Pay Evaluation
                        </button>
                      )}

                      {hasUnpaidTranslation(submission) && (
                        <button
                          type="button"
                          onClick={() => handlePayAdditionalTranslation(submission.submissionId)}
                          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                          Pay Translation
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Documents table */}
                  <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm text-gray-700">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Filename</th>
                          <th className="text-left px-3 py-2 font-medium">Pages</th>
                          <th className="text-left px-3 py-2 font-medium">Translation</th>
                          <th className="text-left px-3 py-2 font-medium">Paid?</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>

                      <tbody className="bg-white">
                        {(submission.documents || []).length === 0 ? (
                          <tr>
                            <td className="px-3 py-4 text-sm text-gray-500" colSpan={5}>
                              No documents found for this submission.
                            </td>
                          </tr>
                        ) : (
                          (submission.documents || []).map((doc, idx) => {
                            const preventDelete = doc?.translationPaid === true;

                            return (
                              <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                                <td className="px-3 py-2 break-all font-medium text-gray-900">
                                  {doc.filename}
                                </td>

                                <td className="px-3 py-2">{doc.pageCount || "—"}</td>

                                <td className="px-3 py-2">
                                  {doc.needsTranslation ? (
                                    <span className="text-indigo-700 font-medium">Needed</span>
                                  ) : (
                                    <span className="text-gray-600">No</span>
                                  )}
                                </td>

                                <td className="px-3 py-2">
                                  {doc.needsTranslation ? (
                                    doc.translationPaid ? (
                                      <span className="text-green-700 font-semibold">Yes</span>
                                    ) : (
                                      <span className="text-yellow-700 font-semibold">No</span>
                                    )
                                  ) : (
                                    "—"
                                  )}
                                </td>

                                <td className="px-3 py-2 text-right">
                                  <button
                                    onClick={() => handleDeleteFile(submission, idx)}
                                    disabled={preventDelete}
                                    className={classNames(
                                      "text-xs font-semibold",
                                      preventDelete
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-red-600 hover:underline"
                                    )}
                                    title={
                                      preventDelete
                                        ? "Translation already paid for this document; deletion disabled."
                                        : "Delete document"
                                    }
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Upload more + pricing summary */}
                  <div className="mt-5 space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Add more documents</div>
                          <p className="text-xs text-gray-600 mt-1">
                            Upload supporting pages anytime. If new files need translation, you’ll pay only for unpaid pages.
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <AddDocumentsForm
                          submissionId={submission.submissionId}
                          onUploaded={fetchSubmissions}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <CostSummary
                        submission={submission}
                        onProceedToPayment={() => handleProceedToPayment(submission)}
                        onPayAdditionalTranslation={() =>
                          handlePayAdditionalTranslation(submission.submissionId)
                        }
                      />

                      {hasUnpaidTranslation(submission) && (
                        <p className="text-xs text-gray-500 mt-2">
                          This submission includes newly-added documents that require translation. You will be charged only for unpaid pages.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
