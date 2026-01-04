// src/components/TranslationUploadForm.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Languages,
  FileUp,
  FileText,
  Image as ImageIcon,
  Truck,
  Mail,
  Stamp,
  X,
  Loader2,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Globe,
  Building2,
  Hash,
  Trash2,
} from "lucide-react";

import { countPages } from "./helpers/countPages";
import { TRANSLATION_FEE_PER_PAGE } from "./constants/pricing";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function isShippingDelivery(method) {
  return method === "hard copy" || method === "both";
}

function isValidUSZip(zip) {
  return /^\d{5}(-\d{4})?$/.test(String(zip || "").trim());
}

function normalizePhone(v) {
  return String(v || "").replace(/[^\d+]/g, "").trim();
}

export default function TranslationUploadForm({ onSubmitted }) {
  const apiBase = process.env.REACT_APP_API_URL;

  // files + page counts
  const [documents, setDocuments] = useState([]); // [{ file, pageCount }]
  const [uploading, setUploading] = useState(false);

  // fields
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("english");
  const [needNotary, setNeedNotary] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("");

  // address UX state
  const [addressMode, setAddressMode] = useState("saved"); // saved | new
  const [savedAddress, setSavedAddress] = useState(null);
  const [loadingSavedAddress, setLoadingSavedAddress] = useState(false);
  const [saveNewToProfile, setSaveNewToProfile] = useState(true);

  // shipping fields (used for both saved/new; saved just pre-fills)
  const [shipFullName, setShipFullName] = useState("");
  const [shipAddress1, setShipAddress1] = useState("");
  const [shipAddress2, setShipAddress2] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipState, setShipState] = useState("");
  const [shipZip, setShipZip] = useState("");
  const [shipCountry, setShipCountry] = useState("US");
  const [shipPhone, setShipPhone] = useState("");
  const [shipEmail, setShipEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const totalPages = useMemo(() => {
    return documents.reduce((sum, d) => sum + (Number(d.pageCount) || 1), 0);
  }, [documents]);

  const estimatedCost = useMemo(() => {
    return totalPages * TRANSLATION_FEE_PER_PAGE;
  }, [totalPages]);

  const shippingRequired = useMemo(() => isShippingDelivery(deliveryMethod), [deliveryMethod]);

  // Load saved address from profile
  const loadSavedAddress = async () => {
    setLoadingSavedAddress(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/users/me/shipping-address`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // if endpoint not mounted yet, fail gracefully
        const text = await res.text();
        throw new Error(text || "Failed to load saved address.");
      }
      const data = await res.json();
      const addr = data?.shippingAddress || {};
      const fullName =
        addr.fullName ||
        data.fullName ||
        ""; // backend may already compute fallback

      const hydrated = {
        fullName: fullName || "",
        address1: addr.address1 || "",
        address2: addr.address2 || "",
        city: addr.city || "",
        state: addr.state || "",
        zip: addr.zip || "",
        country: addr.country || "US",
        phone: addr.phone || data?.phone || "",
        email: addr.email || "",
      };

      setSavedAddress(hydrated);

      // If user is using saved mode, pre-fill inputs
      if (addressMode === "saved") {
        setShipFullName(hydrated.fullName);
        setShipAddress1(hydrated.address1);
        setShipAddress2(hydrated.address2);
        setShipCity(hydrated.city);
        setShipState(hydrated.state);
        setShipZip(hydrated.zip);
        setShipCountry(hydrated.country || "US");
        setShipPhone(hydrated.phone);
        setShipEmail(hydrated.email);
      }
    } catch (e) {
      console.error(e);
      setSavedAddress(null);
      // do not hard-fail UI; only show message if shipping is needed
    } finally {
      setLoadingSavedAddress(false);
    }
  };

  useEffect(() => {
    loadSavedAddress();

  }, []);

  // When delivery method becomes shipping-required, default to saved address (if available)
  useEffect(() => {
    if (!shippingRequired) return;

    if (savedAddress && addressMode === "saved") {
      setShipFullName(savedAddress.fullName || "");
      setShipAddress1(savedAddress.address1 || "");
      setShipAddress2(savedAddress.address2 || "");
      setShipCity(savedAddress.city || "");
      setShipState(savedAddress.state || "");
      setShipZip(savedAddress.zip || "");
      setShipCountry(savedAddress.country || "US");
      setShipPhone(savedAddress.phone || "");
      setShipEmail(savedAddress.email || "");
    }

  }, [shippingRequired]);

  // If user toggles between saved/new, swap values appropriately
  useEffect(() => {
    if (!shippingRequired) return;

    if (addressMode === "saved") {
      const a = savedAddress || {};
      setShipFullName(a.fullName || "");
      setShipAddress1(a.address1 || "");
      setShipAddress2(a.address2 || "");
      setShipCity(a.city || "");
      setShipState(a.state || "");
      setShipZip(a.zip || "");
      setShipCountry(a.country || "US");
      setShipPhone(a.phone || "");
      setShipEmail(a.email || "");
    } else {
      // “new”: keep whatever user typed (do nothing)
    }

  }, [addressMode]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError("");

    try {
      const processed = [];
      for (const file of files) {
        const pageCount = await countPages(file);
        processed.push({ file, pageCount });
      }
      setDocuments(processed);
    } catch (err) {
      console.error(err);
      setError("Failed to read uploaded files. Please try again.");
      setDocuments([]);
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (idx) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
    // clear input when removing last file for better UX
    if (documents.length === 1 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validate = () => {
    if (!sourceLanguage) return "Please select a source language.";
    if (!targetLanguage) return "Please select a target language.";
    if (!deliveryMethod) return "Please select a delivery method.";
    if (sourceLanguage === targetLanguage) return "Source language and target language cannot be same.";
    if (documents.length === 0) return "Please upload at least one file.";

    if (shippingRequired) {
      if (!String(shipCountry || "").trim()) return "Please enter a country.";
      if (String(shipCountry).trim().toUpperCase() !== "US") return "Hard copy delivery is available only in the United States.";
      if (!shipFullName.trim()) return "Shipping name is required.";
      if (!shipAddress1.trim()) return "Shipping address is required.";
      if (!shipCity.trim()) return "Shipping city is required.";
      if (!shipState.trim()) return "Shipping state is required.";
      if (!shipZip.trim()) return "Shipping ZIP code is required.";
      if (!isValidUSZip(shipZip)) return "Invalid ZIP code. Use 12345 or 12345-6789.";
      if (!normalizePhone(shipPhone)) return "Shipping phone is required.";
    }
    return null;
  };

  const saveAddressToProfile = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiBase}/api/users/me/shipping-address`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: shipFullName,
        address1: shipAddress1,
        address2: shipAddress2,
        city: shipCity,
        state: shipState,
        zip: shipZip,
        country: shipCountry || "US",
        phone: shipPhone,
        email: shipEmail,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to save address to profile.");
    }
    const data = await res.json();
    setSavedAddress({
      fullName: data?.shippingAddress?.fullName || shipFullName,
      address1: data?.shippingAddress?.address1 || shipAddress1,
      address2: data?.shippingAddress?.address2 || shipAddress2,
      city: data?.shippingAddress?.city || shipCity,
      state: data?.shippingAddress?.state || shipState,
      zip: data?.shippingAddress?.zip || shipZip,
      country: data?.shippingAddress?.country || (shipCountry || "US"),
      phone: data?.shippingAddress?.phone || shipPhone,
      email: data?.shippingAddress?.email || shipEmail,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      // If user entered a new shipping address and wants to save it, save first
      if (shippingRequired && addressMode === "new" && saveNewToProfile) {
        await saveAddressToProfile();
      }

      const fd = new FormData();
      documents.forEach((d) => fd.append("files", d.file));
      fd.append("sourceLanguage", sourceLanguage);
      fd.append("targetLanguage", targetLanguage);
      fd.append("needNotary", String(needNotary));
      fd.append("deliveryMethod", deliveryMethod);
      fd.append("pageCounts", JSON.stringify(documents.map((d) => d.pageCount)));

      // Send shipping fields only if needed
      if (shippingRequired) {
        fd.append("shipFullName", shipFullName);
        fd.append("shipAddress1", shipAddress1);
        fd.append("shipAddress2", shipAddress2);
        fd.append("shipCity", shipCity);
        fd.append("shipState", shipState);
        fd.append("shipZip", shipZip);
        fd.append("shipCountry", (shipCountry || "US").toUpperCase());
        fd.append("shipPhone", normalizePhone(shipPhone));
        if (shipEmail) fd.append("shipEmail", shipEmail);
      }

      const res = await fetch(`${apiBase}/api/translation-requests`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = text;
        try {
          msg = JSON.parse(text)?.message || msg;
        } catch {}
        throw new Error(msg || "Submission failed.");
      }

      // reset
      setDocuments([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setSourceLanguage("");
      setTargetLanguage("");
      setNeedNotary(false);
      setDeliveryMethod("");

      // keep saved address loaded, but reset mode
      setAddressMode("saved");
      setSaveNewToProfile(true);

      onSubmitted?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error submitting documents.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
      <header className="mb-5">
        <h3 className="text-xl font-semibold text-gray-900">Submit New Translation Request</h3>
        <p className="text-sm text-gray-600 mt-1">
          Upload files, choose language options, and select delivery. We’ll estimate pages and translation cost automatically.
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Languages + Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source language */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Languages className="w-4 h-4 text-gray-600" />
              Languages
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Source Language</label>
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose…</option>
                  <option value="french">French</option>
                  <option value="spanish">Spanish</option>
                  <option value="spanish">English</option>
                  <option value="spanish">Russian</option>
                  <option value="spanish">Haitian Creole</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Target Language</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose…</option>
                  <option value="english">English</option>
                  <option value="french">French</option>
                  <option value="spanish">Spanish</option>
                  <option value="spanish">Russian</option>
                  <option value="spanish">Haitian Creole</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                <input
                  type="checkbox"
                  checked={needNotary}
                  onChange={(e) => setNeedNotary(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="inline-flex items-center gap-2">
                  <Stamp className="w-4 h-4 text-gray-600" />
                  Need Notary Service
                </span>
              </label>
            </div>
          </div>

          {/* Delivery method */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Truck className="w-4 h-4 text-gray-600" />
              Delivery
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Method</label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDeliveryMethod(next);

                    // If shipping becomes required, default to saved mode
                    if (isShippingDelivery(next)) {
                      setAddressMode("saved");
                      // If savedAddress already exists, hydrate fields
                      if (savedAddress) {
                        setShipFullName(savedAddress.fullName || "");
                        setShipAddress1(savedAddress.address1 || "");
                        setShipAddress2(savedAddress.address2 || "");
                        setShipCity(savedAddress.city || "");
                        setShipState(savedAddress.state || "");
                        setShipZip(savedAddress.zip || "");
                        setShipCountry(savedAddress.country || "US");
                        setShipPhone(savedAddress.phone || "");
                        setShipEmail(savedAddress.email || "");
                      }
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select…</option>
                  <option value="email">Email</option>
                  <option value="hard copy">Hard Copy (US only)</option>
                  <option value="both">Both (Email + Hard Copy)</option>
                </select>
              </div>

              <div className="text-xs text-gray-600 flex items-start gap-2">
                {deliveryMethod === "email" ? (
                  <>
                    <Mail className="w-4 h-4 mt-0.5 text-gray-500" />
                    <span>Email delivery does not require a shipping address.</span>
                  </>
                ) : deliveryMethod ? (
                  <>
                    <Truck className="w-4 h-4 mt-0.5 text-gray-500" />
                    <span>Hard copy delivery requires a US shipping address and ZIP code.</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mt-0.5 text-gray-500" />
                    <span>Select a delivery method to continue.</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Shipping address (conditional) */}
        {shippingRequired && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-700" />
                  Shipping Address (US only)
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Choose a saved address or enter a new one for this request.
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAddressMode("saved")}
                  className={cx(
                    "px-3 py-2 rounded-lg border font-semibold",
                    addressMode === "saved"
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  Use saved
                </button>
                <button
                  type="button"
                  onClick={() => setAddressMode("new")}
                  className={cx(
                    "px-3 py-2 rounded-lg border font-semibold",
                    addressMode === "new"
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  Enter new
                </button>
              </div>
            </div>

            {/* Saved address info */}
            {addressMode === "saved" && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-gray-800">Saved address on file</div>
                  <button
                    type="button"
                    onClick={loadSavedAddress}
                    className="text-xs font-semibold text-gray-700 hover:underline"
                    disabled={loadingSavedAddress}
                  >
                    {loadingSavedAddress ? "Loading…" : "Refresh"}
                  </button>
                </div>

                {!savedAddress ? (
                  <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    No saved address found. Please choose “Enter new” to provide a shipping address.
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 mt-0.5 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500">Name</div>
                        <div className="font-medium">{savedAddress.fullName || "—"}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 mt-0.5 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <div className="font-medium">{savedAddress.phone || "—"}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 md:col-span-2">
                      <Building2 className="w-4 h-4 mt-0.5 text-gray-500" />
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">Address</div>
                        <div className="font-medium truncate">
                          {savedAddress.address1 || "—"}{" "}
                          {savedAddress.address2 ? `, ${savedAddress.address2}` : ""},{" "}
                          {savedAddress.city || "—"}, {savedAddress.state || "—"}{" "}
                          {savedAddress.zip || "—"}, {savedAddress.country || "US"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Address form (used for saved + new; in saved mode, it is editable for “this request only”) */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={shipFullName}
                    onChange={(e) => setShipFullName(e.target.value)}
                    className="w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={shipPhone}
                    onChange={(e) => setShipPhone(e.target.value)}
                    className="w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 615 555 1234"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Address line 1</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={shipAddress1}
                    onChange={(e) => setShipAddress1(e.target.value)}
                    className="w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Street address"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Address line 2 (optional)</label>
                <input
                  value={shipAddress2}
                  onChange={(e) => setShipAddress2(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Apt, suite, unit, building, floor..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  value={shipCity}
                  onChange={(e) => setShipCity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  value={shipState}
                  onChange={(e) => setShipState(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="TN"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={shipZip}
                    onChange={(e) => setShipZip(e.target.value)}
                    className={cx(
                      "w-full pl-10 rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                      shipZip && !isValidUSZip(shipZip) ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="12345 or 12345-6789"
                  />
                </div>
                {shipZip && !isValidUSZip(shipZip) && (
                  <div className="mt-1 text-xs text-red-600">Invalid ZIP format.</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={shipCountry}
                    onChange={(e) => setShipCountry(e.target.value)}
                    className="w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="US">United States</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Email (optional)</label>
                <input
                  value={shipEmail}
                  onChange={(e) => setShipEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="recipient@example.com"
                />
              </div>
            </div>

            {/* Save address toggle (only relevant in new mode) */}
            {addressMode === "new" && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={saveNewToProfile}
                  onChange={(e) => setSaveNewToProfile(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                  id="saveAddr"
                />
                <label htmlFor="saveAddr" className="select-none">
                  Save this address to my profile for next time
                </label>
              </div>
            )}
          </div>
        )}

        {/* File upload */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <FileUp className="w-4 h-4 text-gray-700" />
            Upload files
          </div>
          <p className="text-xs text-gray-600 mt-1">
            PDF or images. We will count pages and estimate cost.
          </p>

          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer
                        file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {uploading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              Counting pages…
            </div>
          )}

          {documents.length > 0 && (
            <div className="mt-4 space-y-2">
              {documents.map((d, idx) => (
                <div
                  key={`${d.file.name}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div className="min-w-0 flex items-start gap-3">
                    {d.file.type?.startsWith("image/") ? (
                      <ImageIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{d.file.name}</div>
                      <div className="text-xs text-gray-600">
                        {d.pageCount} page{d.pageCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeDoc(idx)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary + Submit */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-gray-900">Estimated translation cost</span>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Pages: <span className="font-semibold text-gray-900">{totalPages}</span> •{" "}
                ${TRANSLATION_FEE_PER_PAGE}/page
                {needNotary ? " • Notary selected" : ""}
                {shippingRequired ? " • Shipping required" : ""}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-semibold text-gray-900">
                ${Number.isFinite(estimatedCost) ? estimatedCost.toFixed(2) : "0.00"}
              </div>
              <div className="text-xs text-gray-600">Translation pages only (fees may apply at payment)</div>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting || uploading}
              className={cx(
                "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                submitting || uploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4" />
                  Submit Translation Request
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                // Reset form quickly
                setDocuments([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setSourceLanguage("");
                setTargetLanguage("english");
                setNeedNotary(false);
                setDeliveryMethod("");
                setError("");
                setAddressMode("saved");
                setSaveNewToProfile(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Reset
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-600 leading-snug">
            If you choose hard copy delivery, we will ship only within the United States. Please ensure the ZIP code is correct.
          </p>
        </div>
      </form>
    </section>
  );
}
