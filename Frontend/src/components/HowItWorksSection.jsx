//src/components/HowItWorksSection.jsx
import React from "react";
import { Upload, CheckCircle2, SendHorizonal } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: <Upload className="w-5 h-5" />,
    title: "Upload your documents",
    desc: "Transcript, diploma, birth certificate. PDF or clear photo accepted.",
    note: "Need translation? We handle it.",
  },
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    title: "Your school verifies",
    desc: "We work with Haitian institutions to confirm authenticity.",
    note: "No travel. No middleman.",
  },
  {
    icon: <SendHorizonal className="w-5 h-5" />,
    title: "We deliver it where you need",
    desc: "WES, immigration, employer, or licensing board.",
    note: "Official and trackable.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how"
      className="bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.25),transparent_80%)] text-white border-t border-white/5 py-20 md:py-28 px-6"
    >
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          How it works
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mt-4 text-base md:text-lg">
          Anacaona moves your education across borders — securely, and with
          respect for Haitian institutions.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="relative rounded-2xl bg-white/5 border border-white/10 p-6 text-left shadow-[0_30px_80px_-10px_rgba(0,0,0,0.8)]"
            >
              <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-300/20 to-orange-500/10 text-amber-300 border border-amber-400/30 w-10 h-10 mb-4">
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">
                {step.desc}
              </p>
              <p className="text-[11px] text-slate-500 mt-3">{step.note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
