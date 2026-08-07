// src/components/FAQSection.jsx
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

const FAQ_IDS = ["q1", "q2", "q3", "q4", "q5", "q6"];

function FAQItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-white">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-slate-900 text-white border-t border-white/5 py-20 md:py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            {t("faq.title")}
          </h2>
          <p className="text-slate-400 mt-4 text-base">
            {t("faq.subtitlePrefix")}{" "}
            <a href="/contact" className="text-amber-300 underline underline-offset-2 hover:text-amber-200">
              {t("faq.subtitleLink")}
            </a>{" "}
            {t("faq.subtitleSuffix")}
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQ_IDS.map((id, i) => (
            <FAQItem
              key={id}
              q={t(`faq.items.${id}.q`)}
              a={t(`faq.items.${id}.a`)}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
