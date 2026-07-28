
# Final Closeout Plan

This is the last pass before considering the project complete. I'll ship it as one batch, roughly in the order below, and verify with a production build (`bun run build`) plus targeted route checks.

---

## 1. Documentation

### `README.md` (English, GitHub-ready)
Sections: Title, Description, Features, Screenshot placeholders (`docs/screenshots/*.png` — placeholder paths, images to be added later), Tech Stack (TanStack Start v1, React 19, Tailwind v4, Zustand, i18next, vite-plugin-pwa, html-to-image, mp4-muxer, ffmpeg.wasm), Install, Dev, Build, Deploy (Vercel), PWA support, Branding system (default / logo+username / logo only / username only), Collaboration mode (default / custom), Project structure tree, Env vars (none currently), Credits (Quran API, translations, reciters), License (MIT unless you prefer another — I'll default to MIT), Future improvements.

### Arabic User Guide → `docs/ELQOR4N-User-Guide.pdf` + downloadable artifact
- Built with **ReportLab + DejaVuSans/Amiri** for proper Arabic shaping, RTL, table of contents, page numbers, chapter headings, and callouts.
- Full sections as you listed: Introduction, Installation (browser + PWA install + offline), Home, Branding (all 4 modes), Collaboration (all modes + branding behavior), Posts (Ahzab, Hisn, Daily Hadith), Tweet, Videos, Reels, Reel Cover, Sharing, Settings, FAQ, Tips.
- Delivered to `/mnt/documents/ELQOR4N-User-Guide.pdf` with a preview tag, and also committed to `docs/` in the repo.

### `DEVELOPERS.md` (English)
Architecture, folder structure, Zustand store layout, branding architecture (`BrandLogo`, `formatHandle`, `BrandGroup`), collaboration architecture, i18n (`react-i18next` + ar/en), PWA config (vite-plugin-pwa + `register-pwa.ts`), build process, Vercel deployment, maintenance notes.

## 2. Video page — Upload Background fix
Audit `src/features/quran-video/components/SettingsPanel.jsx` + `useCanvasRenderer` / `QuranVideoApp`. Likely causes: file input `onChange` not wired, blob URL not passed into the renderer's `loadBgImage`, or state key mismatch. Fix so a selected file is turned into an `object URL` (or `<video>` element for MP4), stored in state, and rendered as `bgImage` / `bgVideo`. Revoke old URLs. Accept `image/*` and `video/mp4`.

## 3. Follow Us — Instagram-only, numbered
In `src/components/SocialIcons.tsx` (and wherever it renders on Home):
- Remove Telegram.
- Show two clearly separated rows, numbered `1.` / `2.`, each: Instagram icon + `@elqor4n` / `@fajr_al_tilawa` linking to `https://instagram.com/<handle>`.
- Visual: two stacked cards with a divider so it's obvious they are two distinct official accounts.

## 4. Prod vs local parity
Root causes are almost always PWA cache + a `useEffect`-driven i18n init that races on hydration. Actions:
- Reproduce with `bun run build && bun run preview`, then compare against dev.
- **Home fits single screen**: currently the fit relies on `dvh` classes that only apply in dev because of a CSS layer order issue in prod. Move the layout to `h-[100svh] overflow-hidden` with a flex column so it's deterministic.
- **Videos fully Arabic in prod**: the i18n resources for the Quran video feature are imported lazily; in prod the chunk splits and the default language flashes English before hydration completes. I'll (a) preload `ar` bundle synchronously in `src/features/quran-video/i18n/i18n.js`, (b) set `lng: 'ar'` and remove the browser language detector for this feature (or lock it to Arabic), (c) add `<html lang="ar" dir="rtl">` at SSR level in `__root.tsx`.
- **SW cache**: bump `registerType: 'autoUpdate'`, ensure `skipWaiting`+`clientsClaim`, and add a one-shot cleanup that invalidates old precache on next deploy. Verify no `.lovable.app` preview registers the SW.
- Confirm no assets are excluded from the prod bundle (check `vite.config.ts` externals).

## 5. Share button
Rewrite `src/lib/share.ts` + `src/components/ShareMenu.tsx`:
- Generate the blob **before** opening any menu so Web Share API can be called **synchronously inside the click handler** (Safari/iOS requirement — this is the #1 cause of "loading forever").
- Timeout guard: any pending state auto-clears after 15s with an error toast.
- Use `navigator.canShare({ files })` before attempting file share; on failure fall back to download + copy-link.
- Wrap the whole thing in try/finally so the spinner always stops.
- Apply the same hook to Posts, Carousels, Videos, Reels — one shared `useShare({ getBlob, filename, mime })` hook.

## 6. Install banner — inline, not floating
Rewrite `src/components/InstallBanner.tsx`:
- Remove `fixed`/`absolute` positioning; render as a normal block at the top of `__root.tsx` (above `<Outlet />`).
- Close (×) sets `localStorage['elqor4n:install-dismissed'] = '1'` and unmounts the banner so content flows up naturally.
- Only shown when `beforeinstallprompt` fired AND not dismissed AND not already installed (`display-mode: standalone`).

## 7. Performance & stability pass
- Confirm React StrictMode stays off in prod (`src/client.tsx` already does this — good). Verify no page re-adds it.
- Audit `useEffect` deps in `QuranVideoApp` and hooks under `src/features/quran-video/hooks/*` for effects that re-run on every render (missing deps → repeated fetches → "another app loading inside").
- Deduplicate i18n init: ensure `i18n.js` runs once module-scope, never inside a component effect.
- Move heavy canvas renders behind `requestAnimationFrame` throttling.
- Add passive listeners; remove any global `window` listeners that aren't cleaned up.
- Kill duplicate network requests (chapters/reciters/timings) with a small in-memory cache keyed by `${chapter}:${reciter}`.
- Verify only one Service Worker registration site-wide.
- Final: `bun run build`, run Playwright to load `/`, `/videos`, `/posts`, take screenshots, confirm Arabic on `/videos`, single-screen home, working install banner, working share on a generated post.

---

## Files likely touched
- New: `README.md`, `DEVELOPERS.md`, `docs/ELQOR4N-User-Guide.pdf`, `scripts/build-user-guide.py`
- `src/components/{SocialIcons,InstallBanner,ShareMenu}.tsx`
- `src/lib/{share,register-pwa}.ts`
- `src/routes/{__root,index,videos}.tsx`
- `src/features/quran-video/**` (upload flow, i18n, hook cleanup)
- `vite.config.ts` (PWA options if needed)

## Assumptions I'm making (say if any is wrong)
- **License = MIT.** Change if you want another (Apache-2.0, proprietary, none).
- **User guide language = Arabic only** (no bilingual version).
- **Screenshots in README are placeholders** — you'll drop real ones into `docs/screenshots/` later.
- **Instagram handles in Follow Us are the only two**; no X/YouTube/etc. added.

If all four assumptions are OK, reply "go" and I'll implement everything in one batch. If you want to change any, tell me which.
