# ELQOR4N — Developer Guide

Deep dive for maintainers and contributors. If you only want to run the app, read [`README.md`](README.md) first.

---

## Table of contents

1. [Project architecture](#project-architecture)
2. [Folder structure](#folder-structure)
3. [State management](#state-management)
4. [Branding architecture](#branding-architecture)
5. [Collaboration architecture](#collaboration-architecture)
6. [Localization system](#localization-system)
7. [PWA configuration](#pwa-configuration)
8. [Build process](#build-process)
9. [Deployment to Vercel](#deployment-to-vercel)
10. [Future maintenance notes](#future-maintenance-notes)

---

## Project architecture

ELQOR4N is a **TanStack Start v1** app (React 19 + Vite 7 + Nitro). It runs 100 % client-side after hydration; there is currently no server database. Every page is a route file under `src/routes/` and shares:

- `src/routes/__root.tsx` — HTML shell, providers (React Query, Sonner Toaster, theme), the inline `InstallBanner`, and the bottom navigation.
- `src/router.tsx` — creates the `QueryClient` and wires the router.
- `src/client.tsx` — hydration entry. Intentionally **not** wrapped in `React.StrictMode` because the Quran video studio does heavy canvas + audio work that double-runs badly in strict mode.

The heavy Quran video studio lives in its own self-contained subtree at `src/features/quran-video/` so its dependencies (`mp4-muxer`, `@ffmpeg/ffmpeg`, audio hooks) never leak into the initial route bundle.

## Folder structure

```
src/
├── assets/                     # Bundled images (logos, branding)
├── components/
│   ├── slides/                 # CoverSlide, ClosingSlide, HisnSlide, NawawiSlide, ...
│   ├── tweet/                  # TweetCard rendered to canvas
│   ├── ui/                     # shadcn-style primitives (Button, Switch, Dialog, ...)
│   ├── BrandGroup.tsx          # Renders one brand block (logo + handle)
│   ├── BrandLogo.tsx           # Auto-contrast logo (adapts to light/dark surfaces)
│   ├── ShareMenu.tsx           # Universal share control with pre-warm + timeout
│   ├── InstallBanner.tsx       # Inline PWA install prompt
│   ├── BottomNav.tsx           # Bottom tab bar
│   └── TopNav.tsx              # Per-page top bar
├── features/
│   └── quran-video/            # Full Quran video studio
│       ├── App.jsx             # Orchestration
│       ├── QuranVideoApp.jsx   # Wrapper, sets RTL + Arabic lang
│       ├── components/         # SettingsPanel, PreviewPanel
│       ├── hooks/              # useQuranData, useVideoExport, useAudioBlob, useCanvasRenderer
│       ├── services/           # quranApi (Quran.com wrapper)
│       ├── data/               # Static reciter / background / translation catalogues
│       ├── i18n/               # Feature-scoped i18next instance
│       └── quran-video.css     # Scoped styles for the studio
├── lib/
│   ├── settings.ts             # Zustand store — branding, collaboration, per-generator prefs
│   ├── share.ts                # Web Share API helpers, gesture-safe
│   ├── register-pwa.ts         # Guarded service-worker registration
│   ├── export.ts               # Slide → PNG / carousel → ZIP export helpers
│   ├── hijri.ts, hisn.ts, nawawi.ts, quran.ts, surah-names.ts   # Data helpers
│   └── error-capture.ts        # Global error hook feeding sonner
└── routes/                     # File-based TanStack routes
```

## State management

**Zustand + persist.** The single source of truth is `src/lib/settings.ts`:

```
useSettings ──┬── shared branding (logoUrl, username, brandDisplay)
              ├── collaboration (enabled, secondaryLogoUrl, secondaryUsername, secondaryDisplay)
              ├── per-generator namespaces
              │      quran, nawawi, hisn, tweet, reelCover
              ├── theme, language, autoSave, ...
              └── user profile (email, displayName, photoURL) once signed in
```

Persist is scoped to `localStorage['elqor4n:settings']`. A migration function bumps stored versions when the schema changes.

Component-local UI state (dialog open, form drafts) uses standard `useState`. React Query owns all remote data (chapters, reciters, timings). Never call `setState` from a `useEffect` that runs on every render — it caused the "another app loading inside" symptom we fixed.

## Branding architecture

Every generator reads branding through `useResolvedBranding()` in `src/lib/settings.ts`. That helper:

1. Reads the shared logo / username.
2. Applies signed-in profile overrides if the user has custom branding saved.
3. Applies collaboration overrides when `collaboration === true`.

Rendering rules:

- **Handles** always pass through `formatHandle(input, fallback)` → normalises to `@handle` (never `handle@`).
- **Logos** use `<BrandLogo variant="auto|light|dark" />` which flips contrast via CSS filter.
- **Brand display mode** — each brand may be shown as `both` (logo + name), `logo`, or `name`. All slide/tweet/watermark components honour this.

## Collaboration architecture

`collaboration` is a single boolean on the store. When true:

- **Slides** (`HisnSlide`, `NawawiSlide`, `CoverSlide`, `ClosingSlide`) render two `<BrandGroup />` blocks separated by an `×` glyph on the first and last slide of each carousel.
- **Reel watermarks** are constrained to `top-center` / `bottom-center` (the only positions that fit two logos gracefully).
- **Tweet cards** show a brand selector above the preview because a single tweet uses only one identity; the selection lives in local component state.
- **Quran videos & reel covers** always render both logos in the bottom overlay.

The default secondary brand is bundled in `src/assets/fajr-al-tilawa-logo.png` and exported as `DEFAULT_SECONDARY_LOGO`.

## Localization system

- Global UI is Arabic-only (RTL). The `<html lang="ar" dir="rtl">` shell is set in `__root.tsx`'s `RootShell`.
- The Quran video studio uses its own `i18next` instance under `src/features/quran-video/i18n/`:
  - `ar.js` — the shipped language.
  - `en.js` — silent fallback so a missing key never renders as `size_16:9`.
  - Init runs once at module scope with `nsSeparator: false, keySeparator: false` because size IDs contain `:`.
- Text visible to end users must always be Arabic. Console logs, error messages for developers, and code comments stay in English.

## PWA configuration

- `vite-plugin-pwa` with `strategies: 'generateSW'`, `registerType: 'autoUpdate'`, `injectRegister: null` (we register manually in `src/lib/register-pwa.ts`).
- Manifest is served from `public/manifest.webmanifest` (`manifest: false` in the plugin config to avoid duplication).
- Workbox runtime caching:
  - Navigations → `NetworkFirst` (4-second network timeout) — HTML never goes stale.
  - `/quran/`, `/data/`, `/fonts/` → `CacheFirst` (long TTL) — static Quran data.
  - Same-origin images and woff/woff2 → `CacheFirst`.
- Registration guards in `register-pwa.ts`:
  - Skips dev, `id-preview--*` / `preview--*` hosts, iframes, and `?sw=off`.
  - Unregisters stale `sw.js` in any of those contexts.

To force a full cache purge for a returning user, ship a kill-switch update: temporarily replace `public/sw.js` with a worker that empties its own caches and calls `self.registration.unregister()`.

## Build process

- `bun run dev` — Vite dev server on `:8080`. `optimizeDeps.include` pre-bundles React so HMR is fast even with the studio open.
- `bun run build` — Nitro build. Preset defaults to `cloudflare-module` and outputs to `dist/`.
- `bun run build:dev` — the same production pipeline but unminified for debugging.
- `bun run preview` — serves the built app locally on the same origin as prod.

The build automatically:

1. Runs the Tailwind Lightning CSS transformer over `src/styles.css`.
2. Emits hashed JS/CSS chunks + a Workbox-generated `sw.js` + a precache manifest.
3. Copies everything under `public/` verbatim.
4. Emits Nitro server output under `dist/server`.

## Deployment to Vercel

- `vercel.json` sets `NITRO_PRESET=vercel` and points the build command at `bun run build`.
- Vercel picks up the resulting `.vercel/output` structure automatically.
- No environment variables are required for the current features.
- Preview deployments (branch pushes) share the same build; the PWA guard prevents the service worker from registering on preview subdomains.

## Future maintenance notes

- **When you add a new generator**:
  1. Add a route file under `src/routes/<name>.tsx`.
  2. Add a namespace on the Zustand store if the generator has its own settings.
  3. Read branding through `useResolvedBranding()` — do not duplicate the shared logic.
  4. Wire share via `<ShareMenu getFile={...} title={...} text={...} />`.
- **When you add a new npm dependency**: prefer packages with no Node-only bindings so the Cloudflare / Vercel runtime can bundle them without polyfills.
- **When you upgrade React or TanStack Router**: run the full generator suite manually (Ahzab, Hisn, Nawawi, Tweet, Reel, Reel Cover, Quran Video) — hydration mismatches in RTL layouts are the most common regression.
- **When you touch the service worker config**: bump nothing manually. Workbox invalidates precache on any asset hash change. If users report stale content after a deploy, temporarily ship a kill-switch worker as described in the PWA section.
- **Never** store roles or permissions client-side; if user roles are ever introduced, use a proper backend (Supabase RLS + `has_role` security-definer function).
- **Never** re-enable `React.StrictMode` in `src/client.tsx` without profiling the Quran video studio first — double-mount effects trigger double network fetches and double canvas rebuilds.
