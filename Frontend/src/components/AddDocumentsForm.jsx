// src/components/AddDocumentsForm.jsx

import React, { useMemo, useState } from "react";

export default function AddDocumentsForm({ submissionId, onUploaded }) {
  const apiBase = process.env.REACT_APP_API_URL;

  const [files, setFiles] = useState([]);
  const [translationFlags, setTranslationFlags] = useState([]); // "yes" | "no"
  const [sourceLanguages, setSourceLanguages] = useState([]);   // "french" | "spanish"
  const [uploading, setUploading] = useState(false);

  const canSubmit = useMemo(() => {
    return !uploading && files.length > 0;
  }, [uploading, files.length]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setTranslationFlags(selected.map(() => "no"));
    setSourceLanguages(selected.map(() => "french"));
  };

  const updateTranslationFlag = (idx, value) => {
    setTranslationFlags((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

    if (value === "no") {
      setSourceLanguages((prev) => {
        const next = [...prev];
        next[idx] = "french";
        return next;
      });
    } else {
      setSourceLanguages((prev) => {
        const next = [...prev];
        next[idx] = next[idx] || "french";
        return next;
      });
    }
  };

  const updateLanguage = (idx, value) => {
    setSourceLanguages((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const resetForm = () => {
    setFiles([]);
    setTranslationFlags([]);
    setSourceLanguages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setUploading(true);

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("translationFlags", JSON.stringify(translationFlags));
      formData.append("sourceLanguages", JSON.stringify(sourceLanguages));

      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/transcripts/add-to-submission/${submissionId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed.");

      alert("Documents added successfully!");
      resetForm();

      if (typeof onUploaded === "function") {
        await onUploaded();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">
        Add Documents to Submission #{submissionId}
      </h3>
      <p className="text-xs text-gray-500 mt-1">
        You can upload additional documents even after payment. Deletions may be disabled after payment.
      </p>

      <div className="mt-4">
        <input
          type="file"
          multiple
          accept=".pdf,image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer
                     file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={uploading}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-sm font-medium text-gray-900 break-all">{file.name}</div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Needs Translation?
                  </label>
                  <select
                    value={translationFlags[idx] || "no"}
                    onChange={(e) => updateTranslationFlag(idx, e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={uploading}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                {translationFlags[idx] === "yes" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Source Language
                    </label>
                    <select
                      value={sourceLanguages[idx] || "french"}
                      onChange={(e) => updateLanguage(idx, e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={uploading}
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

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white
            ${canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
        >
          {uploading ? "Uploading..." : "Upload Documents"}
        </button>

        {files.length > 0 && (
          <button
            type="button"
            onClick={resetForm}
            disabled={uploading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
