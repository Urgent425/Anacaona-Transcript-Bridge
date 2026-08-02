// src/components/FAQSection.jsx
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is Anacaona part of the Haitian government?",
    a: "No. Anacaona is an independent service that prepares, submits, and tracks your request. The institution itself — your school, Archives Nationales, DCPJ, OAVCT, or DGI — always makes the final decision to approve, reject, or issue the document.",
  },
  {
    q: "How long will my request take?",
    a: "It depends on the institution and the type of document — some move faster than others. You'll see live status updates in your dashboard the entire time, so you're never left guessing.",
  },
  {
    q: "Is my government ID really safe?",
    a: "Yes. It's encrypted and used only to verify your identity before your request is sent forward. It's visible only to the reviewing team and is never published or shared beyond that review.",
  },
  {
    q: "Can I request a document for a family member in Haiti?",
    a: "Yes. Submit the request using their legal name, date of birth, and ID information — the document is issued in their name. You handle the account and payment from wherever you are.",
  },
  {
    q: "What happens if my request is rejected?",
    a: "You'll see the reason directly in your dashboard. Reach out to our support team and we'll help you understand next steps for your specific case.",
  },
  {
    q: "How do I pay, and can I pay for several requests at once?",
    a: "Payment is by card through Stripe. You can pay for each document individually, or use the \"Pay Total Due\" option to cover every pending request in one checkout.",
  },
];

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-white">{item.q}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-slate-900 text-white border-t border-white/5 py-20 md:py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Common questions
          </h2>
          <p className="text-slate-400 mt-4 text-base">
            Still unsure about something? <a href="/contact" className="text-amber-300 underline underline-offset-2 hover:text-amber-200">Reach out</a> — a real person will answer.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((item, i) => (
            <FAQItem
              key={item.q}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
