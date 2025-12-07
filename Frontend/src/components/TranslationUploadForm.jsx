import React, { useState } from "react";
import { countPages } from "./helpers/countPages";
import { TRANSLATION_FEE_PER_PAGE } from "./constants/pricing";

const TranslationUploadForm = ({ onSubmitted }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [needNotary, setNeedNotary] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    const processedDocs = [];
    for (const file of files) {
      const pageCount = await countPages(file);
      processedDocs.push({ file, pageCount });
    }

    setDocuments(processedDocs);
    setSelectedFiles(files);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceLanguage || !targetLanguage || !deliveryMethod || documents.length === 0) {
      alert("Please fill all fields and upload files.");
      return;
    }

    const formData = new FormData();
    documents.forEach((doc) => formData.append("files", doc.file));
    formData.append("sourceLanguage", sourceLanguage);
    formData.append("targetLanguage", targetLanguage);
    formData.append("needNotary", needNotary);
    formData.append("deliveryMethod", deliveryMethod);
    formData.append("pageCounts", JSON.stringify(documents.map(d => d.pageCount)));
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/translation-requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      alert("Documents submitted successfully!");

      // Reset form
      setSelectedFiles([]);
      setDocuments([]);
      setSourceLanguage("");
      setTargetLanguage("");
      setNeedNotary(false);
      setDeliveryMethod("");

      onSubmitted();
    } catch (err) {
      console.error(err);
      alert("Error submitting documents.");
    } finally {
      setLoading(false);
    } window.location.reload(true);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-yellow-100 space-y-4 mb-8">
      <h3 className="text-lg font-semibold">Submit New Translation Request</h3>

      <div>
        <label className="block text-sm">Source Language</label>
        <select
          value={sourceLanguage}
          onChange={(e) => setSourceLanguage(e.target.value)}
          className="w-full border rounded"
        >
          <option value="">Choose...</option>
          <option value="french">French</option>
          <option value="spanish">Spanish</option>
        </select>
      </div>

      <div>
        <label className="block text-sm">Target Language</label>
        <select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          className="w-full border rounded"
        >
          <option value="">Choose...</option>
          <option value="english">English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm">Delivery Method</label>
        <select
          value={deliveryMethod}
          onChange={(e) => setDeliveryMethod(e.target.value)}
          className="w-full border rounded"
        >
          <option value="">Select...</option>
          <option value="email">Email</option>
          <option value="hard copy">Hard Copy</option>
          <option value="both">Both</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="notary"
          checked={needNotary}
          onChange={(e) => setNeedNotary(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="notary">Need Notary Service</label>
      </div>

      <div>
        <label className="block text-sm">Upload Files</label>
        <input
          type="file"
          multiple
          accept="application/pdf,image/*"
          onChange={handleFileChange}
        />
      </div>

      {uploading && <p className="text-blue-500">Counting pages...</p>}

      {documents.length > 0 && (
        <ul className="list-disc pl-5 text-sm">
          {documents.map((d, i) => (
            <li key={i}>
              {d.file.name} – {d.pageCount} page(s)
            </li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={loading || uploading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        {loading ? "Submitting..." : "Submit Documents"}
      </button>
    </form>
  );
};

export default TranslationUploadForm;
