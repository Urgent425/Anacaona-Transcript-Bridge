//src/components/CTASection.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-900 py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Ready to send your transcript?
        </h2>
        <p className="text-slate-800/80 mt-3 text-base md:text-lg max-w-2xl mx-auto">
          Create your account and start your first request in minutes. You
          don't have to call Haiti. You don't have to fly.
        </p>
        <Link
          to="/register"
          className="mt-8 inline-block bg-slate-900 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
        >
          Create my account
        </Link>
      </div>
    </section>
  );
}
