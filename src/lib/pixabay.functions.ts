import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const searchPixabay = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    q: z.string().min(1).max(100),
    type: z.enum(["image", "video"]).default("image"),
  }).parse(data))
  .handler(async ({ data }) => {
    const key = process.env.PIXABAY_API_KEY;
    if (!key) throw new Error("PIXABAY_API_KEY is not configured");

    // Translate Arabic → English via free public endpoint (best-effort)
    let q = data.q.trim();
    if (/[\u0600-\u06FF]/.test(q)) {
      try {
        const t = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=ar|en`,
        ).then((r) => r.json() as Promise<{ responseData?: { translatedText?: string } }>);
        const tr = t?.responseData?.translatedText;
        if (tr && tr.toLowerCase() !== "no translation found") q = tr;
      } catch {
        /* ignore */
      }
    }

    const isVideo = data.type === "video";
    const endpoint = isVideo ? "https://pixabay.com/api/videos/" : "https://pixabay.com/api/";
    const url = isVideo
      ? `${endpoint}?key=${key}&q=${encodeURIComponent(q)}&safesearch=true&per_page=24`
      : `${endpoint}?key=${key}&q=${encodeURIComponent(q)}&image_type=photo&safesearch=true&orientation=all&per_page=24`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pixabay HTTP ${res.status}`);
    const json = (await res.json()) as {
      hits?: Array<{
        id: number;
        previewURL: string;
        webformatURL: string;
        largeImageURL: string;
        picture_id?: string;
        duration?: number;
        tags: string;
        videos?: {
          tiny?: { url: string; width: number; height: number; size: number; thumbnail?: string };
          small?: { url: string; width: number; height: number; size: number; thumbnail?: string };
          medium?: { url: string; width: number; height: number; size: number; thumbnail?: string };
          large?: { url: string; width: number; height: number; size: number; thumbnail?: string };
        };
      }>;
    };
    if (isVideo) {
      return (json.hits ?? []).flatMap((video) => {
        const selected = video.videos?.medium ?? video.videos?.small ?? video.videos?.large ?? video.videos?.tiny;
        if (!selected?.url) return [];
        const preview =
          selected.thumbnail ??
          (video.picture_id ? `https://i.vimeocdn.com/video/${video.picture_id}_295x166.jpg` : "");
        return [{
          id: video.id,
          preview,
          medium: video.videos?.small?.url ?? selected.url,
          large: selected.url,
          tags: video.tags,
          type: "video" as const,
          duration: video.duration ?? null,
        }];
      });
    }
    return (json.hits ?? []).map((img) => ({
      id: img.id,
      preview: img.previewURL,
      medium: img.webformatURL,
      large: img.largeImageURL,
      tags: img.tags,
      type: "image" as const,
    }));
  });
