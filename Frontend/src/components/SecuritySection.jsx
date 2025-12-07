//src/components/SecuritySection.jsx
import React from "react";
import { ShieldCheck, Building2, Eye } from "lucide-react";

const items = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Protected",
    desc: "All documents are encrypted in transit and at rest.",
  },
  {
    icon: <Building2 className="w-5 h-5" />,
    title: "Institution-backed",
    desc: "Your school approves before anything is sent.",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Full visibility",
    desc: "You can track every step in your dashboard.",
  },
];

export default function SecuritySection() {
  return (
    <section className="bg-slate-950 text-white border-t border-white/5 py-20 md:py-24 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          Your documents are sensitive. We treat them like that.
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mt-4 text-base">
          Passports, diplomas, birth certificates — we know what’s at stake.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 text-left">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/5 border border-white/10 p-6"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300/20 to-orange-500/10 text-amber-300 border border-amber-400/30 mb-4">
                {item.icon}
              </div>
              <h3 className="text-white font-semibold text-lg">
                {item.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 mt-10">
          Proudly serving Haitian students 🇭🇹 working toward opportunities in
          🇺🇸 🇨🇦 🇫🇷
        </p>
      </div>
    </section>
  );
}
