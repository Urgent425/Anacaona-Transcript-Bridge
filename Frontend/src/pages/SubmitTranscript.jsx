import React, { useState } from 'react';

export default function SubmitTranscript() {
  const [file, setFile] = useState(null);

  const handleUpload = () => {
    alert("Transcript submitted!");
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">Submit Your Transcript</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mb-4" />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </div>
  );
}