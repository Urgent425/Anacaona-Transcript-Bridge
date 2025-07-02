import React, { useState, useEffect } from "react";
import EvaluationSection from "../components/EvaluationSection";
import AddDocumentsForm from "../components/AddDocumentsForm";
import TranslationSection from "../components/TranslationSection";
const StudentDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [currentSection, setCurrentSection] = useState("evaluation"); // Default to "evaluation" section


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
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <h2 className="text-2xl font-bold text-center mb-4">
        Student Dashboard
      </h2>
       {/* Section buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setCurrentSection("evaluation")}
          className={`py-2 px-6 rounded ${currentSection === "evaluation" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
        >
          Evaluation Submission
        </button>
        <button
          onClick={() => setCurrentSection("translation")}
          className={`py-2 px-6 rounded ${currentSection === "translation" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
        >
          Translation Only
        </button>
      </div>

      {/* SECTION 1: Create New Evaluation */}
      <EvaluationSection fetchSubmissions={fetchSubmissions} />
      
      {/* SECTION 2: Existing Submissions */}
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
  );
};

export default StudentDashboard;
