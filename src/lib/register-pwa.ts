// Guarded PWA service worker registration.
// - Never registers in dev, preview hosts, iframes, or when ?sw=off is set.
// - Unregisters matching stale registrations in those contexts.
export function registerPWA() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const host = window.location.hostname;
  const inIframe = window.self !== window.top;
  const isPreview = host.startsWith("id-preview--") || host.startsWith("preview--");
  const killSwitch = url.searchParams.get("sw") === "off";
  const isProd = import.meta.env.PROD;

  const shouldRegister = isProd && !inIframe && !isPreview && !killSwitch;

  if (!shouldRegister) {
    navigator.serviceWorker.getRegistrations?.().then((regs) => {
      for (const r of regs) {
        if (r.active?.scriptURL.endsWith("/sw.js")) r.unregister().catch(() => {});
      }
    }).catch(() => {});
    return;
  }

  window.addEventListener("load", () => {
    import("workbox-window")
      .then(({ Workbox }) => {
        const wb = new Workbox("/sw.js");
        wb.register().catch(() => {});
      })
      .catch(() => {});
  });
}
