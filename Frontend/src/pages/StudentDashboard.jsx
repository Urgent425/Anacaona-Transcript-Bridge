
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const StudentDashboard = () => {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/transcripts/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubmissions(data);
    };
    fetchSubmissions();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Your Submitted Transcripts</h2>
      <Link
        to="/submit-transcript"
        className="inline-block mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit Your Transcripts
      </Link>
      <table className="w-full text-left border">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Filename</th>
            <th className="p-2">Translation</th>
            <th className="p-2">Language</th>
            <th className="p-2">Purpose</th>
            <th className="p-2">Status</th>
            <th className="p-2">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((t) => (
            <tr key={t._id} className="border-t">
              <td className="p-2">{t.filename}</td>
              <td className="p-2">{t.needsTranslation ? "Yes" : "No"}</td>
              <td className="p-2">{t.language}</td>
              <td className="p-2">{t.purpose}</td>
              <td className="p-2">{t.status}</td>
              <td className="p-2">{new Date(t.submittedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentDashboard;
