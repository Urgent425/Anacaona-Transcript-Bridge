
//component/AddDocumentsForm

import React, { useState } from "react";

const AddDocumentsForm = ({ submissionId }) => {
  const [files, setFiles] = useState([]);
  const [translationFlags, setTranslationFlags] = useState([]);
  const [sourceLanguages, setSourceLanguages] = useState([]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    // Initialize flags & languages arrays
    setTranslationFlags(new Array(selected.length).fill(false));
    setSourceLanguages(new Array(selected.length).fill("french"));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("translationFlags", JSON.stringify(
  translationFlags.map(flag => flag ? "yes" : "no")
));
    formData.append("sourceLanguages", JSON.stringify(sourceLanguages));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
       `${process.env.REACT_APP_API_URL}/api/transcripts/add-to-submission/${submissionId}`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok) {
        
        alert("Documents added successfully!");
        
        // Reset state
        setFiles([]);
        setTranslationFlags([]);
        setSourceLanguages([]);
      } else {
        alert(data.error || "Upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } window.location.reload(true);
  };


  //Handle delete Evaluation

  const handleRemoveEvaluation = async (submissionId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/transcripts/${submissionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Evaluation removed successfully!");
        // After removal, fetch the updated submissions list
        await fetchSubmissions();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove evaluation.");
      }
    } catch (err) {
      console.error("Error removing evaluation:", err);
      alert("Failed to remove evaluation.");
    } window.location.reload(true);
  };

  return (
    <div> 
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow-md mt-4"
    >
      <h3 className="text-lg font-semibold mb-4">
        Add Documents to Submission #{submissionId}
      </h3>

      <input
        type="file"
        multiple
        accept=".pdf,image/*"
        onChange={handleFileChange}
        className="mb-4 block w-full"
      />

      {files.map((file, idx) => (
        <div key={file.name} className="mb-3">
          <label className="block font-medium">{file.name}</label>
          <select
            value={translationFlags[idx] ? "yes" : "no"}
            onChange={(e) =>
              setTranslationFlags((prev) => {
                const updated = [...prev];
                updated[idx] = e.target.value === "yes";
                return updated;
              })
            }
            className="border p-2 rounded w-full mt-1"
          >
            <option value="no">Needs Translation: No</option>
            <option value="yes">Needs Translation: Yes</option>
          </select>
          {translationFlags[idx] && (
            <select
              value={sourceLanguages[idx]}
              onChange={(e) =>
                setSourceLanguages((prev) => {
                  const updated = [...prev];
                  updated[idx] = e.target.value;
                  return updated;
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
    {/* Add Remove button */} 
                

    </div>
  );
};

export default AddDocumentsForm;
