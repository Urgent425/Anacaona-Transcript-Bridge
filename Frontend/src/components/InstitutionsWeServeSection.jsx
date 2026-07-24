// src/components/InstitutionsWeServeSection.jsx
import React from "react";
import { Landmark, GraduationCap, ShieldCheck, FileText } from "lucide-react";
import { motion } from "framer-motion";

const GROUPS = [
  {
    icon: <GraduationCap className="w-5 h-5" />,
    label: "Universities & Schools",
    desc: "Transcript and credential evaluation for higher-ed institutions across Haiti.",
  },
  {
    icon: <Landmark className="w-5 h-5" />,
    label: "Archives Nationales d'Haïti",
    desc: "Civil records: birth, marriage, death, and divorce certificates.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    label: "DCPJ",
    desc: "Police certificates and background record requests.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    label: "DGI",
    desc: "Tax certificates and related government filings.",
  },
  {
    icon: <Landmark className="w-5 h-5" />,
    label: "OAVCT",
    desc: "Vehicle insurance and related official records.",
  },
];

export default function InstitutionsWeServeSection() {
  return (
    <section className="bg-slate-950 text-white border-t border-white/5 py-20 md:py-24 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          Institutions we work with
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mt-4 text-base">
          From university registrars to national institutions, every request
          is routed to the right place and reviewed before anything is
          released.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5 text-left">
          {GROUPS.map((g, i) => (
            <motion.div
              key={g.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-5"
            >
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300/20 to-orange-500/10 text-amber-300 border border-amber-400/30 mb-3">
                {g.icon}
              </div>
              <h3 className="text-sm font-semibold text-white leading-snug">{g.label}</h3>
              <p className="text-slate-400 text-xs leading-relaxed mt-2">{g.desc}</p>
            </motion.div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 mt-8">
          More state institutions are being added. Don’t see yours? Contact us and we’ll look into it.
        </p>
      </div>
    </section>
  );
}
