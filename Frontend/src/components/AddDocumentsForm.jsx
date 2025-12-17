
// src/components/AddDocumentsForm.jsx
import React, { useMemo, useState } from "react";

export default function AddDocumentsForm({
  submissionId,
  disabled = false,
  onUploaded,
}) {
  const [files, setFiles] = useState([]);
  const [translationFlags, setTranslationFlags] = useState([]); // "yes" | "no"
  const [sourceLanguages, setSourceLanguages] = useState([]);   // "french" | "spanish"
  const [uploading, setUploading] = useState(false);

  const canSubmit = useMemo(() => {
    return !disabled && !uploading && files.length > 0;
  }, [disabled, uploading, files.length]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);

    // Backend expects yes/no strings
    setTranslationFlags(selected.map(() => "no"));
    setSourceLanguages(selected.map(() => "french"));
  };

  const updateTranslationFlag = (idx, value) => {
    // value is "yes" | "no"
    setTranslationFlags((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

    // If switching to "no", reset language (keeps payload clean)
    if (value === "no") {
      setSourceLanguages((prev) => {
        const next = [...prev];
        next[idx] = "french";
        return next;
      });
    } else {
      // If switching to "yes", ensure there is a language value at idx
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
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/transcripts/add-to-submission/${submissionId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed.");

      alert("Documents added successfully!");

      // Reset form
      setFiles([]);
      setTranslationFlags([]);
      setSourceLanguages([]);

      // Refresh parent list
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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mt-4">
      <h3 className="text-lg font-semibold mb-4">
        Add Documents to Submission #{submissionId}
      </h3>

      {disabled && (
        <div className="mb-3 rounded-md bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
          Uploads are currently disabled for this submission.
        </div>
      )}

      <input
        type="file"
        multiple
        accept=".pdf,image/*"
        onChange={handleFileChange}
        className="mb-4 block w-full"
        disabled={disabled || uploading}
      />

      {files.map((file, idx) => (
        <div key={`${file.name}-${idx}`} className="mb-3">
          <label className="block font-medium break-all">{file.name}</label>

          <select
            value={translationFlags[idx] || "no"}
            onChange={(e) => updateTranslationFlag(idx, e.target.value)}
            className="border p-2 rounded w-full mt-1"
            disabled={disabled || uploading}
          >
            <option value="no">Needs Translation: No</option>
            <option value="yes">Needs Translation: Yes</option>
          </select>

          {translationFlags[idx] === "yes" && (
            <select
              value={sourceLanguages[idx] || "french"}
              onChange={(e) => updateLanguage(idx, e.target.value)}
              className="border p-2 rounded w-full mt-1"
              disabled={disabled || uploading}
            >
              <option value="french">French</option>
              <option value="spanish">Spanish</option>
            </select>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`px-4 py-2 rounded text-white ${
          canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {uploading ? "Uploading..." : "Upload Documents"}
      </button>

      <p className="text-xs text-gray-500 mt-2">
        You can add documents even after payment. If new documents require translation,
        you’ll pay only for the new pages.
      </p>
    </form>
  );
}
