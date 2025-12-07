//src/pages/TranslationRequestDetailPage.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function TranslationRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reqData, setReqData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchDetail = async () => {
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/translation-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return navigate("/admin/login", { replace: true });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setReqData(data);
    } catch (e) {
      console.error(e);
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const updateStatus = async (status) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/translation-requests/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      fetchDetail();
    } catch (e) {
      alert(e.message);
    }
  };

  const toggleLock = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/translation-requests/${id}/lock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ locked: !reqData.locked }),
      });
      if (!res.ok) throw new Error(`Lock failed (${res.status})`);
      fetchDetail();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!reqData) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Translation Request</h2>
        <Link to="/admin/translation" className="underline">Back to list</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p><b>ID:</b> {reqData._id}</p>
          <p><b>Student:</b> {reqData.student?.firstName || "Unknown"}</p>
          <p><b>Address:</b> {reqData.student?.address || "-"}</p>
          <p><b>Source → Target:</b> {reqData.sourceLanguage} → {reqData.targetLanguage}</p>
          <p><b>Notary needed:</b> {reqData.needNotary ? "Yes" : "No"}</p>
          <p><b>Delivery:</b> {reqData.deliveryMethod || "—"}</p>
          <p><b>Status:</b> {reqData.status}</p>
          <p><b>Locked:</b> {reqData.locked ? "Yes" : "No"}</p>
          <p><b>Created:</b> {new Date(reqData.createdAt).toLocaleString()}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Files</h3>
          {(!reqData.files || reqData.files.length === 0) ? (
            <p>No files.</p>
          ) : (
            <ul className="list-disc ml-5">
              {reqData.files.map((f, idx) => (
                <li key={idx}>
                  <a
                    className="text-blue-600 underline"
                    href={`http://localhost:5000/api/admin/translation-requests/${reqData._id}/files/${idx}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {f.filename} ({f.pageCount} pages)
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={toggleLock} variant="outline">
          {reqData.locked ? "Unlock" : "Lock"}
        </Button>
        <Button onClick={() => updateStatus("pending")}  variant="outline">Mark Pending</Button>
        <Button onClick={() => updateStatus("paid")}     variant="outline">Mark Paid</Button>
        <Button onClick={() => updateStatus("completed")}            >Mark Completed</Button>
      </div>
    </div>
  );
}
