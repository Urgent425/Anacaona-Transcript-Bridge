//src/components/SecuritySection.jsx
import React from "react";
import { ShieldCheck, Building2, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

const ITEM_IDS = ["s1", "s2", "s3"];
const ITEM_ICONS = {
  s1: <ShieldCheck className="w-5 h-5" />,
  s2: <Building2 className="w-5 h-5" />,
  s3: <Eye className="w-5 h-5" />,
};

export default function SecuritySection() {
  const { t } = useTranslation();

  return (
    <section className="bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.25),transparent_80%)] text-white border-t border-white/5 py-20 md:py-24 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          {t("security.title")}
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mt-4 text-base">
          {t("security.subtitle")}
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 text-left">
          {ITEM_IDS.map((id) => (
            <div
              key={id}
              className="rounded-2xl bg-white/5 border border-white/10 p-6"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300/20 to-orange-500/10 text-amber-300 border border-amber-400/30 mb-4">
                {ITEM_ICONS[id]}
              </div>
              <h3 className="text-white font-semibold text-lg">
                {t(`security.items.${id}.title`)}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">
                {t(`security.items.${id}.desc`)}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 mt-10">
          {t("security.footnote")}
        </p>
      </div>
    </section>
  );
}
