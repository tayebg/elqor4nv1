/**
 * Native sharing helpers.
 *
 * Strategy, in order of preference:
 *  1. Web Share API with files (`navigator.share({ files })`) — on mobile this
 *     opens the OS share sheet, where Instagram / TikTok / Facebook / etc. all
 *     appear as targets. This is the "native" path.
 *  2. Web Share API with text/url only (some desktop browsers).
 *  3. Graceful fallback — save the file locally and open the platform's web
 *     composer / upload page so the user can attach it in one step.
 *
 * Every platform in `SHARE_PLATFORMS` therefore always works: the only
 * difference is how many taps it takes.
 */

export type SharePlatformId =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "youtube";

export interface SharePlatform {
  id: SharePlatformId;
  label: string;
  /** Web composer/upload URL used when direct file sharing is unavailable. */
  webUrl: (payload: { text: string; url?: string }) => string;
  /** Platforms that accept a link directly (no file upload needed). */
  acceptsLink: boolean;
}

export const SHARE_PLATFORMS: SharePlatform[] = [
  {
    id: "instagram",
    label: "إنستغرام",
    // Instagram's web composer only accepts uploads via the mobile PWA /
    // in-app browser. Desktop web can't upload photos/videos — so we open
    // the creation entry point which prompts to switch to the app.
    webUrl: () => "https://www.instagram.com/create/select/",
    acceptsLink: false,
  },
  {
    id: "tiktok",
    label: "تيك توك",
    webUrl: () => "https://www.tiktok.com/upload",
    acceptsLink: false,
  },
  {
    id: "facebook",
    label: "فيسبوك",
    webUrl: ({ url }) =>
      url
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        : "https://www.facebook.com/?sk=composer",
    acceptsLink: true,
  },
  {
    id: "youtube",
    label: "يوتيوب",
    webUrl: () => "https://www.youtube.com/upload",
    acceptsLink: false,
  },
];

export interface SharePayload {
  /** Produces the asset to share. Called lazily, only when needed. */
  getFile: () => Promise<File>;
  /** Optional: produce ALL assets for platforms that accept multiple media. */
  getFiles?: () => Promise<File[]>;
  title: string;
  text: string;
}

export type ShareOutcome =
  | { kind: "shared" }
  | { kind: "needs-gesture" }
  | { kind: "cancelled" }
  | { kind: "downloaded-and-opened" }
  | { kind: "link-opened" }
  | { kind: "error"; message: string };

function canShareFiles(files: File[]) {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files })
  );
}

export function nativeFileShareSupported() {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  try {
    const probe = new File([new Blob(["x"], { type: "image/png" })], "probe.png", {
      type: "image/png",
    });
    return canShareFiles([probe]);
  } catch {
    return false;
  }
}

function saveFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Best-effort copy of the caption/text so the user can paste into the target app. */
async function copyCaption(text: string) {
  if (!text) return;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    /* clipboard may be blocked — non-fatal */
  }
}

function isAbortError(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
}

/** True when the browser refused the share because the gesture already expired. */
export function isGestureError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return (
    (err instanceof DOMException && err.name === "NotAllowedError") ||
    /user gesture|user activation|transient activation/i.test(msg)
  );
}

/**
 * GESTURE-SAFE share. Files must ALREADY be resolved before calling — this
 * function performs NO awaits before `navigator.share`, so the browser still
 * sees the tap that triggered it. Any async work (canvas → blob, ffmpeg
 * export, …) must happen BEFORE the user's tap (see ShareMenu pre-warming).
 */
export function shareFilesNow(
  files: File[],
  title: string,
  text: string,
): Promise<ShareOutcome> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    if (files[0]) saveFile(files[0]);
    return Promise.resolve<ShareOutcome>({ kind: "downloaded-and-opened" });
  }
  const data =
    files.length > 0 && canShareFiles(files) ? { files, title, text } : { title, text };
  // No `await` before this call — the click's transient activation is intact.
  return navigator
    .share(data)
    .then<ShareOutcome>(() => ({ kind: "shared" }))
    .catch<ShareOutcome>((err) => {
      if (isAbortError(err)) return { kind: "cancelled" };
      if (isGestureError(err)) return { kind: "needs-gesture" };
      if (files[0]) {
        saveFile(files[0]);
        return { kind: "downloaded-and-opened" };
      }
      return { kind: "error", message: err instanceof Error ? err.message : "Sharing failed" };
    });
}

/** Resolve the best file list a payload can produce (async — never in a gesture). */
export async function resolveShareFiles(payload: SharePayload): Promise<File[]> {
  if (payload.getFiles) {
    const files = await payload.getFiles();
    if (files.length > 0) return files;
  }
  const file = await payload.getFile();
  return file ? [file] : [];
}

/** Open the OS share sheet (all platforms at once). */
export async function shareNative(payload: SharePayload): Promise<ShareOutcome> {
  try {
    const files = await resolveShareFiles(payload);
    return await shareFilesNow(files, payload.title, payload.text);
  } catch (err) {
    if (isAbortError(err)) return { kind: "cancelled" };
    return { kind: "error", message: err instanceof Error ? err.message : "Sharing failed" };
  }
}




/**
 * Share to one specific platform.
 *
 * `files` may be passed in already resolved (pre-warmed before the tap) so the
 * native sheet still runs inside the user gesture. When omitted the files are
 * produced here, which is fine for the desktop save-then-open fallback.
 */
export async function shareToPlatform(
  platform: SharePlatform,
  payload: SharePayload,
  preparedFiles?: File[],
): Promise<ShareOutcome> {
  try {
    const files = preparedFiles ?? (await resolveShareFiles(payload));

    // Best case: the OS share sheet, pre-loaded with the media.
    if (files.length > 0 && canShareFiles(files)) {
      const outcome = await shareFilesNow(files, payload.title, payload.text);
      if (outcome.kind !== "needs-gesture") {
        void copyCaption(payload.text);
        return outcome;
      }
    }

    // No file sharing (typically desktop). Save the media, then open the
    // platform where the user can attach it.
    if (files[0]) saveFile(files[0]);
    await copyCaption(payload.text);
    const href = platform.webUrl({
      text: payload.text,
      url: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    window.open(href, "_blank", "noopener,noreferrer");
    return platform.acceptsLink ? { kind: "link-opened" } : { kind: "downloaded-and-opened" };
  } catch (err) {
    if (isAbortError(err)) return { kind: "cancelled" };
    return { kind: "error", message: err instanceof Error ? err.message : "Sharing failed" };
  }
}


export async function blobToFile(blob: Blob, filename: string) {
  return new File([blob], filename, { type: blob.type || "application/octet-stream" });
}
