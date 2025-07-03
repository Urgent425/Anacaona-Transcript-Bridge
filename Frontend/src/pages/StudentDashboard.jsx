import React, { useState, useEffect } from "react";
import EvaluationSection from "../components/EvaluationSection";
import TranslationSection from "../components/TranslationSection";
const StudentDashboard = () => {
  
  const [currentSection, setCurrentSection] = useState("evaluation"); // Default to "evaluation" section  
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <h2 className="text-2xl font-bold text-center mb-4">
        Student Dashboard
      </h2>
       {/* Section buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setCurrentSection("evaluation")}
          className={`py-2 px-6 rounded ${currentSection === "evaluation" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
        >
          Evaluation Submission
        </button>
        <button
          onClick={() => setCurrentSection("translation")}
          className={`py-2 px-6 rounded ${currentSection === "translation" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
        >
          Translation Only
        </button>
      </div>
      <div className="mt-4">
      {currentSection === "evaluation" && <EvaluationSection />}
      {currentSection === "translation" && <TranslationSection />}
      </div>
    
      
     
    </div>
  );
};

export default StudentDashboard;
