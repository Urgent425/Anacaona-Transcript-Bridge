// src/components/SubmissionsTable.jsx
import React from "react";

const SubmissionsTable = ({ submissions, onDelete }) => {
  if (!submissions || submissions.length === 0) {
    return <p className="text-sm text-gray-600">No submissions yet.</p>;
  }

  const openReceipt = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const totalPagesOf = (files = []) =>
    files.reduce((sum, f) => sum + (Number(f.pageCount) || 1), 0);

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full border divide-y divide-gray-200">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Files
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Pages
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Submitted
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.map((s) => {
            const files = Array.isArray(s.files) ? s.files : [];
            const filenames = files.map((f) => f.filename).filter(Boolean).join(", ");
            const totalPages = totalPagesOf(files);

            const isPaid = !!s.paid || s.status === "paid" || !!s.locked; // tolerate older data
            const canDelete = !s.locked && !isPaid;
            const canReceipt = isPaid && !!s.receiptUrl;

            return (
              <tr key={s._id}>
                <td className="px-4 py-2 text-sm">
                  {filenames || <span className="text-gray-500">—</span>}
                </td>

                <td className="px-4 py-2 text-sm">{totalPages}</td>

                <td className="px-4 py-2 text-sm">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                </td>

                <td className="px-4 py-2 text-sm">
                  {isPaid ? "Paid" : "Pending for payment"}
                </td>

                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    {canReceipt && (
                      <button
                        type="button"
                        onClick={() => openReceipt(s.receiptUrl)}
                        className="text-slate-700 hover:underline text-sm"
                        title="Open Stripe receipt in a new tab"
                      >
                        Download Receipt
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(s._id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SubmissionsTable;