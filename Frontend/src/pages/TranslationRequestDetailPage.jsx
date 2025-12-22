// src/pages/TranslationRequestDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";

function safeLower(v) {
  return String(v || "").toLowerCase().trim();
}

function normalizeDeliveryMethod(v) {
  const s = safeLower(v);
  if (!s) return "";
  if (s === "hard copy" || s === "hardcopy" || s === "mail" || s === "shipping") return "hard copy";
  if (s === "both") return "both";
  if (s === "email" || s === "digital") return "email";
  return s;
}

function requiresShipping(deliveryMethod) {
  const dm = normalizeDeliveryMethod(deliveryMethod);
  return dm === "hard copy" || dm === "both";
}

function formatAddress(addr, fallbackName = "") {
  if (!addr || typeof addr !== "object") return null;

  const name = addr.name || fallbackName || "";
  const address1 = addr.address1 || "";
  const address2 = addr.address2 || "";
  const city = addr.city || "";
  const state = addr.state || "";
  const zip = addr.zip || "";
  const country = addr.country || "";
  const phone = addr.phone || "";

  const lines = [
    name,
    address1,
    address2,
    [city, state, zip].filter(Boolean).join(", "),
    country,
    phone ? `Phone: ${phone}` : "",
  ].filter(Boolean);

  return lines.length ? lines : null;
}

export default function TranslationRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reqData, setReqData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [downloadingIndex, setDownloadingIndex] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/translation-requests/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) return navigate("/admin/login", { replace: true });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      setReqData(data);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Failed to load request.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ Support BOTH response shapes:
  // - raw doc: { _id, files, student, ... }
  // - wrapped: { job: {...}, raw: {...} }
  const doc = useMemo(() => {
    if (!reqData) return null;
    if (reqData.raw) return reqData.raw;
    return reqData;
  }, [reqData]);

  const job = useMemo(() => {
    if (!reqData) return null;
    if (reqData.job) return reqData.job;
    return null;
  }, [reqData]);

  const files = Array.isArray(doc?.files) ? doc.files : [];

  const studentName =
    `${doc?.student?.firstName || ""} ${doc?.student?.lastName || ""}`.trim() ||
    doc?.student?.email ||
    "Unknown";

  const deliveryMethod = doc?.deliveryMethod || job?.deliveryMethod || "";
  const shippingNeeded = requiresShipping(deliveryMethod);

  // Prefer request-level shippingAddress; fallback to job.shippingAddress; fallback to legacy student.address string
  const shippingAddressLines = useMemo(() => {
    const reqAddr = doc?.shippingAddress || doc?.deliveryAddress || job?.shippingAddress || null;

    if (reqAddr) {
      return formatAddress(reqAddr, studentName);
    }

    // Legacy fallback (student.address is a string)
    const legacy = doc?.student?.address;
    if (shippingNeeded && legacy) {
      return [studentName, legacy].filter(Boolean);
    }

    return null;
  }, [doc, job, studentName, shippingNeeded]);

  const updateStatus = async (status) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/translation-requests/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      fetchDetail();
    } catch (e) {
      alert(e.message || "Failed to update status.");
    }
  };

  const toggleLock = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/translation-requests/${id}/lock`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ locked: !doc?.locked }),
        }
      );
      if (!res.ok) throw new Error(`Lock failed (${res.status})`);
      fetchDetail();
    } catch (e) {
      alert(e.message || "Failed to lock/unlock.");
    }
  };

  // ✅ FIX: download using fetch() with Authorization header
  const downloadFile = async (fileIndex, filenameHint) => {
    try {
      setDownloadingIndex(fileIndex);

      const token = localStorage.getItem("token");
      const url = `${process.env.REACT_APP_API_URL}/api/admin/translation-requests/${id}/files/${fileIndex}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Download failed (${res.status}). ${msg}`.trim());
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filenameHint || `file_${fileIndex}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      alert(e.message || "Download failed.");
    } finally {
      setDownloadingIndex(null);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!doc) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Translation Request</h2>
        <Link to="/admin/translation" className="underline">
          Back to list
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT: REQUEST INFO */}
        <div className="space-y-2 text-sm">
          <p>
            <b>ID:</b> {doc._id}
          </p>

          {/* requestId if you generate it */}
          {doc.requestId ? (
            <p>
              <b>Request ID:</b> <span className="font-mono">{doc.requestId}</span>
            </p>
          ) : null}

          <p>
            <b>Student:</b> {studentName}
          </p>
          <p>
            <b>Student email:</b> {doc.student?.email || "—"}
          </p>
          <p>
            <b>Source → Target:</b> {doc.sourceLanguage || "—"} → {doc.targetLanguage || "—"}
          </p>
          <p>
            <b>Notary needed:</b> {doc.needNotary ? "Yes" : "No"}
          </p>
          <p>
            <b>Delivery:</b> {doc.deliveryMethod || "—"}
          </p>

          {/* Shipping address block */}
          {shippingNeeded ? (
            <div className="mt-3 rounded-lg border bg-white p-3">
              <div className="font-semibold mb-1">Shipping Address (US)</div>
              {shippingAddressLines ? (
                <div className="text-xs text-slate-700 space-y-0.5">
                  {shippingAddressLines.map((ln, i) => (
                    <div key={i}>{ln}</div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-red-600">
                  Shipping required, but no shipping address found.
                </div>
              )}
            </div>
          ) : null}

          <p>
            <b>Status:</b> {doc.status}
          </p>
          <p>
            <b>Locked:</b> {doc.locked ? "Yes" : "No"}
          </p>
          <p>
            <b>Created:</b> {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : "—"}
          </p>
        </div>

        {/* RIGHT: FILES */}
        <div className="space-y-2">
          <h3 className="font-semibold">Files</h3>

          {files.length === 0 ? (
            <p className="text-sm text-slate-600">No files.</p>
          ) : (
            <ul className="space-y-2">
              {files.map((f, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" title={f.filename}>
                      {f.filename || `File ${idx + 1}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {Number(f.pageCount) || 1} page(s)
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(idx, f.filename)}
                    disabled={downloadingIndex === idx}
                  >
                    {downloadingIndex === idx ? "Downloading…" : "Download"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={toggleLock} variant="outline">
          {doc.locked ? "Unlock" : "Lock"}
        </Button>

        <Button onClick={() => updateStatus("pending")} variant="outline">
          Mark Pending
        </Button>
        <Button onClick={() => updateStatus("paid")} variant="outline">
          Mark Paid
        </Button>
        <Button onClick={() => updateStatus("completed")}>
          Mark Completed
        </Button>
      </div>
    </div>
  );
}
