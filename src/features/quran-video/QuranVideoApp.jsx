import "./i18n/i18n";
import App from "./App.jsx";

// Arabic-only, matching the rest of ELQOR4N. Root is RTL so headings and
// section titles align to the right, consistent with the Arabic interface.
// Individual LTR controls (sliders, colour inputs, numeric labels) opt in
// locally with `dir="ltr"`.
export default function QuranVideoApp() {
  return (
    <div className="quran-video-root" dir="rtl" lang="ar">
      <App />
    </div>
  );
}
