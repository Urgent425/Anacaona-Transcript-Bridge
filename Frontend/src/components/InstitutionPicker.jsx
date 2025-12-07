//src/components/InstitutionPicker.jsx

import React, { useEffect, useState } from "react";

/**
 * Props:
 *  - valueId:   current selected institution _id (string or "")
 *  - valueName: current display name (used for "Other")
 *  - onChange:  ({ id, name }) => void
 *  - required:  boolean
 *  - disabled:  boolean
 */
export default function InstitutionPicker({
  valueId = "",
  valueName = "",
  onChange,
  required = true,
  disabled = false,
}) {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/institutions");
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setInstitutions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("InstitutionPicker load error:", e);
        setLoadError("Could not load institution list.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelect = (e) => {
    const v = e.target.value;
    if (v === "__other") {
      onChange({ id: "", name: "" }); // show text field
    } else {
      const inst = institutions.find((i) => i._id === v);
      onChange({ id: v, name: inst?.name || "" });
    }
  };

  const showOther = !loading && !loadError && valueId === "";

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Institution</label>

      {loading ? (
        <p className="text-sm text-gray-500">Loading institutions…</p>
      ) : loadError ? (
        <>
          <p className="text-sm text-red-600 mb-2">{loadError}</p>
          <input
            type="text"
            className="w-full border rounded px-2 py-1"
            placeholder="Type institution name"
            value={valueName}
            disabled={disabled}
            onChange={(e) => onChange({ id: "", name: e.target.value })}
            required={required}
          />
        </>
      ) : (
        <>
          <select
            className="w-full border rounded px-2 py-1"
            value={valueId || (valueName ? "__other" : "")}
            onChange={handleSelect}
            required={required}
            disabled={disabled}
          >
            <option value="">Select institution…</option>
            {institutions.map((inst) => (
              <option key={inst._id} value={inst._id}>
                {inst.name}
              </option>
            ))}
            <option value="__other">Other / Not listed…</option>
          </select>

          {/* Free-text appears when "__other" is selected */}
          {showOther && (
            <input
              type="text"
              className="mt-2 w-full border rounded px-2 py-1"
              placeholder="Type institution name"
              value={valueName}
              onChange={(e) => onChange({ id: "", name: e.target.value })}
              required={required}
              disabled={disabled}
            />
          )}
        </>
      )}

      <p className="mt-1 text-xs text-gray-500">
        We’ll route your submission to the chosen institution.
      </p>
    </div>
  );
}
