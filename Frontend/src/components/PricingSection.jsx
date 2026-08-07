//src/components/PricingSection.jsx
import React from "react";
import { ArrowRight, FileText, Languages, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <section
    id="pricing"
    className="bg-gradient-to-b from-slate-950 to-slate-200 text-white py-20 md:py-28 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            {t("pricing.title")}
          </h2>
          <p className="text-slate-400 mt-4 text-base md:text-lg">
            {t("pricing.subtitle")}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <PricingCard
            icon={<FileText className="w-5 h-5" />}
            title={t("pricing.evaluation.title")}
            price={t("pricing.evaluation.price")}
            unit={t("pricing.evaluation.unit")}
            bullets={[
              t("pricing.evaluation.b1"),
              t("pricing.evaluation.b2"),
              t("pricing.evaluation.b3"),
            ]}
            cta={t("pricing.evaluation.cta")}
          />

          <PricingCard
            icon={<ShieldCheck className="w-5 h-5" />}
            title={t("pricing.documentRequest.title")}
            price={t("pricing.documentRequest.price")}
            unit={t("pricing.documentRequest.unit")}
            bullets={[
              t("pricing.documentRequest.b1"),
              t("pricing.documentRequest.b2"),
              t("pricing.documentRequest.b3"),
            ]}
            cta={t("pricing.documentRequest.cta")}
          />

          <PricingCard
            icon={<Languages className="w-5 h-5" />}
            title={t("pricing.translation.title")}
            price={t("pricing.translation.price")}
            unit={t("pricing.translation.unit")}
            bullets={[
              t("pricing.translation.b1"),
              t("pricing.translation.b2"),
              t("pricing.translation.b3"),
            ]}
            cta={t("pricing.translation.cta")}
          />
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          {t("pricing.footnote")}
        </p>
      </div>
    </section>
  );
}
