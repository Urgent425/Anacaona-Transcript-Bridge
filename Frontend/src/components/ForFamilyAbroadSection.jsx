// src/components/ForFamilyAbroadSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import { UserRoundPlus, IdCard, ClipboardCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  {
    icon: <UserRoundPlus className="w-5 h-5" />,
    title: "Create your account",
    desc: "You sign up — the account and payment stay with you, wherever you are.",
  },
  {
    icon: <IdCard className="w-5 h-5" />,
    title: "Enter their information",
    desc: "Submit the request using your family member's legal name, date of birth, and ID — the document is issued to them, not you.",
  },
  {
    icon: <ClipboardCheck className="w-5 h-5" />,
    title: "Track it from anywhere",
    desc: "Follow the status, pay, and get notified the moment the institution responds — no phone tag, no waiting in line back home.",
  },
];

export default function ForFamilyAbroadSection() {
  return (
    <section id="family" className="bg-gradient-to-b from-slate-950 to-slate-900 text-white border-t border-white/5 py-20 md:py-24 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Handling this for family back home?
          </h2>
          <p className="text-slate-400 mt-4 text-base leading-relaxed max-w-lg mx-auto md:mx-0">
            A lot of what we do is for someone who isn't the one sitting at
            the keyboard — a parent's birth certificate, a sibling's police
            record, a document a relative in Haiti needs but can't easily
            request themselves. You handle it from wherever you are; they
            get the document.
          </p>

          <Link
            to="/register?flow=document-request"
            className="mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-slate-900 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 shadow-[0_20px_60px_-10px_rgba(251,191,36,0.5)] hover:shadow-[0_30px_80px_-10px_rgba(251,191,36,0.7)] transition-shadow"
          >
            Start a request for someone else
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        <div className="space-y-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-start gap-4 rounded-2xl bg-white/5 border border-white/10 p-5 text-left"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-300/20 to-orange-500/10 text-amber-300 border border-amber-400/30">
                {s.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mt-1">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
