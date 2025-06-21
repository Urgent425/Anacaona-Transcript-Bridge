import React, { useState, useEffect } from "react";

const StudentDashboard = () => {
  const [purpose, setPurpose] = useState("education");
  const [needsTranslation, setNeedsTranslation] = useState(false);
  const [file, setFile] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", purpose);
    formData.append("needsTranslation", needsTranslation);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/transcripts/submit", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to submit");

      alert("Transcript submitted successfully!");
      // Refresh the submissions list
      fetchSubmissions();
    } catch (err) {
      alert("Submission failed");
    }
  };

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/transcripts/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Submit Your Transcript</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Purpose of Evaluation:
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="block w-full mt-1 border p-2 rounded"
          >
            <option value="education">Education</option>
            <option value="immigration">Immigration</option>
          </select>
        </label>

        <label className="block">
          Need Translation?
          <select
            value={needsTranslation ? "yes" : "no"}
            onChange={(e) => setNeedsTranslation(e.target.value === "yes")}
            className="block w-full mt-1 border p-2 rounded"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>

        <label className="block">
          Upload Transcript:
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            required
            className="block w-full mt-1"
          />
        </label>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>

      <h3 className="text-xl font-semibold mt-10 mb-2">Your Submissions</h3>
      {submissions.length === 0 ? (
        <p className="text-gray-600">No transcripts submitted yet.</p>
      ) : (
        <table className="w-full mt-2 text-left border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Purpose</th>
              <th className="p-2 border">Translation</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((t) => (
              <tr key={t._id} className="border-t">
                <td className="p-2">{t.purpose}</td>
                <td className="p-2">{t.needsTranslation ? "Yes" : "No"}</td>
                <td className="p-2">{t.status || "Pending"}</td>
                <td className="p-2">
                  {t.submittedAt
                    ? new Date(t.submittedAt).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentDashboard;