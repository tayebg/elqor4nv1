import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Video, Pause, Play, Loader2, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { videoSizes } from "../data/quranData";
import { renderFrame } from "../hooks/useCanvasRenderer";

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PreviewPanel({
  settings, chapters, verses, versesLoading,
  timedVerses = [], currentTimeMs = 0, isPlaying = false,
  onPlayPause, timedLoading = false, audioLoading = false, audioProgress = 0, audioUrl = "",
  bgImage = "/quran-video-assets/quran-bg.png",
  bgIsVideo = false,
  textColor = "#FFFFFF",
  translationColor = "#B0C4DE",
  translations = [], showTranslation = false,
  watermarkText = "",
  contentMode = "translation",
  bgScale = 100, bgDim = 30, bgBlur = 0, textScale = 100,
  logoUrl = "",
  collaboration = false,
  secondaryLogoUrl = "",
  secondaryUsername = "",
  selectedReciterName = "",
}) {
  const { t } = useTranslation();

  const currentSize = videoSizes.find((s) => s.id === settings.videoSize) || videoSizes[0];
  const EXPORT_W = currentSize.width;
  const EXPORT_H = currentSize.height;
  const isPortrait = EXPORT_H > EXPORT_W;

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const bgImgRef = useRef(null);
  const bgVidRef = useRef(null);
  const logoImgRef = useRef(null);
  const secondaryLogoImgRef = useRef(null);
  const rafRef = useRef(null);
  const [wrapperDims, setWrapperDims] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setWrapperDims({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scaleFactor = Math.min(wrapperDims.w / EXPORT_W, wrapperDims.h / EXPORT_H);

  const selectedChapter = chapters?.find((c) => c.id === settings.surahId);
  const chapterName = selectedChapter?.name_arabic || "الفاتحة";
  const hasTimedData = timedVerses && timedVerses.length > 0;

  const fallbackText =
    verses && verses.length > 0
      ? verses[0]?.text_uthmani || "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ"
      : "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ";

  const [showSafeZones, setShowSafeZones] = useState(false);

  useEffect(() => {
    if (bgIsVideo || !bgImage || bgImage === "custom") {
      bgImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { bgImgRef.current = img; drawRef.current?.(); };
    img.onerror = () => { console.warn("⚠️ فشل تحميل الخلفية:", bgImage); bgImgRef.current = null; };

    if (bgImage.startsWith("blob:") || bgImage.startsWith("http://") || bgImage.startsWith("https://")) {
      img.src = bgImage;
    } else {
      img.src = window.location.origin + (bgImage.startsWith("/") ? bgImage : "/" + bgImage);
    }
  }, [bgImage, bgIsVideo]);

  useEffect(() => {
    if (!bgIsVideo || !bgImage) {
      bgVidRef.current = null;
      return;
    }
    const vid = document.createElement("video");
    vid.crossOrigin = "anonymous";
    vid.src = bgImage;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.autoplay = true;
    vid.play().catch(() => {});
    bgVidRef.current = vid;
    return () => { vid.pause(); vid.src = ""; bgVidRef.current = null; };
  }, [bgImage, bgIsVideo]);

  useEffect(() => {
    if (!logoUrl) { logoImgRef.current = null; drawRef.current?.(); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { logoImgRef.current = img; drawRef.current?.(); };
    img.onerror = () => { logoImgRef.current = null; };
    img.src = logoUrl;
  }, [logoUrl]);

  useEffect(() => {
    if (!secondaryLogoUrl) { secondaryLogoImgRef.current = null; drawRef.current?.(); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { secondaryLogoImgRef.current = img; drawRef.current?.(); };
    img.onerror = () => { secondaryLogoImgRef.current = null; };
    img.src = secondaryLogoUrl;
  }, [secondaryLogoUrl]);

  const progressPercent = hasTimedData
    ? (() => {
        const start = timedVerses[0].timestampFrom;
        const end = timedVerses[timedVerses.length - 1].timestampTo;
        const range = end - start;
        if (range <= 0) return 0;
        return Math.min(100, Math.max(0, ((currentTimeMs - start) / range) * 100));
      })()
    : 0;

  const totalDurationMs = hasTimedData
    ? timedVerses[timedVerses.length - 1].timestampTo - timedVerses[0].timestampFrom
    : 0;

  const renderOptionsRef = useRef({});
  renderOptionsRef.current = {
    bgIsVideo,
    bgScale, bgDim, bgBlur,
    textColor, translationColor, textScale,
    timedVerses, translations,
    showTranslation, watermarkText, contentMode,
    fallbackText, chapterName,
    collaboration,
    secondaryUsername,
    reciterName: selectedReciterName,
  };

  const currentTimeMsRef = useRef(currentTimeMs);
  currentTimeMsRef.current = currentTimeMs;

  // Draws exactly one frame. Kept in a ref so image-load callbacks can
  // repaint without re-subscribing effects.
  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const opts = renderOptionsRef.current;
    renderFrame(ctx, EXPORT_W, EXPORT_H, currentTimeMsRef.current, {
      ...opts,
      bgImage: opts.bgIsVideo ? bgVidRef.current : bgImgRef.current,
      logoImage: logoImgRef.current,
      secondaryLogoImage: secondaryLogoImgRef.current,
    });
  }, [EXPORT_W, EXPORT_H]);

  const drawRef = useRef(draw);
  drawRef.current = draw;

  // Continuous repaint ONLY while audio is playing or a video background is
  // animating. When idle the canvas repaints on demand instead of burning a
  // full-resolution frame every 16ms, which is what made the page lag and
  // swallow clicks.
  const animating = isPlaying || bgIsVideo;
  useEffect(() => {
    if (!animating) return;
    let running = true;
    const loop = () => {
      if (!running) return;
      drawRef.current();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animating]);

  // One-shot repaint whenever anything visible changes while idle.
  // Depending on the actual visible inputs (instead of running on every
  // render with no dep array) prevents a full export-resolution canvas
  // redraw on every unrelated state change — which used to make the UI
  // feel laggy and swallow clicks.
  useEffect(() => {
    if (animating) return;
    draw();
  }, [
    animating, draw, currentTimeMs,
    bgImage, bgIsVideo, bgScale, bgDim, bgBlur,
    textColor, translationColor, textScale,
    timedVerses, translations, showTranslation, watermarkText, contentMode,
    fallbackText, chapterName,
    logoUrl, secondaryLogoUrl, collaboration, secondaryUsername,
    EXPORT_W, EXPORT_H, selectedReciterName
  ]);

  const activeIdx = hasTimedData
    ? timedVerses.findIndex((v) => currentTimeMs >= v.timestampFrom && currentTimeMs < v.timestampTo)
    : -1;
  const displayIdx = activeIdx >= 0 ? activeIdx : 0;

  return (
    <section className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-muted/40 p-2 lg:p-6">
      <div className="mb-3 flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 lg:gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
            <Video className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{t("preview")}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {t(`size_${currentSize.id}`, { defaultValue: currentSize.name })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Toggle
            size="sm"
            pressed={showSafeZones}
            onPressedChange={setShowSafeZones}
            aria-label={t("safe_zones")}
            className="h-7 px-2.5 text-xs"
          >
            <Ruler className="mr-1.5 h-3.5 w-3.5" />
            {t("safe_zones")}
          </Toggle>
          {audioLoading ? (
            <Badge variant="secondary" className="font-mono text-[10px] gap-1 flex items-center">
              <Loader2 className="h-3 w-3 animate-spin" />
              جارٍ التحميل... {audioProgress}%
            </Badge>
          ) : (versesLoading || timedLoading) && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          )}
          {isPlaying && (
            <Badge variant="secondary" className="font-mono text-[10px]">
              {formatTime(currentTimeMs)}
            </Badge>
          )}
          {hasTimedData && (
            <Badge variant="outline" className="font-mono text-[10px]">
              {displayIdx + 1}/{timedVerses.length}
            </Badge>
          )}
          {hasTimedData && (
            <Badge variant="outline" className="font-mono text-[10px]">
              {formatTime(totalDurationMs)}
            </Badge>
          )}
          <Badge variant="outline" className="font-mono text-[10px]">
            {EXPORT_W} × {EXPORT_H}
          </Badge>
        </div>
      </div>

      {}
      <div
        ref={wrapperRef}
        className="w-full max-w-4xl flex items-center justify-center flex-1 min-h-0"
      >
        {}
        <div
          style={{
            width: Math.floor(EXPORT_W * scaleFactor),
            height: Math.floor(EXPORT_H * scaleFactor),
            position: "relative",
            flexShrink: 0,
            overflow: "hidden",
            borderRadius: Math.max(4, Math.round(16 * scaleFactor)),
            boxShadow: "0 20px 40px -8px color-mix(in oklch, var(--foreground) 25%, transparent)",
          }}
        >
          {}
          <div
            style={{
              width: EXPORT_W,
              height: EXPORT_H,
              transform: `scale(${scaleFactor})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
          {}
          <canvas
            ref={canvasRef}
            id="preview-canvas"
            width={EXPORT_W}
            height={EXPORT_H}
            style={{ display: "block", width: "100%", height: "100%" }}
          />

          {}

          {}
          {showSafeZones && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, borderRadius: 16, overflow: "hidden" }}>
              {}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: isPortrait ? "8%" : "5%",
                borderBottom: "3px dashed rgba(255, 200, 50, 0.6)",
                background: "rgba(255, 200, 50, 0.08)",
              }}>
                <span style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 20, color: "rgba(212,168,67,0.7)", whiteSpace: "nowrap" }}>{t("status_bar")}</span>
              </div>
              {}
              {isPortrait && (
                <div style={{
                  position: "absolute", top: "30%", right: 0, bottom: "25%",
                  width: "12%",
                  borderLeft: "3px dashed rgba(255, 100, 100, 0.6)",
                  background: "rgba(255, 100, 100, 0.08)",
                }} />
              )}
              {}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: isPortrait ? "18%" : "10%",
                borderTop: "3px dashed rgba(100, 180, 255, 0.6)",
                background: "rgba(100, 180, 255, 0.08)",
              }}>
                <span style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", fontSize: 20, color: "rgba(100,180,255,0.7)", whiteSpace: "nowrap" }}>
                  {isPortrait ? t("description_buttons") : t("video_description")}
                </span>
              </div>
              {}
              <div style={{
                position: "absolute",
                top: isPortrait ? "10%" : "7%", bottom: isPortrait ? "20%" : "12%",
                left: isPortrait ? "4%" : "3%", right: isPortrait ? "14%" : "3%",
                border: "3px dashed rgba(52, 211, 153, 0.4)", borderRadius: 12,
              }}>
                <span style={{ position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)", fontSize: 20, color: "rgba(52,211,153,0.6)", background: "color-mix(in oklch, var(--foreground) 25%, transparent)", padding: "4px 12px", borderRadius: 6, whiteSpace: "nowrap" }}>{t("safe_area")}</span>
              </div>
            </div>
          )}

          {}
          {audioUrl && (
            <div style={{ position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
              <button
                type="button"
                onClick={onPlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
                className={cn(
                  "group relative grid place-items-center rounded-full border backdrop-blur-md transition-all duration-300 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isPlaying
                    ? "border-border/60 bg-background/60 text-foreground hover:bg-background/80"
                    : "border-primary/40 bg-primary/85 text-primary-foreground hover:bg-primary",
                )}
                style={{ width: 80, height: 80, boxShadow: "0 8px 30px rgba(0,0,0,0.28)" }}
              >
                {!isPlaying && <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />}
                {isPlaying
                  ? <Pause className="relative z-10" style={{ width: 30, height: 30 }} strokeWidth={2.5} />
                  : <Play className="relative z-10" style={{ width: 30, height: 30, marginInlineStart: 3 }} fill="currentColor" strokeWidth={0} />}
              </button>
            </div>
          )}

          {}
          {hasTimedData && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "color-mix(in oklch, var(--foreground) 25%, transparent)", borderRadius: "0 0 16px 16px", zIndex: 20, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${progressPercent}%`,
                background: "linear-gradient(to right, var(--primary), color-mix(in oklch, var(--primary) 60%, white))",
                transition: "width 150ms linear",
              }} />
            </div>
          )}
          </div>{}
        </div>{}
      </div>{}
    </section>
  );
}
