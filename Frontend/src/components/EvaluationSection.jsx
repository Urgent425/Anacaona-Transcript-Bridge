import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const EvaluationSection = () => {
  const [purpose, setPurpose] = useState("education");
  const [files, setFiles] = useState([]);
  const [translationFlags, setTranslationFlags] = useState([]);
  const [sourceLanguages, setSourceLanguages] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setTranslationFlags(selectedFiles.map(() => false));
    setSourceLanguages(selectedFiles.map(() => "french"));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submissionId = uuidv4(); // each new evaluation gets its own ID
    const formData = new FormData();
    formData.append("purpose", purpose);
    formData.append("submissionId", submissionId);
    formData.append("translationFlags", JSON.stringify(translationFlags));
    formData.append("sourceLanguages", JSON.stringify(sourceLanguages));

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/transcripts/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      alert("Evaluation package submitted successfully!");
    } catch (error) {
      alert("Failed to submit evaluation package.");
    }
  };

  return (
    <section className="bg-white p-6 rounded shadow-md mb-8">
      <h2 className="text-xl font-bold mb-4">Evaluation Submission</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block font-semibold">
          Purpose of Evaluation:
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="block w-full mt-1 p-2 border rounded"
          >
            <option value="education">Education</option>
            <option value="immigration">Immigration</option>
          </select>
        </label>

        <label className="block font-semibold">
          Upload Transcripts:
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full mt-1"
          />
        </label>

        {files.map((file, index) => (
          <div key={index} className="flex flex-col md:flex-row md:items-center md:space-x-4 mt-2 bg-gray-100 p-2 rounded">
            <span className="font-medium">{file.name}</span>
            <select
              value={translationFlags[index] ? "yes" : "no"}
              onChange={(e) => {
                const updated = [...translationFlags];
                updated[index] = e.target.value === "yes";
                setTranslationFlags(updated);
              }}
              className="mt-2 md:mt-0 border p-1 rounded"
            >
              <option value="no">No Translation</option>
              <option value="yes">Needs Translation</option>
            </select>
            {translationFlags[index] && (
              <select
                value={sourceLanguages[index]}
                onChange={(e) => {
                  const updatedLangs = [...sourceLanguages];
                  updatedLangs[index] = e.target.value;
                  setSourceLanguages(updatedLangs);
                }}
                className="mt-2 md:mt-0 border p-1 rounded"
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
          Submit Evaluation Package
        </button>
      </form>
    </section>
  );
};

export default EvaluationSection;