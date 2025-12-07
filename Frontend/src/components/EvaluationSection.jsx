//src/components/EvaluationSection
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import AddDocumentsForm from "./AddDocumentsForm";
import CostSummary from "./CostSummary";
import InstitutionPicker from "./InstitutionPicker";

export default function EvaluationSection() {
  const [submissionMethod, setSubmissionMethod] = useState("digital");
  const [purpose, setPurpose] = useState("education");
  const [requestedInstitutionId, setRequestedInstitutionId] = useState("");
  const [requestedInstitutionName, setRequestedInstitutionName] = useState("");
  const [files, setFiles] = useState([]);
  const [translationFlags, setTranslationFlags] = useState([]);
  const [sourceLanguages, setSourceLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  // handle new-uploaded files before submit
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setTranslationFlags(selectedFiles.map(() => false));
    setSourceLanguages(selectedFiles.map(() => "french"));
  };

  // submit a brand new evaluation package
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    setLoading(true);
    const submissionId = uuidv4();
    const formData = new FormData();
    formData.append("submissionMethod", submissionMethod);
    formData.append("purpose", purpose);
    formData.append("submissionId", submissionId);
    formData.append("translationFlags", JSON.stringify(translationFlags));
    formData.append("sourceLanguages", JSON.stringify(sourceLanguages));
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/transcripts/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("Evaluation package submitted successfully!");
        // clear draft state
        setFiles([]);
        setTranslationFlags([]);
        setSourceLanguages([]);
        // reload list
        await fetchSubmissions();
      } else {
        alert(data.error || "Failed to submit evaluation package.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit evaluation package.");
    } finally {
      setLoading(false);
    }
  };

  // fetch existing submissions
  const fetchSubmissions = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/transcripts/mine", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSubmissions(data || []);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // delete a single document from an existing submission
  const handleDeleteFile = async (submissionId, index) => {
    const token = localStorage.getItem("token");
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this file?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/transcripts/${submissionId}/document/${index}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        await fetchSubmissions();
      } else {
        alert(data.error || "Failed to delete document.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete document.");
    }
  };

  // Stripe checkout for a given submission
  const handleProceedToPayment = async (submissionId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        "http://localhost:5000/api/payments/create-evaluation-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ submissionId }),
        }
      );
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create payment session.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create payment session.");
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
            You can always attach supporting pages later in “Your Submissions.”
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row: submission method + purpose */}
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
                <option value="digital">
                  Digital approval by my school or MENFP
                </option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                “Sealed package” means the school gives you an official sealed
                envelope. “Digital” means the school or MENFP will confirm
                electronically.
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
              Accepted formats: PDF and images (JPG/PNG). You can mark which
              pages need translation.
            </p>

            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Per-file translation controls */}
            {files.length > 0 && (
              <div className="mt-4 space-y-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="text-sm font-medium text-gray-800 break-all">
                      {file.name}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-700 font-medium">
                          Needs Translation?
                        </span>
                        <select
                          value={translationFlags[index] ? "yes" : "no"}
                          onChange={(e) => {
                            const updated = [...translationFlags];
                            updated[index] = e.target.value === "yes";
                            setTranslationFlags(updated);
                          }}
                          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>

                      {translationFlags[index] && (
                        <div className="flex flex-col">
                          <span className="text-gray-700 font-medium">
                            Source Language
                          </span>
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
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loading ? "Submitting..." : "Submit New Package"}
            </button>
            <p className="text-xs text-gray-500 mt-2 leading-snug">
              After submission, you'll see the package below. You can still add
              missing pages or supporting docs before you pay.
            </p>
          </div>
        </form>
      </section>

      {/* SECTION 2: Existing Submissions */}
      <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <header className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-start gap-2">
            <span>Your Submissions</span>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-300">
              Step 2: Review & Pay
            </span>
          </h3>
          <p className="text-sm text-gray-600 leading-snug">
            Each package below is its own request. You can keep adding pages to
            that package until payment. After payment, it becomes locked.
          </p>
        </header>

        {submissions.length === 0 ? (
          <p className="text-gray-500 text-sm">No submissions yet.</p>
        ) : (
          <div className="space-y-8">
            {submissions.map((submission) => (
              <div
                key={submission._id}
                className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
              >
                {/* Top row: ID and status */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div>
                    <div className="text-sm text-gray-500">
                      Submission ID
                    </div>
                    <div className="text-base font-semibold text-gray-900">
                      #{submission.submissionId}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`px-2 py-1 rounded-full border font-medium ${
                        submission.paymentStatus === "paid"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }`}
                    >
                      {submission.paymentStatus === "paid"
                        ? "Paid"
                        : "Pending Payment"}
                    </span>

                    <span className="px-2 py-1 rounded-full border border-gray-300 bg-white text-gray-700 font-medium">
                      {submission.purpose === "education"
                        ? "Education"
                        : "Immigration"}
                    </span>

                    <span className="px-2 py-1 rounded-full border border-gray-300 bg-white text-gray-700 font-medium">
                      {submission.submissionMethod === "sealed"
                        ? "Sealed Package"
                        : "Digital"}
                    </span>
                  </div>
                </div>

                {/* Meta info */}
                <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm text-gray-700">
                  <div className="space-y-1">
                    <p>
                      <span className="font-medium text-gray-900">
                        Approval Status:
                      </span>{" "}
                      {submission.approvalStatus || "—"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        Final Status:
                      </span>{" "}
                      {submission.finalStatus || "—"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        Created:
                      </span>{" "}
                      {new Date(
                        submission.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {submission.submissionMethod === "sealed" && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 leading-snug">
                      <p className="text-yellow-800 font-semibold text-sm">
                        Sealed Package Instructions
                      </p>
                      <ul className="list-disc ml-4 text-[13px] text-yellow-800">
                        <li>
                          Get the official sealed envelope from
                          your school or MENFP.
                        </li>
                        <li>
                          Ship it to Anacaona Transcript
                          Bridge or directly to the
                          destination (ex: WES).
                        </li>
                        <li>
                          Write your Submission ID on the
                          envelope or cover letter.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Documents table */}
                <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="w-full text-sm text-gray-700">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">
                          Filename
                        </th>
                        <th className="text-left px-3 py-2 font-medium">
                          Pages
                        </th>
                        <th className="text-left px-3 py-2 font-medium">
                          Needs Translation
                        </th>
                        <th className="text-left px-3 py-2 font-medium">
                          Added On
                        </th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {submission.documents.map((doc, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-100 last:border-b-0"
                        >
                          <td className="px-3 py-2 break-all font-medium text-gray-900">
                            {doc.filename}
                          </td>
                          <td className="px-3 py-2">
                            {doc.pageCount || "—"}
                          </td>
                          <td className="px-3 py-2">
                            {doc.needsTranslation ? "Yes" : "No"}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {new Date(
                              submission.createdAt
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() =>
                                handleDeleteFile(
                                  submission.submissionId,
                                  idx
                                )
                              }
                              className="text-red-600 text-xs font-medium hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add more docs to this submission */}
                <div className="mt-6">
                  <AddDocumentsForm submissionId={submission.submissionId} />
                </div>

                {/* Pricing / payment */}
                <div className="mt-6">
                  <CostSummary
                    submission={submission}
                    onProceedToPayment={() =>
                      handleProceedToPayment(
                        submission.submissionId
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
