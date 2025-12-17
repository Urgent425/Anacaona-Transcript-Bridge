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

  // ---------------------------
  // File selection (new package)
  // ---------------------------
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);

    // default choices per file
    setTranslationFlags(selectedFiles.map(() => false));
    setSourceLanguages(selectedFiles.map(() => "french"));
  };

  // ---------------------------
  // Submit a new evaluation package
  // ---------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("submissionMethod", submissionMethod);
    formData.append("purpose", purpose);

    // Optional: send destination fields if your backend supports them
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

      // reset draft
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

  // ---------------------------
  // Delete a document
  // Rule:
  // - If system hard-locked: no edits
  // - If paid: no deletes (but uploads allowed)
  // ---------------------------
  const handleDeleteFile = async (submission, index) => {
    const isPaid = submission?.paymentStatus === "paid";
    const hardLocked = !!submission?.locked;

    if (hardLocked) {
      alert("This submission is locked by the system. Please contact support.");
      return;
    }
    if (isPaid) {
      alert("This evaluation is already paid. Documents cannot be deleted, but you can add new documents if requested.");
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

  // ---------------------------
  // Stripe checkout (popup)
  // ---------------------------
  const handleProceedToPayment = async (submission) => {
    const isPaid = submission?.paymentStatus === "paid";
    const token = localStorage.getItem("token");

    if (isPaid) {
      alert("This submission is already paid.");
      return;
    }

    // open popup once (or reuse existing)
    if (!checkoutPopupRef.current || checkoutPopupRef.current.closed) {
      checkoutPopupRef.current = window.open(
        "about:blank",
        "anacaona_eval_checkout",
        "popup,width=520,height=720"
      );
    }

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
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Failed to create payment session.");
      }

      checkoutPopupRef.current.location.href = data.url;
    } catch (err) {
      console.error(err);
      if (checkoutPopupRef.current && !checkoutPopupRef.current.closed) {
        checkoutPopupRef.current.close();
      }
      alert(err.message || "Failed to create payment session.");
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
            {/* Submission Method */}
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
              <p className="text-xs text-gray-500 mt-1">
                “Sealed package” means the school gives you an official sealed envelope.
                “Digital” means the school or MENFP will confirm electronically.
              </p>
            </div>

            {/* Purpose */}
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

          {/* Institution Picker */}
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
              Example: WES, a university, or an immigration office.
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Your Documents
            </label>
            <p className="text-xs text-gray-500 mb-2 leading-snug">
              Accepted formats: PDF and images (JPG/PNG). You can mark which files need translation.
            </p>

            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                            // keep a default language; only used if translation = yes
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

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-white text-sm font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-500
                ${canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
            >
              {loading ? "Submitting..." : "Submit New Package"}
            </button>

            <p className="text-xs text-gray-500 mt-2 leading-snug">
              After submission, you can add supporting pages below. After payment, deletes are disabled, but uploads remain allowed unless system-locked.
            </p>
          </div>
        </form>
      </section>

      {/* SECTION 2: Existing Submissions */}
      <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-start gap-2">
              <span>Your Submissions</span>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-300">
                Step 2: Review & Pay
              </span>
            </h3>
            <p className="text-sm text-gray-600 leading-snug mt-1">
              Each package is separate. After payment, you can still upload additional requested documents.
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
              const hardLocked = !!submission.locked; // system lock only
              const preventDelete = isPaid || hardLocked;

              return (
                <div
                  key={submission._id}
                  className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                >
                  {/* Top row */}
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

                      {hardLocked && (
                        <span className="px-2 py-1 rounded-full border border-gray-300 bg-white text-gray-700 font-medium">
                          Locked (System)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm text-gray-700">
                    <div className="space-y-1">
                      <p>
                        <span className="font-medium text-gray-900">Approval Status:</span>{" "}
                        {submission.approvalStatus || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Final Status:</span>{" "}
                        {submission.finalStatus || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Created:</span>{" "}
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {submission.submissionMethod === "sealed" && (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 leading-snug">
                        <p className="text-yellow-800 font-semibold text-sm">
                          Sealed Package Instructions
                        </p>
                        <ul className="list-disc ml-4 text-[13px] text-yellow-800">
                          <li>Get the official sealed envelope from your school or MENFP.</li>
                          <li>Ship it to Anacaona Transcript Bridge or directly to the destination (ex: WES).</li>
                          <li>Write your Submission ID on the envelope or cover letter.</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-sm text-gray-700">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Filename</th>
                          <th className="text-left px-3 py-2 font-medium">Pages</th>
                          <th className="text-left px-3 py-2 font-medium">Needs Translation</th>
                          <th className="text-left px-3 py-2 font-medium">Added On</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {(submission.documents || []).map((doc, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                            <td className="px-3 py-2 break-all font-medium text-gray-900">
                              {doc.filename}
                            </td>
                            <td className="px-3 py-2">{doc.pageCount || "—"}</td>
                            <td className="px-3 py-2">{doc.needsTranslation ? "Yes" : "No"}</td>
                            <td className="px-3 py-2 text-gray-500">
                              {new Date(submission.createdAt).toLocaleDateString()}
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
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add docs: allowed after payment; blocked only if hardLocked */}
                  <div className="mt-6">
                    <AddDocumentsForm
                      submissionId={submission.submissionId}
                      disabled={hardLocked}
                      onUploaded={fetchSubmissions}
                    />

                    {hardLocked && (
                      <p className="text-xs text-gray-500 mt-2">
                        This submission is locked by the system. Please contact support.
                      </p>
                    )}

                    {isPaid && !hardLocked && (
                      <p className="text-xs text-gray-500 mt-2">
                        This evaluation is paid. You can still upload additional requested documents if needed.
                        If new documents require translation, you’ll pay only for the new pages (next step).
                      </p>
                    )}
                  </div>

                  {/* Pricing / payment */}
                  <div className="mt-6">
                    <CostSummary
                      submission={submission}
                      onProceedToPayment={() => handleProceedToPayment(submission)}
                    />
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
