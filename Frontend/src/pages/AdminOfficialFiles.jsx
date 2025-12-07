import React, { useEffect, useState } from "react";
import { API_BASE } from "../lib/apiBase";

export default function AdminOfficialFiles() {
  const token = localStorage.getItem("token");
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const load = async () => {
    const qs = new URLSearchParams({ status, q, page, pageSize }).toString();
    const res = await fetch(`${API_BASE}/api/admin/officials?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRows(data.items || []);
    setTotal(data.total || 0);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, page]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Official Transcripts</h2>
      <div className="flex gap-2 mb-3">
        <select className="border rounded px-2 py-1" value={status} onChange={(e)=>{setStatus(e.target.value); setPage(1);}}>
          {["clean","pending_scan","infected","ALL"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className="border rounded px-2 py-1" placeholder="Search submissionId/name/email" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button className="border px-3 py-1 rounded" onClick={()=>{ setPage(1); load(); }}>Search</button>
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-3 py-2">Submission</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2">Reason</th>
              <th className="px-3 py-2">Uploaded</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((r, i) => (
              <tr key={`${r.transcriptId}-${r.upload?.version}-${i}`} className="border-t">
                <td className="px-3 py-2 font-mono">{r.submissionId || r.transcriptId?.slice(-8)}</td>
                <td className="px-3 py-2">{r.student?.firstName} {r.student?.lastName}<div className="text-xs text-gray-500">{r.student?.email}</div></td>
                <td className="px-3 py-2">v{r.upload?.version || 1}</td>
                <td className="px-3 py-2">{r.upload?.reason || "initial"}</td>
                <td className="px-3 py-2">{r.upload?.uploadedAt ? new Date(r.upload.uploadedAt).toLocaleString() : "—"}</td>
                <td className="px-3 py-2">{r.upload?.status}</td>
                <td className="px-3 py-2 text-right">
                  {r.upload?.status !== "clean" ? (
                    <a
                      className="underline text-blue-600"
                      href={`${API_BASE}/api/admin/officials/${r.transcriptId}/${r.upload?.version}/download`}
                      target="_blank" rel="noreferrer"
                    >Download</a>
                  ) : <span className="text-xs text-gray-500">Not available</span>}
                </td>
              </tr>
            )) : (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={7}>No results</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3">
        <div className="text-sm">Page {page} of {pages} — {total} total</div>
        <div className="flex gap-2">
          <button className="border px-3 py-1 rounded disabled:opacity-50" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
          <button className="border px-3 py-1 rounded disabled:opacity-50" disabled={page===pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>Next</button>
        </div>
      </div>
    </div>
  );
}
