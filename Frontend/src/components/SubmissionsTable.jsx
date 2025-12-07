import React from "react";

const SubmissionsTable = ({ submissions, onDelete }) => {
  if (!submissions || submissions.length === 0) {
    return <p className="text-sm text-gray-600">No submissions yet.</p>;
  }

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full border divide-y divide-gray-200">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Files</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pages</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.map((s) => (
            <tr key={s._id}>
              <td className="px-4 py-2 text-sm">
                {s.files.map(f => f.filename).join(", ")}
              </td>
              <td className="px-4 py-2 text-sm">
                {s.files.map(f => f.pageCount)}
              </td>
              <td className="px-4 py-2 text-sm">{new Date(s.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-2 text-sm">
                {s.locked ? "Paid" : "Pending for payment"}
              </td>
              <td>
                {!s.locked && (
                  <button
                    onClick={() => onDelete(s._id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubmissionsTable;
