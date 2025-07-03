import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import AddDocumentsForm from "./AddDocumentsForm";

const EvaluationSection = () => {
  const [purpose, setPurpose] = useState("education");
  const [files, setFiles] = useState([]);
  const [translationFlags, setTranslationFlags] = useState([]);
  const [sourceLanguages, setSourceLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setTranslationFlags(selectedFiles.map(() => false));
    setSourceLanguages(selectedFiles.map(() => "french"));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    setLoading(true);
    const submissionId = uuidv4();
    const formData = new FormData();
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
        // Clear form
        setFiles([]);
        setTranslationFlags([]);
        setSourceLanguages([]);
      } else {
        alert(data.error || "Failed to submit evaluation package.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit evaluation package.");
    } finally {
      setLoading(false);
    } window.location.reload(true);
  };

  // Handle multiple submissions and existing submissions
  const fetchSubmissions = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("http://localhost:5000/api/transcripts/mine", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setSubmissions(data); // Update the state to reflect new submissions
          // Group by submissionId
          const grouped = data.reduce((acc, item) => {
            if (!acc[item.submissionId]) {
              acc[item.submissionId] = [];
            }
            acc[item.submissionId].push(item);
            return acc;
          }, {});
          setSubmissions(grouped);
        } catch (err) {
          console.error(err);
          alert("Failed to fetch submissions.");
        }
      };
    useEffect(() => {
      fetchSubmissions();
    }, []);
      
     //Handle delete documents
    const handleDelete = async (id) => {
      const token = localStorage.getItem("token");
      const confirm = window.confirm("Are you sure you want to delete this document?");
      if (!confirm) return;
  
      try {
        await fetch(`http://localhost:5000/api/transcripts/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmissions((prev) => Array.isArray(prev) ? prev.filter((s) => s._id !== id) : []);
      } catch (err) {
        alert("Failed to delete document");
      } await fetchSubmissions();
    };
  
  return (
    <div>
      <div>
    <section className="bg-white p-6 rounded shadow-md mb-8">
      <h2 className="text-xl font-bold mb-4">Evaluation Submission</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block font-semibold">
          Purpose of Evaluation:
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="block w-full mt-1 p-2 border rounded"
          >
            <option value="education">Education</option>
            <option value="immigration">Immigration</option>
          </select>
        </label>

        <label className="block font-semibold">
          Upload Transcripts:
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full mt-1"
          />
        </label>

        {files.map((file, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row md:items-center md:space-x-4 mt-2 bg-gray-100 p-2 rounded"
          >
            <span className="font-medium">{file.name}</span>
            <select
              value={translationFlags[index] ? "yes" : "no"}
              onChange={(e) => {
                const updated = [...translationFlags];
                updated[index] = e.target.value === "yes";
                setTranslationFlags(updated);
              }}
              className="mt-2 md:mt-0 border p-1 rounded"
            >
              <option value="no">No Translation</option>
              <option value="yes">Needs Translation</option>
            </select>
            {translationFlags[index] && (
              <select
                value={sourceLanguages[index]}
                onChange={(e) => {
                  const updatedLangs = [...sourceLanguages];
                  updatedLangs[index] = e.target.value;
                  setSourceLanguages(updatedLangs);
                }}
                className="mt-2 md:mt-0 border p-1 rounded"
              >
                <option value="french">French</option>
                <option value="spanish">Spanish</option>
              </select>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Submitting..." : "Submit Evaluation Package"}
        </button>
      </form>
    </section>
    </div>

    {/* SECTION 2: Existing Submissions */}
    <div>
      <section className="bg-white border p-4 rounded shadow-sm">
        <h3 className="text-xl font-semibold mb-4">
          Your Existing Submissions
        </h3>

        {Object.keys(submissions).length === 0 && (
          <p className="text-gray-600">No submissions yet.</p>
        )}

        {Object.entries(submissions).map(([submissionId, files]) => (
          <div
            key={submissionId}
            className="border-t border-gray-300 mt-4 pt-4 space-y-3"
          >
            <h4 className="font-semibold">
              Submission #{submissionId}
            </h4>
            <table className="w-full text-sm border">
              <thead>
                <tr>
                  <th className="text-left p-2">Filename</th>
                  <th>Purpose</th>
                  <th>Needs Translation</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file._id} className="border-t">
                    <td className="p-2">{file.filename}</td>
                    <td>{file.purpose}</td>
                    <td>{file.needsTranslation ? "Yes" : "No"}</td>
                    <td>{file.status}</td>
                    <td>{new Date(file.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(file._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add Documents to this submission */}
            <AddDocumentsForm submissionId={submissionId} 
            />
          </div>
        ))}
      </section>
      </div>
   </div> 
  );
};

export default EvaluationSection;
