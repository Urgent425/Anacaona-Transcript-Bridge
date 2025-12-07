import React, { useState, useEffect } from "react";

const SchoolDashboard = () => {
  const [allTranscripts, setAllTranscripts] = useState([]);

  useEffect(() => {
    const fetchAllTranscripts = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/transcripts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAllTranscripts(data);
    };
    fetchAllTranscripts();
  }, []);

  const handleAction = async (id, action) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/transcripts/status/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: action }),
    });
    window.location.reload();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">School Admin Dashboard</h2>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Student Email</th>
            <th>Purpose</th>
            <th>Needs Translation</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allTranscripts.map((t) => (
            <tr key={t._id}>
              <td>{t.student?.email || "N/A"}</td>
              <td>{t.purpose}</td>
              <td>{t.needsTranslation ? "Yes" : "No"}</td>
              <td>{t.status}</td>
              <td className="space-x-2">
                <button onClick={() => handleAction(t._id, "Approved")} className="text-green-600">Approve</button>
                <button onClick={() => handleAction(t._id, "Rejected")} className="text-red-600">Reject</button>
                <button onClick={() => handleAction(t._id, "Translation Requested")} className="text-yellow-600">Request Translation</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SchoolDashboard;