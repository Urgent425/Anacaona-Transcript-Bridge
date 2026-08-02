// src/components/TrustSection.jsx
import React from "react";
import { ShieldOff, Lock, Undo2, Mail } from "lucide-react";
import { motion } from "framer-motion";

const ITEMS = [
  {
    icon: <ShieldOff className="w-5 h-5" />,
    title: "We're not a government office",
    desc: "Anacaona is an independent service that prepares, submits, and tracks your request. Archives Nationales, DCPJ, OAVCT, DGI, and your school retain full authority to approve, reject, or issue the document.",
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Your ID is reviewed, not published",
    desc: "A government ID is only used to verify your identity before your request is sent forward. It's encrypted, visible only to the reviewing team, and never shared beyond that review.",
  },
  {
    icon: <Undo2 className="w-5 h-5" />,
    title: "You're in control until you pay",
    desc: "Made a mistake or changed your mind? You can delete an uploaded document yourself at any point before payment — no waiting on support.",
  },
  {
    icon: <Mail className="w-5 h-5" />,
    title: "A real team, not a chatbot maze",
    desc: "Questions or concerns reach a person directly at onlinesupport@anacaonaservices.org, or through our contact page.",
  },
];

export default function TrustSection() {
  return (
    <section className="bg-slate-950 text-white border-t border-white/5 py-20 md:py-24 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          Why families trust us with something this personal
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mt-4 text-base">
          Requesting a police record, a birth certificate, or a tax document
          means handing over identity details. Here's exactly how we handle that.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 text-left">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-6"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300/20 to-orange-500/10 text-amber-300 border border-amber-400/30 mb-4">
                {item.icon}
              </div>
              <h3 className="text-white font-semibold text-lg">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
