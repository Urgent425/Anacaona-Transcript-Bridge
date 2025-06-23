import React, { useState } from "react";

const SubmitTranscript = () => {
  const [files, setFiles] = useState([]);
  const [purpose, setPurpose] = useState("education");
  const [needsTranslation, setNeedsTranslation] = useState([]);
  const [languages, setLanguages] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setNeedsTranslation(new Array(selectedFiles.length).fill(false));
    setLanguages(new Array(selectedFiles.length).fill("english"));
  };

  const handleTranslationChange = (index, value) => {
    const updated = [...needsTranslation];
    updated[index] = value === "yes";
    setNeedsTranslation(updated);
  };

  const handleLanguageChange = (index, value) => {
    const updated = [...languages];
    updated[index] = value;
    setLanguages(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    files.forEach(file => {
      formData.append("files", file);
    });
    formData.append("needsTranslation", JSON.stringify(needsTranslation));
    formData.append("language", JSON.stringify(languages));
    formData.append("purpose", purpose);

    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/transcripts/submit", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Submit Transcripts</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Purpose of Evaluation:
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="block w-full p-2 mt-1 border rounded">
            <option value="education">Education</option>
            <option value="immigration">Immigration</option>
          </select>
        </label>

        <label className="block">
          Upload Transcripts:
          <input type="file" multiple onChange={handleFileChange} className="block w-full mt-1" />
        </label>

        {files.map((file, index) => (
          <div key={index} className="border p-2 rounded mt-2 bg-gray-50">
            <p>{file.name}</p>
            <label>
              Need Translation?
              <select value={needsTranslation[index] ? "yes" : "no"} onChange={(e) => handleTranslationChange(index, e.target.value)} className="ml-2 border p-1 rounded">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
            <label className="ml-4">
              Language:
              <select value={languages[index]} onChange={(e) => handleLanguageChange(index, e.target.value)} className="ml-2 border p-1 rounded">
                <option value="english">English</option>
                <option value="french">French</option>
                <option value="spanish">Spanish</option>
              </select>
            </label>
          </div>
        ))}

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Submit</button>
      </form>
    </div>
  );
};

export default SubmitTranscript;
