import React, { useState, useEffect } from "react";

const StudentDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [evaluationPurpose, setEvaluationPurpose] = useState("education");
  const [evaluationFiles, setEvaluationFiles] = useState([]);
  const [evaluationTranslationFlags, setEvaluationTranslationFlags] = useState([]);
  const [evaluationSourceLanguages, setEvaluationSourceLanguages] = useState([]);

  const [translationOnlyFiles, setTranslationOnlyFiles] = useState([]);
  const [translationOnlyLanguages, setTranslationOnlyLanguages] = useState([]);

  const TRANSLATION_COST = 25;
  const EVALUATION_COST = 50;

  useEffect(() => {
    const fetchSubmissions = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/transcripts/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubmissions(data);
    };
    fetchSubmissions();
  }, []);

  // Evaluation section file handler
  const handleEvaluationFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setEvaluationFiles(selected);
    setEvaluationTranslationFlags(new Array(selected.length).fill(false));
    setEvaluationSourceLanguages(new Array(selected.length).fill("french"));
  };

  // Translation-only file handler
  const handleTranslationOnlyChange = (e) => {
    const selected = Array.from(e.target.files);
    setTranslationOnlyFiles(selected);
    setTranslationOnlyLanguages(new Array(selected.length).fill("french"));
  };

  const handleSubmitAll = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
     // Generate submissionId (per package)
  const submissionId = crypto.randomUUID(); // ✅ Add here


    // 1. Submit Evaluation Section
    if (evaluationFiles.length > 0) {
      const evalForm = new FormData();
      evaluationFiles.forEach((file, i) => {
        evalForm.append("files", file);
      });
      evalForm.append("submissionId", submissionId); // ✅ Add to form
      evalForm.append("purpose", evaluationPurpose);
      evalForm.append("translationFlags", JSON.stringify(evaluationTranslationFlags));
      evalForm.append("sourceLanguages", JSON.stringify(evaluationSourceLanguages));

      await fetch("http://localhost:5000/api/transcripts/submit", {
        method: "POST",
        body: evalForm,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // 2. Submit Translation-Only Section
    if (translationOnlyFiles.length > 0) {
      const transForm = new FormData();
      translationOnlyFiles.forEach((file) => {
  transForm.append("files", file);
});
transForm.append("translationFlags", JSON.stringify(translationOnlyFiles.map(() => true)));
transForm.append("sourceLanguages", JSON.stringify(translationOnlyLanguages));
      transForm.append("purpose", "translation-only");

      await fetch("http://localhost:5000/api/transcripts/submit", {
        method: "POST",
        body: transForm,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    alert("Submission completed!");
    window.location.reload();
  };

  const totalTranslationFiles =
    evaluationTranslationFlags.filter(Boolean).length + translationOnlyFiles.length;
  const evaluationFee = evaluationFiles.length > 0 ? EVALUATION_COST : 0;
  const total = totalTranslationFiles * TRANSLATION_COST + evaluationFee;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 bg-white">
      <h2 className="text-2xl font-bold text-center">Student Dashboard</h2>

      {/* SECTION 1: EVALUATION SUBMISSION */}
      <section className="border p-4 rounded shadow-sm bg-gray-50">
        <h3 className="text-xl font-semibold mb-2">1. Evaluation Submission</h3>

        <label className="block">
          Purpose:
          <select
            value={evaluationPurpose}
            onChange={(e) => setEvaluationPurpose(e.target.value)}
            className="block w-full border mt-1 p-2"
          >
            <option value="education">Education</option>
            <option value="immigration">Immigration</option>
          </select>
        </label>

        <label className="block mt-4">
          Upload Files:
          <input
            type="file"
            multiple
            onChange={handleEvaluationFileChange}
            className="block w-full mt-1"
          />
        </label>

        {evaluationFiles.map((file, i) => (
          <div key={i} className="flex items-center space-x-4 mt-2">
            <span className="text-sm">{file.name}</span>
            <label>
              Translate?
              <select
                value={evaluationTranslationFlags[i] ? "yes" : "no"}
                onChange={(e) =>
                  setEvaluationTranslationFlags((prev) => {
                    const updated = [...prev];
                    updated[i] = e.target.value === "yes";
                    return updated;
                  })
                }
                className="ml-2 border p-1"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
            {evaluationTranslationFlags[i] && (
              <label>
                Language:
                <select
                  value={evaluationSourceLanguages[i]}
                  onChange={(e) =>
                    setEvaluationSourceLanguages((prev) => {
                      const updated = [...prev];
                      updated[i] = e.target.value;
                      return updated;
                    })
                  }
                  className="ml-2 border p-1"
                >
                  <option value="french">French</option>
                  <option value="spanish">Spanish</option>
                </select>
              </label>
            )}
          </div>
        ))}
      </section>

      {/* SECTION 2: TRANSLATION-ONLY SERVICE */}
      <section className="border p-4 rounded shadow-sm bg-gray-50">
        <h3 className="text-xl font-semibold mb-2">2. Translation-Only Service</h3>
        <label className="block">
          Upload Files for Translation Only:
          <input
            type="file"
            multiple
            onChange={handleTranslationOnlyChange}
            className="block w-full mt-1"
          />
        </label>
        {translationOnlyFiles.map((file, i) => (
          <div key={i} className="mt-2 flex items-center space-x-4">
            <span className="text-sm">{file.name}</span>
            <label>
              Language:
              <select
                value={translationOnlyLanguages[i]}
                onChange={(e) =>
                  setTranslationOnlyLanguages((prev) => {
                    const updated = [...prev];
                    updated[i] = e.target.value;
                    return updated;
                  })
                }
                className="ml-2 border p-1"
              >
                <option value="french">French</option>
                <option value="spanish">Spanish</option>
              </select>
            </label>
          </div>
        ))}
      </section>

      {/* SECTION 3: SUMMARY & PAYMENT */}
      <section className="border p-4 rounded shadow-sm bg-gray-50">
        <h3 className="text-xl font-semibold mb-2">3. Summary & Payment</h3>
        <p>Evaluation Fee: ${evaluationFee}</p>
        <p>Translation Files: {totalTranslationFiles} × ${TRANSLATION_COST} = ${totalTranslationFiles * TRANSLATION_COST}</p>
        <p className="font-bold mt-2">Total to Pay: ${total}</p>
        <button
          onClick={handleSubmitAll}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit and Pay
        </button>
      </section>

      {/* Submission History */}
      <section>
        <h3 className="text-xl font-semibold mt-8 mb-2">Your Submissions</h3>
        <table className="w-full text-left border text-sm">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Purpose</th>
              <th>Translation</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((t) => (
              <tr key={t._id}>
                <td>{t.filename}</td>
                <td>{t.purpose}</td>
                <td>{t.needsTranslation ? "Yes" : "No"}</td>
                <td>{t.status}</td>
                <td>{new Date(t.submittedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default StudentDashboard;
