// src/pages/TranslationLandingPage.jsx

import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  FileCheck,
  Languages,
  Award,
  CheckCircle,
  Upload,
  FileSignature,
  Mail,
} from "lucide-react";
import CTASection from "../components/CTASection";

export default function TranslationLandingPage() {
  return (
    <main className="bg-slate-950 text-white">

      {/* ================= HERO ================= */}
      <section className="relative pt-28 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.15),transparent_60%)] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
            Certified Translation for{" "}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              all Types of Documents
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-300 max-w-3xl mx-auto">
            French & Spanish → English certified translation accepted for
            immigration, education, and professional licensing.
            <br />
            <span className="text-white font-medium">
              Member of the American Translators Association (ATA).
            </span>
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register?flow=translation"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium text-slate-900 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 shadow-[0_20px_60px_-10px_rgba(251,191,36,0.5)] hover:shadow-[0_30px_80px_-10px_rgba(251,191,36,0.7)] transition-shadow"
            >
              Start Translation
            </Link>

            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium text-slate-200 border border-white/20 hover:bg-white/5 transition-colors"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* ================= TRUST BADGES ================= */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 text-sm text-slate-300">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Secure encrypted handling
          </div>

          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-400" />
            ATA Member
          </div>

          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-amber-400" />
            FR/ES → EN
          </div>

          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-amber-400" />
            Immigration-ready format
          </div>
        </div>
      </section>

      {/* ================= WHAT WE TRANSLATE ================= */}
      <section className="px-6 py-20 bg-white/5 border-y border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center">
            Documents We Commonly Translate
          </h2>

          <div className="mt-10 grid sm:grid-cols-2 gap-6 text-slate-300">
            {[
              "Birth Certificates (Acte de Naissance)",
              "Marriage Certificates",
              "Divorce Judgments",
              "Police Certificates",
              "Court Records",
              "Diplomas & Transcripts",
              "Professional Licenses",
              "Immigration Supporting Documents",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 mt-1 text-amber-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Simple 3-Step Process
          </h2>

          <div className="mt-12 grid md:grid-cols-3 gap-10 text-slate-300">
            <div>
              <Upload className="w-6 h-6 text-amber-400 mx-auto" />
              <h3 className="mt-4 font-medium">1. Upload Document</h3>
              <p className="mt-2 text-sm">
                Securely upload your document through your account.
              </p>
            </div>

            <div>
              <FileSignature className="w-6 h-6 text-amber-400 mx-auto" />
              <h3 className="mt-4 font-medium">2. Translation & Certification</h3>
              <p className="mt-2 text-sm">
                We translate and include a signed certification statement.
              </p>
            </div>

            <div>
              <Mail className="w-6 h-6 text-amber-400 mx-auto" />
              <h3 className="mt-4 font-medium">3. Receive Certified PDF</h3>
              <p className="mt-2 text-sm">
                Delivered hard copy or digitally, ready for submission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section
        id="pricing"
        className="px-6 py-24 bg-white/5 border-y border-white/10"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Transparent Pricing
          </h2>

          <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 p-8">
            <div className="text-4xl font-semibold text-amber-300">
              $25 <span className="text-base text-slate-400">/ page</span>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              <li>✔ Certified translation statement included</li>
              <li>✔ Immigration-ready format</li>
              <li>✔ Digital PDF delivery</li>
              <li>✔ No hidden fees</li>
            </ul>

            <p className="mt-6 text-sm text-slate-400">
              Standard turnaround: 2–3 business days. Rush available.
            </p>

            <Link
              to="/register?flow=translation"
              className="mt-8 inline-block bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 text-slate-900 text-sm font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              Start My Translation
            </Link>
          </div>
        </div>
      </section>

      {/* ================= LEGAL NOTE ================= */}
      <section className="px-6 py-16 text-center text-xs text-slate-400">
        Anacaona Transcript Bridge is a member of the American Translators
        Association (ATA). ATA membership does not imply ATA certification.
      </section>

      {/* ================= FINAL CTA ================= */}
    <CTASection
        title="Need certified translation today?"
        description="Upload your Haitian document and receive a certified English translation ready for immigration or academic submission."
        buttonLabel="Start Translation"
        buttonLink="/register?flow=translation"
    />
    </main>
  );
}
