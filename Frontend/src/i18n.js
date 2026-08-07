// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enHome from "./locales/en/home.json";
import frHome from "./locales/fr/home.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { home: enHome },
      fr: { home: frHome },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "fr"],
    ns: ["home"],
    defaultNS: "home",

    detection: {
      // Check localStorage first (explicit user choice), then fall back to
      // the browser's language on a first visit.
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "anacaona_lang",
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      // Lets us embed <span> highlights inside a translated sentence via <Trans>
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ["span", "strong", "em"],
    },
  });

export default i18n;
