// src/components/TrustSection.jsx
import React from "react";
import { ShieldOff, Lock, Undo2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const ITEM_IDS = ["t1", "t2", "t3", "t4"];
const ITEM_ICONS = {
  t1: <ShieldOff className="w-5 h-5" />,
  t2: <Lock className="w-5 h-5" />,
  t3: <Undo2 className="w-5 h-5" />,
  t4: <Mail className="w-5 h-5" />,
};

export default function TrustSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-slate-950 text-white border-t border-white/5 py-20 md:py-24 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          {t("trust.title")}
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mt-4 text-base">
          {t("trust.subtitle")}
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 text-left">
          {ITEM_IDS.map((id, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-6"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300/20 to-orange-500/10 text-amber-300 border border-amber-400/30 mb-4">
                {ITEM_ICONS[id]}
              </div>
              <h3 className="text-white font-semibold text-lg">{t(`trust.items.${id}.title`)}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">{t(`trust.items.${id}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
