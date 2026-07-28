# ELQOR4N · Islamic Content Platform

> A modern, non-profit, RTL-first web app for creating high-quality Islamic content — Quran posts, Hadith carousels, Hisn Al-Muslim slides, tweet cards, reels, reel covers, and Quran videos — with consistent branding and a shared collaboration mode.

Made with ❤️ by [@tayebg](https://github.com/tayebg). Live: [`elqor4n.com`](https://elqor4n.com).

---

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Installation](#installation)
- [Development](#development)
- [Build](#build)
- [Production deployment](#production-deployment)
- [PWA support](#pwa-support)
- [Branding system](#branding-system)
- [Collaboration mode](#collaboration-mode)
- [Project structure](#project-structure)
- [Environment variables](#environment-variables)
- [Credits](#credits)
- [License](#license)
- [Future improvements](#future-improvements)

---

## Features

- **Ahzab & Nawawi carousels** — 40 Hadith of An-Nawawi and daily Ahzab, formatted as ready-to-publish slide decks.
- **Hisn Al-Muslim generator** — every supplication from Hisn Al-Muslim as a shareable card set.
- **Daily Hadith poster** — auto-formatted narration cards with rotating themes.
- **Tweet card studio** — Twitter/X-style RTL tweet renderer with light / dim / dark themes.
- **Quran video studio** — verse-by-verse timed videos with translation/tafsir overlays, custom backgrounds (image or video), reciter selection, and 1080p export.
- **Reels & reel cover** — 9:16 Islamic reels with brand watermark and matching thumbnails.
- **Unified branding** — one setting drives the logo, username, and typography across every generator.
- **Collaboration mode** — a second brand can co-sign every generated asset.
- **Native share** — Web Share API level 2 (files) on mobile, download + platform composer on desktop.
- **Installable PWA** — home-screen install and offline shell.
- **Arabic-first UI** — RTL by default, English fallback in dev tooling only.

## Screenshots

Add real screenshots to `docs/screenshots/` and reference them here:

- `docs/screenshots/home.png` — home page
- `docs/screenshots/posts.png` — Ahzab / Nawawi generator
- `docs/screenshots/tweet.png` — tweet card studio
- `docs/screenshots/video.png` — Quran video studio

## Tech stack

- **Framework**: [TanStack Start v1](https://tanstack.com/start) (React 19, Vite 7, SSR-capable file-based routing)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite` (Lightning CSS)
- **UI primitives**: [Radix UI](https://www.radix-ui.com/) + shadcn-style local components under `src/components/ui/`
- **Icons**: [lucide-react](https://lucide.dev/)
- **State**: [Zustand](https://github.com/pmndrs/zustand) with `persist` for branding & user settings
- **Data**: [@tanstack/react-query](https://tanstack.com/query)
- **i18n**: [i18next](https://www.i18next.com/) + `react-i18next` (Arabic-only UI, English fallback for missing keys)
- **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (`generateSW`) with `workbox-window`
- **Media**: [html-to-image](https://github.com/bubkoo/html-to-image), [mp4-muxer](https://github.com/Vanilagy/mp4-muxer), [@ffmpeg/ffmpeg](https://ffmpegwasm.netlify.app/)
- **Utilities**: `zod`, `sonner`, `jszip`
- **Hosting**: Vercel (via `NITRO_PRESET=vercel`) — Cloudflare Workers preset also supported.

## Installation

Requirements:

- **Node.js** ≥ 20
- **[Bun](https://bun.sh/)** ≥ 1.1 (recommended). npm / pnpm also work.

```bash
git clone https://github.com/tayebg/elqor4n.git
cd elqor4n
bun install
```

## Development

```bash
bun run dev
```

Vite dev server starts on http://localhost:8080 with HMR. The service worker is disabled in dev to avoid stale caches.

## Build

```bash
# Production build (Cloudflare preset by default)
bun run build

# Vercel build
NITRO_PRESET=vercel bun run build

# Development build (unminified, for debugging prod issues locally)
bun run build:dev

# Preview a production build locally
bun run preview
```

## Production deployment

The project is configured for **Vercel** via `vercel.json`. Push to the main branch and Vercel builds automatically with `NITRO_PRESET=vercel`. The static output lives under `dist/`.

To deploy anywhere else, override the Nitro preset:

```bash
NITRO_PRESET=cloudflare-module bun run build   # Cloudflare Workers
NITRO_PRESET=node-server        bun run build   # Node.js server
NITRO_PRESET=static             bun run build   # Static hosting
```

## PWA support

- Manifest: [`public/manifest.webmanifest`](public/manifest.webmanifest)
- Icons: [`public/app-icon/`](public/app-icon)
- Service worker: generated at build-time by `vite-plugin-pwa` (Workbox `generateSW`), served as `/sw.js`.
- Strategy: HTML uses `NetworkFirst`; hashed assets and static Quran data use `CacheFirst`.
- Guarded registration: the SW never registers in dev, iframes, preview hosts, or when `?sw=off` is set — see `src/lib/register-pwa.ts`.
- Kill switch: append `?sw=off` to any URL to force-unregister a stale worker on a user's device.

## Branding system

All generators read from **one** shared branding profile. Users configure it once in **Settings → Branding**:

- **Logo** — bundled ELQOR4N mark by default; users may upload their own.
- **Username** — normalised through `formatHandle()` so it always renders as `@handle`, never `handle@`.
- **Display mode** — per brand, choose `both` (logo + name), `logo` only, or `name` only.

The `<BrandLogo />` component automatically adapts contrast for light or dark surfaces.

## Collaboration mode

When enabled, every generator co-brands the output with a second official partner:

- **Default collaboration** — pairs with **@fajr_al_tilawa**.
- **Custom collaboration** — user supplies any secondary logo and handle.
- **Behavior per generator**:
  - Posts / Hisn / Nawawi — both brands on the first and last slides (`brand × brand` lockup).
  - Tweet — user picks one brand per tweet.
  - Reels — watermark positions restricted to `top-center` / `bottom-center` for balance.
  - Reel cover / Quran video — both logos + handles rendered under the artwork.

## Project structure

```
elqor4n/
├── public/                     # Static assets (icons, manifest, Quran data)
│   ├── app-icon/               # PWA icons
│   ├── data/                   # Hisn + Nawawi JSON databases
│   └── manifest.webmanifest    # PWA manifest
├── src/
│   ├── assets/                 # Bundled images (logos, backgrounds)
│   ├── components/             # Shared UI: BrandGroup, ShareMenu, InstallBanner, slides/, tweet/, ui/
│   ├── features/
│   │   └── quran-video/        # Full Quran video studio (self-contained subtree)
│   ├── lib/                    # settings.ts (Zustand), share.ts, hijri.ts, hisn.ts, nawawi.ts, ...
│   ├── routes/                 # File-based TanStack routes
│   │   ├── __root.tsx          # Root layout (html/head, providers, install banner, nav)
│   │   ├── index.tsx           # Home
│   │   ├── posts.tsx           # Ahzab + Nawawi + Daily Hadith
│   │   ├── hisn.tsx            # Hisn Al-Muslim
│   │   ├── tweet.tsx           # Tweet studio
│   │   ├── reels.tsx           # Reels
│   │   ├── reel-cover.tsx      # Reel covers
│   │   ├── quran-video.tsx     # Quran video (mounts features/quran-video)
│   │   └── settings.tsx        # Branding + preferences
│   ├── styles.css              # Tailwind v4 entry + design tokens
│   ├── client.tsx              # Client hydration entry (no StrictMode in prod)
│   └── router.tsx              # Query client + router bootstrap
├── docs/                       # User guide (PDF) + screenshots
├── vite.config.ts              # Vite + PWA + Nitro plugin config
├── vercel.json                 # Vercel preset
└── DEVELOPERS.md               # Architecture deep-dive
```

## Environment variables

None are required for the core app. The Quran video studio can optionally use:

- `VITE_PIXABAY_KEY` — Pixabay API key for the background image search. If missing, the search UI is hidden.

## Credits

- **Quran text & translations** — [Quran.com API](https://quran.com/api)
- **Reciter audio** — [QuranicAudio.com](https://quranicaudio.com/)
- **Hisn Al-Muslim** — Saeed bin Ali bin Wahaf Al-Qahtani (public domain compilation)
- **40 Hadith** — Imam An-Nawawi (public domain)
- **Fonts** — [Cairo](https://fonts.google.com/specimen/Cairo), [Amiri Quran](https://fonts.google.com/specimen/Amiri+Quran)
- **Icons** — [Lucide](https://lucide.dev/)
- **Backgrounds** — [Pixabay](https://pixabay.com/) (free license)

Special thanks to [@med_bentouati](https://instagram.com/med_bentouati) and [@yacine_san8](https://instagram.com/yacine_san8) for their contributions and feedback.

Developed by **Tayeb Bekkouche** — [GitHub](https://github.com/tayebg) · [LinkedIn](https://www.linkedin.com/in/tayebbekkouche) · [elqor4n@gmail.com](mailto:elqor4n@gmail.com).

## License

MIT © 2025 Tayeb Bekkouche. See [LICENSE](LICENSE) for details.

The Quranic text, translations, tafsir, and audio remain the property of their respective owners and are used under their public / open-content licenses. Redistribution of the app is free for non-commercial Islamic dawah use.

## Future improvements

- Cloud sync for user branding across devices.
- More reciters with server-side transcoded audio.
- Additional themes for the tweet card studio (X, Threads, Bluesky).
- Automatic Instagram post scheduling via Meta Graph API.
- Server-side video export queue for very long recitations.
- More slide templates for the Ahzab / Nawawi generators.
- Multi-language Hisn and Nawawi content (English, French, Turkish, Indonesian).
