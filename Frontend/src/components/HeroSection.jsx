// src/components/HeroSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Send,
  FileCheck,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Languages,
  Award,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const UPDATE_IDS = ["u0", "u1", "u2", "u3"];

const UPDATE_META = {
  u0: { ctaHref: "/register?flow=document-request", isRouterLink: true },
  u1: { ctaHref: "/register?flow=translation", isRouterLink: true },
  u2: { ctaHref: "#how", isRouterLink: false },
  u3: { ctaHref: "/register?flow=evaluation", isRouterLink: true },
};

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function UpdatesCard() {
  const { t } = useTranslation();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const items = UPDATE_IDS.map((id) => ({
    id,
    ...UPDATE_META[id],
    label: t(`hero.updates.${id}.label`),
    title: t(`hero.updates.${id}.title`),
    body: t(`hero.updates.${id}.body`),
    meta: t(`hero.updates.${id}.meta`),
    ctaLabel: t(`hero.updates.${id}.cta`),
  }));
  const current = items[index];

  const next = React.useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const prev = React.useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  React.useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_30px_120px_-10px_rgba(251,191,36,0.35)] p-5 text-left"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 border border-white/10">
              <Megaphone className="w-4 h-4 text-amber-300" />
            </span>
            <p className="text-sm font-medium text-white">{t("hero.updatesLabel")}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {t("hero.updatesSub")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-slate-200 hover:bg-white/10"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-slate-200 hover:bg-white/10"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl bg-white/5 border border-white/10 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-200 border border-amber-500/20">
              {current.label}
            </span>
            <span className="text-[10px] text-slate-400">{current.meta}</span>
          </div>

          <div className="mt-3">
            <div className="text-sm font-semibold text-white leading-snug">{current.title}</div>
            <div className="mt-1 text-xs text-slate-300 leading-relaxed">{current.body}</div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cx(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-6 bg-amber-300" : "w-2 bg-white/20 hover:bg-white/30"
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {current.isRouterLink ? (
              <Link
                to={current.ctaHref}
                className="text-[11px] font-medium text-amber-200 hover:text-amber-100 underline underline-offset-4"
              >
                {current.ctaLabel}
              </Link>
            ) : (
              <a
                href={current.ctaHref}
                className="text-[11px] font-medium text-amber-200 hover:text-amber-100 underline underline-offset-4"
              >
                {current.ctaLabel}
              </a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 text-center">
        <a href="#updates" className="inline-block text-[11px] text-slate-400 hover:text-slate-300">
          {t("hero.viewAllUpdates")}
        </a>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative bg-slate-950 text-white overflow-hidden pt-28 pb-20 md:pt-32 md:pb-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.15),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-white"
          >
            {t("hero.headlinePart1")}{" "}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              {t("hero.headlineHighlight")}
            </span>
            {" "}
            {t("hero.headlinePart2")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-4 text-lg text-slate-300 max-w-xl mx-auto md:mx-0"
          >
            {t("hero.subtitlePrefix")}{" "}
            <span className="text-white/90 font-medium">{t("hero.subtitleTranslation")}</span>{" "}
            {t("hero.subtitleMid1")}{" "}
            <span className="text-white/90 font-medium">{t("hero.subtitleWorkflow")}</span>{" "}
            {t("hero.subtitleMid2")}{" "}
            <span className="text-white/90 font-medium">{t("hero.subtitleDocuments")}</span>{" "}
            {t("hero.subtitleSuffix")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4 justify-center md:justify-start"
          >
            <Link
              to="/register?flow=evaluation"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-slate-900 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 shadow-[0_20px_60px_-10px_rgba(251,191,36,0.5)] hover:shadow-[0_30px_80px_-10px_rgba(251,191,36,0.7)] transition-shadow"
            >
              <Send className="w-4 h-4 mr-2" />
              {t("hero.ctaEvaluation")}
            </Link>

            <Link
              to="/register?flow=document-request"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-slate-200 border border-white/20 hover:bg-white/5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {t("hero.ctaDocumentRequest")}
            </Link>

            <Link
              to="/register?flow=translation"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-slate-200 border border-white/20 hover:bg-white/5 transition-colors"
            >
              <Languages className="w-4 h-4 mr-2" />
              {t("hero.ctaTranslation")}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 flex flex-col sm:flex-row gap-4 text-sm text-slate-400 items-center md:items-start justify-center md:justify-start"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{t("hero.badgeSecure")}</span>
            </div>

            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span>{t("hero.badgeInstitution")}</span>
            </div>

            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-amber-400" />
              <span>{t("hero.badgeTranslation")}</span>
            </div>

            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{t("hero.badgeAta")}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 flex justify-center md:justify-start"
          >
            <a
              href="#family"
              className="inline-flex items-center gap-2 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition-colors"
            >
              🌍 {t("hero.familyCallout")} <span className="text-amber-300 underline underline-offset-2">{t("hero.familyCalloutLink")}</span>
            </a>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <UpdatesCard />
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400/20 via-transparent to-transparent blur-2xl pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
