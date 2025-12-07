//src/components/HeroSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Send, FileCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative bg-slate-950 text-white overflow-hidden pt-28 pb-20 md:pt-32 md:pb-32">
      {/* subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.15),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        {/* LEFT: Text content */}
        <div className="text-center md:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-white"
          >
            Get your Haitian transcripts{" "}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              recognized abroad
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-4 text-lg text-slate-300 max-w-lg mx-auto md:mx-0"
          >
            We work with Haitian institutions to verify and send your official
            transcripts — for education, immigration, and professional
            licensing. No travel. No WhatsApp favors.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
          >
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-slate-900 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 shadow-[0_20px_60px_-10px_rgba(251,191,36,0.5)] hover:shadow-[0_30px_80px_-10px_rgba(251,191,36,0.7)] transition-shadow"
            >
              <Send className="w-4 h-4 mr-2" />
              Get Started
            </Link>

            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-slate-200 border border-white/20 hover:bg-white/5 transition-colors"
            >
              How it works
            </a>
          </motion.div>

          {/* trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 flex flex-col sm:flex-row gap-4 text-sm text-slate-400 items-center md:items-start justify-center md:justify-start"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Encrypted & institution-approved</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span>Built for Haitian students</span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT: Mock status card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_30px_120px_-10px_rgba(251,191,36,0.4)] p-5 text-left">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white">
                Submission #AUC-2025-1182
              </p>
              <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                IN REVIEW
              </span>
            </div>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start justify-between">
                <span className="flex-1">
                  Transcript uploaded
                  <span className="block text-slate-500 text-[11px]">
                    Université d’État d’Haïti • Licence
                  </span>
                </span>
                <span className="ml-2 text-emerald-400 font-medium">
                  ✔ Verified
                </span>
              </li>
              <li className="flex items-start justify-between">
                <span className="flex-1">
                  Official validation by institution
                  <span className="block text-slate-500 text-[11px]">
                    Registrar confirmed authenticity
                  </span>
                </span>
                <span className="ml-2 text-yellow-300 font-medium">
                  ⏳ Pending
                </span>
              </li>
              <li className="flex items-start justify-between">
                <span className="flex-1">
                  Sent to WES
                  <span className="block text-slate-500 text-[11px]">
                    For education equivalency
                  </span>
                </span>
                <span className="ml-2 text-slate-400 font-medium">—</span>
              </li>
            </ul>

            <div className="mt-5 text-center">
              <span className="inline-block text-[11px] text-slate-400">
                “Track every step in your dashboard.”
              </span>
            </div>
          </div>

          {/* glowing ring accent */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400/20 via-transparent to-transparent blur-2xl pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
