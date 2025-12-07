//src/components/PricingSection.jsx
import React from "react";
import { ArrowRight, FileText, Languages } from "lucide-react";
import { Link } from "react-router-dom";

function PricingCard({ icon, title, price, unit, bullets, cta }) {
  return (
    <div className="relative rounded-2xl bg-white text-slate-900 shadow-xl ring-1 ring-slate-200/60 p-6 flex flex-col">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900/90 text-white shadow-md mb-4">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-slate-900">{price}</span>
        <span className="text-slate-500 text-sm">{unit}</span>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-600 flex-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-amber-500 font-semibold">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/register"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 transition-colors"
      >
        {cta}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Link>
    </div>
  );
}

export default function PricingSection() {
  return (
    <section
    id="pricing"
    className="bg-gradient-to-b from-slate-950 to-slate-900 text-white py-20 md:py-28 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Transparent pricing
          </h2>
          <p className="text-slate-400 mt-4 text-base md:text-lg">
            No hidden fees. No “agent.” You always see the status.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <PricingCard
            icon={<FileText className="w-5 h-5" />}
            title="Transcript Evaluation"
            price="$50"
            unit="/ submission"
            bullets={[
              "We work directly with your school registrar",
              "We confirm authenticity of your record",
              "We send it where you need (like WES)",
            ]}
            cta="Start an evaluation"
          />

          <PricingCard
            icon={<Languages className="w-5 h-5" />}
            title="Certified Translation"
            price="$25"
            unit="/ page"
            bullets={[
              "French or Spanish to English",
              "Meets education & immigration needs",
              "Delivered as certified PDF",
            ]}
            cta="Request translation"
          />
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          Pricing shown is indicative and may change.
        </p>
      </div>
    </section>
  );
}
