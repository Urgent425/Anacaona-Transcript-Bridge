import React, { useState } from "react";

const AddDocumentsForm = ({ submissionId }) => {
  const [files, setFiles] = useState([]);
  const [needsTranslation, setNeedsTranslation] = useState({});
  const [sourceLanguages, setSourceLanguages] = useState({});

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(newFiles);

    const initTranslation = {};
    const initLanguages = {};
    newFiles.forEach((file) => {
      initTranslation[file.name] = false;
      initLanguages[file.name] = "french"; // default
    });
    setNeedsTranslation(initTranslation);
    setSourceLanguages(initLanguages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
      formData.append("needsTranslation", needsTranslation[file.name]);
      if (needsTranslation[file.name]) {
        formData.append("sourceLanguages", sourceLanguages[file.name]);
      }
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/transcripts/${submissionId}/add-documents`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      alert("Documents added successfully.");
    } catch (err) {
      alert("Upload failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mt-4">
      <h3 className="text-lg font-semibold mb-4">Add Documents to Submission #{submissionId}</h3>

      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="mb-4 block w-full"
      />

      {files.map((file) => (
        <div key={file.name} className="mb-3">
          <label className="block font-medium">{file.name}</label>
          <select
            value={needsTranslation[file.name] ? "yes" : "no"}
            onChange={(e) =>
              setNeedsTranslation({
                ...needsTranslation,
                [file.name]: e.target.value === "yes",
              })
            }
            className="border p-2 rounded w-full mt-1"
          >
            <option value="no">Needs Translation: No</option>
            <option value="yes">Needs Translation: Yes</option>
          </select>
          {needsTranslation[file.name] && (
            <select
              value={sourceLanguages[file.name]}
              onChange={(e) =>
                setSourceLanguages({
                  ...sourceLanguages,
                  [file.name]: e.target.value,
                })
              }
              className="border p-2 rounded w-full mt-1"
            >
              <option value="french">French</option>
              <option value="spanish">Spanish</option>
            </select>
          )}
        </div>
      ))}

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload Documents
      </button>
    </form>
  );
};

export default AddDocumentsForm;
