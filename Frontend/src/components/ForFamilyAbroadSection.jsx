// src/components/ForFamilyAbroadSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import { UserRoundPlus, IdCard, ClipboardCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const STEP_IDS = ["s1", "s2", "s3"];
const STEP_ICONS = {
  s1: <UserRoundPlus className="w-5 h-5" />,
  s2: <IdCard className="w-5 h-5" />,
  s3: <ClipboardCheck className="w-5 h-5" />,
};

export default function ForFamilyAbroadSection() {
  const { t } = useTranslation();

  return (
    <section id="family" className="bg-gradient-to-b from-slate-950 to-slate-900 text-white border-t border-white/5 py-20 md:py-24 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            {t("family.title")}
          </h2>
          <p className="text-slate-400 mt-4 text-base leading-relaxed max-w-lg mx-auto md:mx-0">
            {t("family.body")}
          </p>

          <Link
            to="/register?flow=document-request"
            className="mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-slate-900 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 shadow-[0_20px_60px_-10px_rgba(251,191,36,0.5)] hover:shadow-[0_30px_80px_-10px_rgba(251,191,36,0.7)] transition-shadow"
          >
            {t("family.cta")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        <div className="space-y-4">
          {STEP_IDS.map((id, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-start gap-4 rounded-2xl bg-white/5 border border-white/10 p-5 text-left"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-300/20 to-orange-500/10 text-amber-300 border border-amber-400/30">
                {STEP_ICONS[id]}
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{t(`family.steps.${id}.title`)}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mt-1">{t(`family.steps.${id}.desc`)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
