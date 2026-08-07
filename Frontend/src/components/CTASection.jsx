//src/components/CTASection.jsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CTASection({
  title,
  description,
  buttonLabel,
  buttonLink = "/register",
}) {
  const { t } = useTranslation();
  const finalTitle = title ?? t("cta.title");
  const finalDescription = description ?? t("cta.description");
  const finalButtonLabel = buttonLabel ?? t("cta.buttonLabel");

  return (
    <section className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-900 py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {finalTitle}
        </h2>
        <p className="text-slate-800/80 mt-3 text-base md:text-lg max-w-2xl mx-auto">
          {finalDescription}
        </p>
        <Link
          to={buttonLink}
          className="mt-8 inline-block bg-slate-900 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
        >
          {finalButtonLabel}
        </Link>
      </div>
    </section>
  );
}
