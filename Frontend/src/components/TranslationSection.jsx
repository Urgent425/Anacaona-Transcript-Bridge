// TranslationSection.jsx
import React, { useState } from "react";

const TranslationSection = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sourceLanguage, setSourceLanguage] = useState("");

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceLanguage || selectedFiles.length === 0) {
      alert("Please select a source language and at least one file.");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    formData.append("sourceLanguage", sourceLanguage);

    try {
      // Replace with your real endpoint
      const res = await fetch("/api/translations", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      alert("Files submitted for translation successfully!");
      setSelectedFiles([]);
      setSourceLanguage("");
    } catch (err) {
      console.error(err);
      alert("Error submitting files.");
    }
  };

  return (
    <div className="border rounded-xl p-6 shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-4">Translation Only Service</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Source Language
          </label>
          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="">Choose language...</option>
            <option value="french">French</option>
            <option value="spanish">Spanish</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Documents
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {selectedFiles.length > 0 && (
          <ul className="text-sm text-gray-600 list-disc pl-5">
            {selectedFiles.map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit for Translation
        </button>
      </form>
    </div>
  );
};

export default TranslationSection;
