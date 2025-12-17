//src/pages/PaymentSuccessEval.jsx

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function PaymentSuccessEval() {
  const location = useLocation();
  const navigate = useNavigate();

  const sessionId = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return qs.get("session_id");
  }, [location.search]);

  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [locked, setLocked] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [amountPaidCents, setAmountPaidCents] = useState(null);
  const [currency, setCurrency] = useState("usd");
  const [error, setError] = useState("");

  // Auto-open receipt once per session id (optional UX)
  const [autoOpened, setAutoOpened] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session_id. Please return to the dashboard.");
      setLoading(false);
      return;
    }

    const fetchReceipt = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You are not logged in. Please sign in again.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/payments/evaluation-receipt/${sessionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || data?.message || "Failed to fetch receipt details.");
        }

        setPaid(!!data.paid);
        setLocked(!!data.locked);
        setReceiptUrl(data.receiptUrl || null);
        setAmountPaidCents(
          typeof data.amountPaidCents === "number" ? data.amountPaidCents : null
        );
        setCurrency((data.currency || "usd").toLowerCase());
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [sessionId]);

  // Optional: auto-open receipt once
  useEffect(() => {
    if (!loading && paid && receiptUrl && !autoOpened) {
      setAutoOpened(true);
      // Use user gesture? Not available here, so pop-up blockers may block.
      // It's still fine: user can click the button if blocked.
      window.open(receiptUrl, "_blank", "noopener,noreferrer");
    }
  }, [loading, paid, receiptUrl, autoOpened]);

  const amountFormatted = useMemo(() => {
    if (typeof amountPaidCents !== "number") return null;
    const value = amountPaidCents / 100;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  }, [amountPaidCents, currency]);

  const goDashboard = () => {
    // choose whichever route you want as the main landing after payment
    navigate("/student-dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Successful</h1>

        <p className="text-sm text-gray-600 mt-2">
          Thank you. We received your evaluation payment and will begin processing.
        </p>

        <div className="mt-6 space-y-3 text-sm">
          {loading ? (
            <div className="text-gray-600">Loading payment details…</div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3">
              {error}
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3">
                <div className="font-semibold">Status</div>
                <div className="mt-1">
                  {paid ? "Paid" : "Pending confirmation"} •{" "}
                  {locked ? "Locked" : "Not locked"}
                </div>
              </div>

              {amountFormatted && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                  <div className="text-gray-700 font-medium">Amount</div>
                  <div className="text-gray-900 font-semibold">{amountFormatted}</div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div className="text-gray-700 font-medium">Stripe Session</div>
                <div className="text-gray-900 font-mono text-xs break-all">{sessionId}</div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                {receiptUrl ? (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-white text-sm font-semibold hover:bg-gray-800"
                  >
                    View / Download Receipt
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center rounded-lg bg-gray-300 px-4 py-2 text-white text-sm font-semibold cursor-not-allowed"
                  >
                    Receipt not available yet
                  </button>
                )}

                <button
                  type="button"
                  onClick={goDashboard}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-gray-800 text-sm font-semibold hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
              </div>

              <div className="text-xs text-gray-500 mt-3 leading-snug">
                If the receipt button is disabled, please refresh this page in a few seconds.
                The receipt is added after Stripe confirms the payment via webhook.
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <Link to="/student-dashboard" className="text-blue-600 hover:underline">
            Return to Student Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
