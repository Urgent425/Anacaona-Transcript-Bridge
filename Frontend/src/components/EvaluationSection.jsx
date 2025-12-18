// src/components/EvaluationSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import AddDocumentsForm from "./AddDocumentsForm";
import CostSummary from "./CostSummary";
import InstitutionPicker from "./InstitutionPicker";

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
// If doc.translationPaid === true => cannot delete (already paid translation).
const handleDeleteFile = async (submission, index) => {
  const doc = submission?.documents?.[index];

  // If translation was already paid for this document, block deletion
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

  return (
    <div className="space-y-10">
      {/* SECTION 1: Create new submission */}
      <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-start gap-2">
            <span>Start a New Evaluation Submission</span>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-300">
              Step 1: Upload documents
            </span>
          </h2>
          <p className="text-sm text-gray-600 mt-1 leading-snug">
            Upload your diploma / transcripts and tell us how they will be sent.
            You can attach supporting pages later in “Your Submissions.”
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
              className="block w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer
                         file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {files.length > 0 && (
              <div className="mt-4 space-y-3">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="text-sm font-medium text-gray-800 break-all">
                      {file.name}
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-white text-sm font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-500
                ${canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
            >
              {loading ? "Submitting..." : "Submit New Package"}
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 2: Existing Submissions */}
      <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Your Submissions
            </h3>
            <p className="text-sm text-gray-600 leading-snug mt-1">
              After payment, deletes are disabled, but uploads remain allowed.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSubmissions}
            disabled={fetching}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold
              ${fetching ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"}`}
          >
            {fetching ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {fetching ? (
          <div className="text-sm text-gray-600">Loading submissions…</div>
        ) : submissions.length === 0 ? (
          <p className="text-gray-500 text-sm">No submissions yet.</p>
        ) : (
          <div className="space-y-8">
            {submissions.map((submission) => {
              const isPaid = submission.paymentStatus === "paid";
              const preventDelete = isPaid;

              return (
                <div
                  key={submission._id}
                  className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div>
                      <div className="text-sm text-gray-500">Submission ID</div>
                      <div className="text-base font-semibold text-gray-900">
                        #{submission.submissionId}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full border font-medium ${
                          isPaid
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {isPaid ? "Paid" : "Pending Payment"}
                      </span>

                      <span className="px-2 py-1 rounded-full border border-gray-300 bg-white text-gray-700 font-medium">
                        {submission.purpose === "education" ? "Education" : "Immigration"}
                      </span>

                      <span className="px-2 py-1 rounded-full border border-gray-300 bg-white text-gray-700 font-medium">
                        {submission.submissionMethod === "sealed" ? "Sealed Package" : "Digital"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-sm text-gray-700">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Filename</th>
                          <th className="text-left px-3 py-2 font-medium">Pages</th>
                          <th className="text-left px-3 py-2 font-medium">Needs Translation</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {(submission.documents || []).map((doc, idx) => {
                          // Delete is blocked ONLY if this document's translation was already paid
                          const preventDelete = doc?.translationPaid === true;

                          return (
                            <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                              <td className="px-3 py-2 break-all font-medium text-gray-900">
                                {doc.filename}
                              </td>

                              <td className="px-3 py-2">{doc.pageCount || "—"}</td>

                              <td className="px-3 py-2">
                                {doc.needsTranslation ? "Yes" : "No"}
                              </td>

                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() => handleDeleteFile(submission, idx)}
                                  disabled={preventDelete}
                                  className={`text-xs font-medium ${
                                    preventDelete
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-red-600 hover:underline"
                                  }`}
                                  title={
                                    preventDelete
                                      ? "This document’s translation has already been paid and cannot be deleted."
                                      : "Delete document"
                                  }
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6">
                    <AddDocumentsForm
                      submissionId={submission.submissionId}
                      onUploaded={fetchSubmissions}
                     
                    />

                    {isPaid && (
                      <p className="text-xs text-gray-500 mt-2">
                        This evaluation is paid. You can still upload additional requested documents.
                        If new documents require translation, you can pay only for new pages.
                      </p>
                    )}
                  </div>

                  <div className="mt-6">
                    <CostSummary
                      submission={submission}
                      onProceedToPayment={() => handleProceedToPayment(submission)}
                      onPayAdditionalTranslation={() => handlePayAdditionalTranslation(submission.submissionId)}
                    />

                    {hasUnpaidTranslation(submission) && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => handlePayAdditionalTranslation(submission.submissionId)}
                          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                          Pay Additional Translation
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          This submission has newly-added documents that require translation.
                          You will be charged only for unpaid pages.
                        </p>
                      </div>
                    )}
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
