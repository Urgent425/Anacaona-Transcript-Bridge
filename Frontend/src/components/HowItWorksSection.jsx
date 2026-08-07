//src/components/HowItWorksSection.jsx
import React from "react";
import { Upload, CheckCircle2, SendHorizonal } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const STEP_IDS = ["s1", "s2", "s3"];
const STEP_ICONS = {
  s1: <Upload className="w-5 h-5" />,
  s2: <CheckCircle2 className="w-5 h-5" />,
  s3: <SendHorizonal className="w-5 h-5" />,
};

export default function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section
      id="how"
      className="bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.25),transparent_80%)] text-white border-t border-white/5 py-20 md:py-28 px-6"
    >
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          {t("howItWorks.title")}
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mt-4 text-base md:text-lg">
          {t("howItWorks.subtitle")}
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEP_IDS.map((id, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="relative rounded-2xl bg-white/5 border border-white/10 p-6 text-left shadow-[0_30px_80px_-10px_rgba(0,0,0,0.8)]"
            >
              <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-300/20 to-orange-500/10 text-amber-300 border border-amber-400/30 w-10 h-10 mb-4">
                {STEP_ICONS[id]}
              </div>
              <h3 className="text-lg font-semibold text-white">
                {t(`howItWorks.steps.${id}.title`)}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">
                {t(`howItWorks.steps.${id}.desc`)}
              </p>
              <p className="text-[11px] text-slate-500 mt-3">{t(`howItWorks.steps.${id}.note`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
