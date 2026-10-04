import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShareMenu } from "@/components/ShareMenu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Download, Loader2, Play } from "lucide-react";

import { ClientOnly } from "@/components/ClientOnly";
import { useResolvedBranding, formatHandle } from "@/lib/settings";
import { toast } from "sonner";

export const Route = createFileRoute("/reels-watermark")({
  head: () => ({
    meta: [{ title: "Ø¹ÙŽÙ„Ø§Ù…ÙŽØ©Ù Ø±ÙŠÙ„Ø² Â· ELQOR4N" }],
  }),
  component: () => (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù…ÙŠÙ„â€¦
        </div>
      }
    >
      <ReelsPage />
    </ClientOnly>
  ),
});

type Position = "tl" | "tr" | "bl" | "br" | "tc" | "bc";

function ReelsPage() {
  const {
    logoUrl,
    username,
    collaboration,
    secondaryLogoUrl,
    secondaryUsername,
  } = useResolvedBranding();
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState<Position>("br");
  const [opacity, setOpacity] = useState(0.85);
  const handle = username ? formatHandle(username, "@elqor4n") : "";
  const secondaryHandle = secondaryUsername
    ? formatHandle(secondaryUsername, "@fajr_al_tilawa")
    : "";

  // Collaboration mode: restrict to top-center / bottom-center only.
  useEffect(() => {
    if (collaboration && position !== "tc" && position !== "bc") {
      setPosition("bc");
    }
  }, [collaboration, position]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setOutUrl(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const render = async () => {
    if (!file || !videoUrl) return;
    setRendering(true);
    setProgress(0);
    setOutUrl(null);
    try {
      const blob = await renderWithWatermark({
        videoUrl,
        logoUrl,
        handle,
        secondary: collaboration
          ? { logoUrl: secondaryLogoUrl, handle: secondaryHandle }
          : null,
        position,
        opacity,
        onProgress: setProgress,
      });
      setOutUrl(URL.createObjectURL(blob));
      toast.success(
        "Ø¬Ø§Ù‡Ø² â€” ÙŠÙ…ÙƒÙ† Ø§Ù„ØªÙ†Ø²ÙŠÙ„ Ø£Ùˆ Ø§Ù„Ù…Ø´Ø§Ø±ÙƒØ©",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ÙØ´Ù„ Ø§Ù„ØªØµØ¯ÙŠØ±");
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-8">
          <aside className="space-y-5">
            <div>
              <Label>Ù…Ù„Ù Ø§Ù„ÙÙŠØ¯ÙŠÙˆ</Label>
              <label className="mt-2 flex items-center justify-center h-24 rounded-md border-2 border-dashed border-border cursor-pointer hover:bg-muted/30 text-sm text-muted-foreground">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />{" "}
                  {file ? file.name.slice(0, 24) : "Ø§Ø®ØªØ± ÙÙŠØ¯ÙŠÙˆ"}
                </span>
              </label>
            </div>
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground space-y-1">
              <p>
                Ø§Ù„Ø¹Ù„Ø§Ù…Ø© Ø§Ù„Ù…Ø§Ø¦ÙŠØ©:{" "}
                <span
                  className="font-medium text-foreground"
                  dir="ltr"
                  style={{ unicodeBidi: "isolate" }}
                >
                  {handle}
                </span>
              </p>
              {collaboration && (
                <p>
                  Ø§Ù„Ø¹Ù„Ø§Ù…Ø© Ø§Ù„Ø«Ø§Ù†ÙŠØ©:{" "}
                  <span
                    className="font-medium text-foreground"
                    dir="ltr"
                    style={{ unicodeBidi: "isolate" }}
                  >
                    {secondaryHandle}
                  </span>
                </p>
              )}
              <p className="pt-1">
                Ø§Ù„Ø´Ø¹Ø§Ø± ÙˆØ§Ù„Ù…Ø¹Ø±Ù‘Ù ÙˆØ§Ù„ØªØ¹Ø§ÙˆÙ† ØªÙØ¯Ø§Ø± ÙÙŠ{" "}
                <span className="text-foreground">
                  Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª â† Ø§Ù„Ø¹Ù„Ø§Ù…Ø©
                </span>
                .
              </p>
            </div>
            <div>
              <Label>Ø§Ù„Ù…ÙˆØ¶Ø¹</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(collaboration
                  ? (["tc", "bc"] as Position[])
                  : (["tl", "tr", "bl", "br"] as Position[])
                ).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPosition(p)}
                    className={`px-3 py-2 text-xs rounded-md border ${position === p ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                  >
                    {
                      (
                        {
                          tl: "Ø£Ø¹Ù„Ù‰ ÙŠØ³Ø§Ø±",
                          tr: "Ø£Ø¹Ù„Ù‰ ÙŠÙ…ÙŠÙ†",
                          bl: "Ø£Ø³ÙÙ„ ÙŠØ³Ø§Ø±",
                          br: "Ø£Ø³ÙÙ„ ÙŠÙ…ÙŠÙ†",
                          tc: "Ø£Ø¹Ù„Ù‰ Ø§Ù„ÙˆØ³Ø·",
                          bc: "Ø£Ø³ÙÙ„ Ø§Ù„ÙˆØ³Ø·",
                        } as const
                      )[p]
                    }
                  </button>
                ))}
              </div>
              {collaboration && (
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  ÙˆØ¶Ø¹ Ø§Ù„ØªØ¹Ø§ÙˆÙ† ÙŠÙ‚ØªØµØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙˆØ§Ø¶Ø¹
                  Ø§Ù„Ù…Ø±ÙƒØ²ÙŠØ©.
                </p>
              )}
            </div>
            <div>
              <Label>Ø§Ù„Ø´ÙØ§ÙÙŠØ©: {(opacity * 100).toFixed(0)}%</Label>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <Button
              className="w-full"
              disabled={!file || rendering}
              onClick={render}
            >
              {rendering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ø¬Ø§Ø±Ù
                  Ø§Ù„ØªØµØ¯ÙŠØ± {Math.round(progress * 100)}%
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" /> ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ø¹Ù„Ø§Ù…Ø©
                </>
              )}
            </Button>
            {outUrl && (
              <div className="space-y-2">
                <a
                  href={outUrl}
                  download={`reel-${Date.now()}.webm`}
                  className="block"
                >
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" /> ØªÙ†Ø²ÙŠÙ„ MP4/WebM
                  </Button>
                </a>
                <ShareMenu
                  className="w-full"
                  label="Ù…Ø´Ø§Ø±ÙƒØ© Ø§Ù„Ø±ÙŠÙ„"
                  title="Ø±ÙŠÙ„Ø²"
                  text={handle}
                  getFile={async () => {
                    const blob = await fetch(outUrl).then((r) => r.blob());
                    const ext = blob.type.includes("mp4") ? "mp4" : "webm";
                    return new File([blob], `reel-${Date.now()}.${ext}`, {
                      type: blob.type,
                    });
                  }}
                />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Ø§Ù„ØªØµØ¯ÙŠØ± ÙŠØªÙ… ÙƒÙ„Ù‡ ÙÙŠ Ù…ØªØµÙØ­Ùƒ Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù…
              Canvas + MediaRecorder â€” Ù„Ø§ ÙŠÙØ±ÙØ¹ Ø£ÙŠ Ø´ÙŠØ¡ Ø¥Ù„Ù‰
              Ø§Ù„Ø®Ø§Ø¯Ù…. Ø§Ù„ØªØ±Ù…ÙŠØ² ÙŠØ¹ØªÙ…Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ù…ØªØµÙØ­ (WebM
              Ø¹Ù„Ù‰ ChromiumØŒ MP4 Ø¹Ù„Ù‰ Safari).
            </p>
          </aside>

          <section>
            <div className="mx-auto max-w-[360px] aspect-video max-h-[80vh] rounded-xl overflow-hidden bg-black border border-border">
              {outUrl ? (
                <video
                  key={outUrl}
                  src={outUrl}
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : videoUrl ? (
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted-foreground text-sm">
                  Ø§Ø±ÙØ¹ ÙÙŠØ¯ÙŠÙˆ
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/** Composite watermark onto video using canvas + MediaRecorder. */
async function renderWithWatermark(opts: {
  videoUrl: string;
  logoUrl: string;
  handle: string;
  secondary: { logoUrl: string; handle: string } | null;
  position: Position;
  opacity: number;
  onProgress: (p: number) => void;
}): Promise<Blob> {
  const {
    videoUrl,
    logoUrl,
    handle,
    secondary,
    position,
    opacity,
    onProgress,
  } = opts;

  const video = document.createElement("video");
  video.src = videoUrl;
  // Element must not play out loud, but captureStream still forwards audio.
  video.volume = 0;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => {
    video.onloadedmetadata = () => res();
    video.onerror = () => rej(new Error("ØªØ¹Ø°Ù‘Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„ÙÙŠØ¯ÙŠÙˆ"));
  });

  const loadImg = (src: string) =>
    new Promise<HTMLImageElement>((res) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => res(img);
      img.onerror = () => res(img);
    });
  const logo = logoUrl ? await loadImg(logoUrl) : null;
  const logo2 = secondary?.logoUrl ? await loadImg(secondary.logoUrl) : null;

  const w = video.videoWidth;
  const h = video.videoHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const stream = canvas.captureStream(30);
  try {
    const audioStream: MediaStream | undefined =
      (video as any).captureStream?.() ?? (video as any).mozCaptureStream?.();
    audioStream?.getAudioTracks().forEach((t) => stream.addTrack(t));
  } catch {
    /* no audio */
  }

  const mime =
    [
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ].find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
  const rec = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 6_000_000,
  });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
  });

  const pad = Math.round(Math.min(w, h) * 0.04);
  const logoSize = Math.round(Math.min(w, h) * 0.09);
  const fontSize = Math.round(Math.min(w, h) * 0.028);
  const gap = Math.round(logoSize * 0.35);
  const crossGap = Math.round(logoSize * 0.9);

  const measure = (text: string) => {
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    return ctx.measureText(text).width;
  };
  const brandWidth = (text: string, hasLogo: boolean) =>
    (hasLogo ? logoSize + (text ? gap : 0) : 0) + measure(text);
  const totalWidth = () => {
    const w1 = brandWidth(handle, !!logoUrl);
    if (!secondary) return w1;
    const w2 = brandWidth(secondary.handle, !!secondary.logoUrl);
    return w1 + crossGap + Math.round(fontSize * 1.4) + crossGap + w2;
  };

  const drawBrand = (
    img: HTMLImageElement | null,
    text: string,
    x: number,
    y: number,
  ) => {
    const drewLogo = !!(img && img.complete && img.naturalWidth);
    if (drewLogo) {
      const aspect = img!.naturalWidth / img!.naturalHeight;
      const drawW = aspect > 1 ? logoSize : Math.round(logoSize * aspect);
      const drawH = aspect > 1 ? Math.round(logoSize / aspect) : logoSize;
      ctx.drawImage(img!, x, y - drawH / 2, drawW, drawH);
    }
    if (!text) return;
    const textX = x + (drewLogo ? logoSize + gap : 0);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 6;
    ctx.fillText(text, textX, y);
    ctx.shadowBlur = 0;
  };

  const draw = () => {
    ctx.drawImage(video, 0, 0, w, h);
    ctx.globalAlpha = opacity;
    const tw = totalWidth();
    // Anchor horizontally based on left/right/center, vertically top/bottom.
    const isLeft = position === "tl" || position === "bl";
    const isCenter = position === "tc" || position === "bc";
    const isTop = position === "tl" || position === "tr" || position === "tc";
    const startX = isCenter
      ? Math.round((w - tw) / 2)
      : isLeft
        ? pad
        : w - pad - tw;
    const y = isTop ? pad + logoSize / 2 : h - pad - logoSize / 2;

    let x = startX;
    drawBrand(logo, handle, x, y);
    x += brandWidth(handle, !!logo);
    if (secondary && (logo2 || secondary.handle)) {
      x += crossGap;
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = `600 ${Math.round(fontSize * 1.4)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 6;
      ctx.fillText("Ã—", x + Math.round(fontSize * 0.7), y);
      ctx.restore();
      x += Math.round(fontSize * 1.4) + crossGap;
      drawBrand(logo2, secondary.handle, x, y);
    }
    ctx.globalAlpha = 1;
  };

  rec.start(250);
  video.muted = false; // captureStream still forwards audio track; volume=0 keeps it silent locally
  await video.play();

  const total = video.duration || 0;
  let raf = 0;
  const tick = () => {
    draw();
    if (total) onProgress(Math.min(1, video.currentTime / total));
    raf = requestAnimationFrame(tick);
  };
  tick();

  await new Promise<void>((res) => {
    video.onended = () => res();
  });
  cancelAnimationFrame(raf);
  rec.stop();
  return done;
}
