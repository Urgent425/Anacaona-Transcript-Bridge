//scr/pages/StudentDashboard
import React, { useState } from "react";
import { Info, FileText, Languages, ArrowRight, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import EvaluationSection from "../components/EvaluationSection";
import TranslationSection from "../components/TranslationSection";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  // Start with no section selected → show the Overview
  const [currentSection, setCurrentSection] = useState(null); // "evaluation" | "translation" | null
  const [showHelp, setShowHelp] = useState(false);
  const { user} = useAuth();
  const displayName = user?.firstName ?? user?.name ?? "User";

  const SectionHeader = ({ title, subtitle }) => (
    <div className="text-center space-y-2">
      <h2 className="text-2xl font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
    </div>
  );

  const OverviewCard = ({ icon, title, desc, bullets = [], cta, onClick }) => (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6 flex flex-col">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-slate-900 text-white">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600 mt-1">{desc}</p>
        </div>
      </div>

      {bullets.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-slate-700 list-disc list-inside">
          {bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}

      <div className="mt-5">
        <button
          onClick={onClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-sm"
        >
          {cta} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const InfoBanner = () => (
    <div className="rounded-xl bg-sky-50 ring-1 ring-sky-200 text-sky-800 p-4 flex items-start gap-3">
      <Info className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="text-sm">
        <div className="font-medium">Welcome to your dashboard</div>
        <p className="mt-1">
          Choose <strong>Evaluation Submission</strong> if you want us to send your transcript package
          for credential evaluation (e.g., WES). Choose <strong>Translation Only</strong> if you just need
          certified translations.
        </p>
      </div>
    </div>
  );

  const HelpAccordion = () => (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
      <button
        onClick={() => setShowHelp((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2 text-slate-800">
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm font-medium">How does this work?</span>
        </div>
        {showHelp ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {showHelp && (
        <div className="px-4 pb-4 text-sm text-slate-600 space-y-3">
          <div>
            <div className="font-medium text-slate-800">Evaluation Submission</div>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Pick a purpose (Education, Professional or Immigration).</li>
              <li>Upload multiple documents; mark any that need translation.</li>
              <li>We package and send your files to evaluation partners (e.g., WES).</li>
              <li>Track approval and official uploads from institutions.</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-slate-800">Translation Only</div>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Upload the documents that need certified translation.</li>
              <li>Select the source language (French or Spanish).</li>
              <li>Get clear pricing before you proceed to payment.</li>
              <li>Download final translations when completed.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  if (!currentSection) {
    // Overview (no section selected yet)
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <SectionHeader
          title= {`Welcome back ${displayName}`}
          subtitle="Select what you want to do today. We’ll guide you step by step."
        />

        <InfoBanner />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <OverviewCard
            icon={<FileText className="w-5 h-5" />}
            title="Evaluation Submission"
            desc="Build a package for credential evaluation (e.g., WES). We can translate documents as part of the submission."
            bullets={[
              "Choose purpose: Education or Immigration",
              "Upload multiple files with per-file translation options",
              "See pricing and track status end-to-end",
            ]}
            cta="Start Evaluation"
            onClick={() => setCurrentSection("evaluation")}
          />

          <OverviewCard
            icon={<Languages className="w-5 h-5" />}
            title="Translation Only"
            desc="Need certified translation but not an evaluation? Upload your documents and select the source language."
            bullets={[
              "Upload files that need translation only",
              "Pick source language (French or Spanish)",
              "Transparent pricing before payment",
            ]}
            cta="Start Translation"
            onClick={() => setCurrentSection("translation")}
          />
        </div>

        <HelpAccordion />
      </div>
    );
  }

  // Section selected (Evaluation or Translation)
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {currentSection === "evaluation" ? "Evaluation Submission" : "Translation Only"}
        </h2>

        <button
          onClick={() => setCurrentSection(null)}
          className="text-sm px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Back to Overview
        </button>
      </div>

      {currentSection === "evaluation" && <EvaluationSection />}
      {currentSection === "translation" && <TranslationSection />}
    </div>
  );
}
