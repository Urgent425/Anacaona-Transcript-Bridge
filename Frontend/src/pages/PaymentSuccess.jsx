// src/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");

  const [receiptUrl, setReceiptUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!sessionId) {
        setMsg("Missing session_id. Redirecting…");
        setTimeout(() => navigate("/dashboard"), 1200);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/translation-requests/receipt/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Could not load receipt.");

        if (data?.receiptUrl) {
          setReceiptUrl(data.receiptUrl);

          // Open receipt for user
          window.open(data.receiptUrl, "_blank", "noopener,noreferrer");

          setMsg("Payment confirmed. Receipt opened in a new tab.");
        } else {
          setMsg("Payment confirmed, but receipt is not available yet. Please refresh in a moment.");
        }
        if (window.opener) window.close();
      } catch (e) {
        setMsg(e.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [sessionId, navigate]);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Payment Successful</h1>

      <p className="mt-3 text-sm text-slate-700">
        {loading ? "Finalizing your payment…" : msg}
      </p>

      {receiptUrl && (
        <div className="mt-4">
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded bg-slate-900 text-white"
          >
            Open Receipt
          </a>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link to="/dashboard" className="text-slate-700 underline">
          
        </Link>
      </div>
    </div>
  );
}
