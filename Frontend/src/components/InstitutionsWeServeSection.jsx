// src/components/InstitutionsWeServeSection.jsx
import React from "react";
import { Landmark, GraduationCap, ShieldCheck, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const GROUP_IDS = ["universities", "archives", "dcpj", "dgi", "oavct"];
const GROUP_ICONS = {
  universities: <GraduationCap className="w-5 h-5" />,
  archives: <Landmark className="w-5 h-5" />,
  dcpj: <ShieldCheck className="w-5 h-5" />,
  dgi: <FileText className="w-5 h-5" />,
  oavct: <Landmark className="w-5 h-5" />,
};

export default function InstitutionsWeServeSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-slate-950 text-white border-t border-white/5 py-20 md:py-24 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          {t("institutions.title")}
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mt-4 text-base">
          {t("institutions.subtitle")}
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5 text-left">
          {GROUP_IDS.map((id, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-5"
            >
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300/20 to-orange-500/10 text-amber-300 border border-amber-400/30 mb-3">
                {GROUP_ICONS[id]}
              </div>
              <h3 className="text-sm font-semibold text-white leading-snug">
                {t(`institutions.groups.${id}.label`)}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mt-2">
                {t(`institutions.groups.${id}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 mt-8">
          {t("institutions.footnote")}
        </p>
      </div>
    </section>
  );
}
