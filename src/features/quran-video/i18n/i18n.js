import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { ar } from "./ar";
import { en } from "./en";

// The Quran Video studio is a native ELQOR4N page — Arabic-only UI, matching
// the rest of the app. English resources are kept as a silent fallback so old
// keys never render as raw identifiers.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { ar: { translation: ar }, en: { translation: en } },
    lng: "ar",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    // Size keys contain ":" (e.g. "size_16:9") — disable i18next's namespace
    // and key separators so they resolve as flat keys.
    nsSeparator: false,
    keySeparator: false,
  });
}

export default i18n;
