import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/i18n";
import App from "./App.jsx";

// Arabic-only, matching the rest of ELQOR4N. Root is RTL so headings and
// section titles align to the right, consistent with the Arabic interface.
// Individual LTR controls (sliders, colour inputs, numeric labels) opt in
// locally with `dir="ltr"`.
//
// NOTE: the i18n instance is imported as a *value* and passed to the provider
// on purpose. A bare side-effect import (`import "./i18n/i18n"`) is dropped by
// the production bundler because package.json declares `sideEffects: false`,
// which made the studio render untranslated strings once deployed.
export default function QuranVideoApp() {
  return (
    <I18nextProvider i18n={i18n}>
      <div className="quran-video-root" dir="rtl" lang="ar">
        <App />
      </div>
    </I18nextProvider>
  );
}
