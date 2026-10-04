import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";
import process from "node:process";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

// Deployment target. Set NITRO_PRESET=vercel (see vercel.json) to build for
// Vercel; the default targets a Cloudflare-compatible worker bundle in dist/.
const preset = process.env.NITRO_PRESET;

const nitroOptions = preset
  ? { preset }
  : {
      preset: "cloudflare-module",
      output: {
        dir: "dist",
        serverDir: "dist/server",
        publicDir: "dist/client",
      },
      cloudflare: { nodeCompat: true, deployConfig: true },
    };

export default defineConfig(({ command }) => ({
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": srcDir },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/audio-proxy": {
        target: "https://download.quranicaudio.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/audio-proxy/, ""),
      },
    },
  },
  build: {
    // Keep the vendor graph split so the heavy video studio never lands in
    // the initial route bundle.
    chunkSizeWarningLimit: 1200,
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({ server: { entry: "server" }, client: { entry: "client" } }),
    ...(command === "build" ? [nitro(nitroOptions)] : []),
    react(),
    VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      injectRegister: null,
      filename: "sw.js",
      devOptions: { enabled: false },
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: [
          "**/*.{js,css,html,woff2,woff,ttf,otf,png,svg,ico,json}",
        ],
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/api\//, /^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-pages",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/quran/") ||
              url.pathname.startsWith("/data/") ||
              url.pathname.startsWith("/fonts/"),
            handler: "CacheFirst",
            options: {
              cacheName: "static-data",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin &&
              /\.(?:png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === "api.quran.com",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "quran-api",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname === "download.quranicaudio.com" ||
              url.pathname.startsWith("/audio-proxy"),
            handler: "CacheFirst",
            options: {
              cacheName: "quran-audio",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname.includes("pixabay.com") ||
              url.hostname.includes("vimeocdn.com"),
            handler: "CacheFirst",
            options: {
              cacheName: "pixabay-media",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
}));
