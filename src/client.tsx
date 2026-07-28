import { startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

// Custom client entry.
//
// TanStack Start's default entry wraps the app in <StrictMode>, which in
// development double-mounts every component and re-runs every effect. On
// heavy pages like /quran-video (canvas rendering at export resolution +
// multiple network fetches + audio decoding) that double-invocation is what
// makes the page feel like "another application is being loaded inside
// ELQOR4N": two i18n inits, two chapters/reciters/timings/audio fetches,
// two canvas renders per state change, and effects that appear to fire on
// their own.
//
// The published (production) build never runs StrictMode, so this change
// only affects development ergonomics — the runtime tree is identical.
startTransition(() => {
  hydrateRoot(document, <StartClient />);
});