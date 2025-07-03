// TranslationSection.jsx
import React, { useState, useEffect } from "react";

const TranslationSection = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [needNotary, setNeedNotary] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load existing submissions when the component mounts
  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/translation-requests/mine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load submissions.");
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceLanguage || !deliveryMethod || selectedFiles.length === 0) {
      alert("Please fill all required fields.");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    formData.append("sourceLanguage", sourceLanguage);
    formData.append("targetLanguage", "english"); // default to English
    formData.append("needNotary", needNotary);
    formData.append("deliveryMethod", deliveryMethod);

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/translation-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      alert("Translation request submitted successfully!");

      // Reset form
      setSelectedFiles([]);
      setSourceLanguage("");
      setNeedNotary(false);
      setDeliveryMethod("");

      // Refresh submissions
      await fetchSubmissions();
    } catch (err) {
      console.error(err);
      alert("Error submitting request.");
    } finally {
      setLoading(false);
    }
  };

  //Handle delete documents
    const handleDelete = async (id) => {
      const token = localStorage.getItem("token");
      const confirm = window.confirm("Are you sure you want to delete this document?");
      if (!confirm) return;
  
      try {
        await fetch(`http://localhost:5000/api/translation-requests/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmissions((prev) => Array.isArray(prev) ? prev.filter((s) => s._id !== id) : []);
      } catch (err) {
        alert("Failed to delete document");
      } await fetchSubmissions();
    };

  return (
    <div className="border rounded-xl p-6 shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-4">Translation Only Service</h2>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source Language
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
            Delivery Method
          </label>
          <select
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="">Select delivery method...</option>
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
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="notary" className="ml-2 block text-sm text-gray-700">
            Need Notary Service
          </label>
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
          disabled={loading}
          className={`inline-flex items-center px-4 py-2 ${
            loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
          } border border-transparent rounded-md font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {loading ? "Submitting..." : "Submit for Translation"}
        </button>
      </form>

      {/* Submissions Table */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Your Translation Requests</h3>
        {submissions.length === 0 ? (
          <p className="text-sm text-gray-600">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submitted At</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source Language</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Need Notary</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((s) => (
                  <tr key={s._id}>
                    <td className="px-4 py-2 text-sm text-gray-700 capitalize">
                      {s.files.map((file) => file.filename)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 capitalize">
                      {s.sourceLanguage}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {s.needNotary ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 capitalize">
                      {s.deliveryMethod}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          s.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : s.status === "in progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : s.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationSection;
