import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect, useRef, useState } from "react";
import { useSettings, useResolvedBranding, formatHandle } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Loader2, Upload, RotateCcw } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { captureNodeToBlob, triggerDownloadBlob } from "@/lib/export";
import { ShareMenu } from "@/components/ShareMenu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startDownload } from "@/lib/download-manager";



const W = 1080;
const H = 1920;

export const Route = createFileRoute("/reel-cover")({
  head: () => ({
    meta: [
      { title: "غِلَاف ريلز · ELQOR4N" },
      { name: "description", content: "مولد أغلفة 9:16 لريلز وقصيرة." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">جارٍ التحميل…</div>}>
      <ReelCoverPage />
    </ClientOnly>
  ),
});

const NODE_ID = "reel-cover-export";

function ReelCoverPage() {
  const s = useSettings();
  const rb = useResolvedBranding();
  const [title, setTitleState] = useState(s.pageState.reelCoverTitle);
  const [subtitle, setSubtitleState] = useState(s.pageState.reelCoverSubtitle);
  const [saving, setSaving] = useState(false);

  const setTitle = (v: string) => {
    setTitleState(v);
    s.setPageState("reelCoverTitle", v);
  };

  const setSubtitle = (v: string) => {
    setSubtitleState(v);
    s.setPageState("reelCoverSubtitle", v);
  };

  const downloadRef = useRef<any>(null);

  const handleDownload = () => {
    downloadRef.current = startDownload({
      id: "reel-cover",
      label: "تنزيل الغلاف",
      filename: `reel-cover-${Date.now()}.png`,
      generateBlob: async (onProgress, signal) => {
        setSaving(true);
        try {
          const blob = await captureNodeToBlob(NODE_ID, { width: W, height: H });
          return blob;
        } finally {
          setSaving(false);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)] gap-8">
        <aside className="space-y-5">
          <div>
            <Label>عنوان الريل</Label>
            <Textarea dir="rtl" rows={3} value={title} onChange={(e) => setTitle(e.target.value)} className="warsh-text text-lg" />
          </div>
          <div>
            <Label>المرجع</Label>
            <Input dir="rtl" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="warsh-text" placeholder="السورة والآية — مثال: البقرة ٢٥٥" />
            <p className="text-xs text-muted-foreground mt-1">مرجع القرآن (السورة والآية).</p>
          </div>
          <div className="rounded-lg border border-border bg-card/40 p-4 space-y-4">
            <p className="text-xs font-medium text-foreground">نمط الغلاف</p>
            <div className="space-y-2">
              <Label className="text-xs">القالب</Label>
              <Select
                value={String(s.reelCover.template)}
                onValueChange={(v) => s.setReelCover("template", v as "minimal" | "gradient" | "quran")}
              >
                <SelectTrigger className="w-full bg-background" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="minimal" dir="rtl">عاجي بسيط</SelectItem>
                  <SelectItem value="gradient" dir="rtl">تدرج زمردي</SelectItem>
                  <SelectItem value="quran" dir="rtl">ليلة قرآنية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">لون التمييز</Label>
              <div className="relative h-10 w-full overflow-hidden rounded-md border border-input shadow-sm flex items-center justify-between px-3 bg-background hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full border shadow-sm shrink-0" style={{ backgroundColor: s.reelCover.accent }} />
                  <span className="text-sm font-medium">تغيير اللون</span>
                </div>
                <input
                  type="color"
                  value={s.reelCover.accent}
                  onChange={(e) => s.setReelCover("accent", e.target.value)}
                  className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={s.reelCover.showAccentBars}
                onChange={(e) => s.setReelCover("showAccentBars", e.target.checked)}
              />
              إظهار أشرطة التمييز
            </label>
            <div className="space-y-2">
              <Label className="text-xs">صورة الخلفية</Label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-md border border-border bg-card overflow-hidden grid place-items-center text-[10px] text-muted-foreground shrink-0">
                  {s.reelCover.backgroundUrl ? (
                    <img src={s.reelCover.backgroundUrl} alt="" className="w-full h-full object-cover" />
                  ) : "لا توجد"}
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    id="reel-bg"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => s.setReelCover("backgroundUrl", String(reader.result));
                      reader.readAsDataURL(f);
                    }}
                  />
                  <Button size="sm" onClick={() => document.getElementById("reel-bg")?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-2" />رفع
                  </Button>
                  {s.reelCover.backgroundUrl && (
                    <Button size="sm" variant="ghost" onClick={() => s.setReelCover("backgroundUrl", null)}>
                      <RotateCcw className="h-3.5 w-3.5 mr-2" />إزالة
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {s.reelCover.backgroundUrl && (
              <div className="space-y-2">
                <Label className="text-xs">تعتيم: {(s.reelCover.backgroundDim * 100).toFixed(0)}%</Label>
                <input
                  type="range"
                  min={0}
                  max={0.85}
                  step={0.05}
                  value={s.reelCover.backgroundDim}
                  onChange={(e) => s.setReelCover("backgroundDim", Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              if (saving && downloadRef.current) {
                downloadRef.current.cancel();
                downloadRef.current = null;
              } else {
                handleDownload();
              }
            }}
            disabled={!downloadRef.current && saving}
            className="w-full"
            variant={saving ? "destructive" : "default"}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {saving ? "إلغاء التحميل (0%)" : "تنزيل PNG (1080×1920)"}
          </Button>
          <ShareMenu
            className="w-full"
            title="غلاف ريلز"
            text={title}
            getFile={async () => {
              const blob = await captureNodeToBlob(NODE_ID, { width: W, height: H });
              return new File([blob], `reel-cover-${Date.now()}.png`, { type: "image/png" });
            }}
          />
        </aside>


        <section className="w-full min-w-0">
          <ReelCoverPreview
            title={title}
            subtitle={subtitle}
            settings={s.reelCover}
            logoUrl={rb.logoUrl}
            username={rb.username}
            secondary={rb.collaboration ? { logoUrl: rb.secondaryLogoUrl, username: rb.secondaryUsername } : null}
          />
        </section>

        </div>
      </main>


      <div aria-hidden style={{ position: "fixed", top: 0, left: -3000, pointerEvents: "none" }}>
        <ReelCover
          id={NODE_ID}
          title={title}
          subtitle={subtitle}
          settings={s.reelCover}
          logoUrl={rb.logoUrl}
          username={rb.username}
          secondary={rb.collaboration ? { logoUrl: rb.secondaryLogoUrl, username: rb.secondaryUsername } : null}
        />
      </div>
    </div>
  );
}

type ReelCoverSettings = {
  template: "minimal" | "gradient" | "quran";
  accent: string;
  showAccentBars: boolean;
  backgroundUrl: string | null;
  backgroundDim: number;
};

function ReelCoverPreview(props: {
  title: string;
  subtitle: string;
  settings: ReelCoverSettings;
  logoUrl: string;
  username: string;
  secondary: { logoUrl: string; username: string } | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / W);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="mx-auto w-full rounded-xl overflow-hidden bg-black border border-border relative"
      style={{ maxWidth: 360, aspectRatio: "9 / 16" }}
    >
      {scale > 0 && (
        <div
          style={{
            width: W,
            height: H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <ReelCover
            id="reel-cover-preview"
            title={props.title}
            subtitle={props.subtitle}
            settings={props.settings}
            logoUrl={props.logoUrl}
            username={props.username}
            secondary={props.secondary}
          />
        </div>
      )}
    </div>
  );
}



function ReelCover({
  id, title, subtitle, settings, logoUrl, username, secondary,
}: {
  id: string;
  title: string;
  subtitle: string;
  settings: {
    template: "minimal" | "gradient" | "quran";
    accent: string;
    showAccentBars: boolean;
    backgroundUrl: string | null;
    backgroundDim: number;
  };
  logoUrl: string;
  username: string;
  secondary: { logoUrl: string; username: string } | null;
}) {
  const themes = {
    minimal: { bg: "#fbf8f3", ink: "#1a1a1a", sub: "#555", logoFilter: "brightness(0)", dimColor: "rgba(0,0,0," },
    gradient: { bg: "linear-gradient(160deg, #064e3b 0%, #052e2b 100%)", ink: "#fef3c7", sub: "#a7f3d0", logoFilter: "brightness(0) invert(1)", dimColor: "rgba(6,46,42," },
    quran: { bg: "linear-gradient(160deg, #0f172a 0%, #020617 100%)", ink: "#e5e7eb", sub: "#94a3b8", logoFilter: "brightness(0) invert(1)", dimColor: "rgba(2,6,23," },
  } as const;
  const t = themes[settings.template];
  const hasBg = !!settings.backgroundUrl;
  const logoFilter = hasBg ? "brightness(0) invert(1)" : t.logoFilter;
  const brandColor = hasBg ? "#f9fafb" : t.sub;

  const BrandRow = ({ size, fontSize }: { size: number; fontSize: number }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: secondary ? 60 : 24 }}>
      <div dir="ltr" style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {logoUrl && (
          <div style={{
            width: size,
            height: size,
            borderRadius: size * 0.2,
            overflow: 'hidden',
            backgroundColor: hasBg ? 'rgba(255,255,255,0.15)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img src={logoUrl} crossOrigin="anonymous" alt="" style={{
              width: size * 0.8,
              height: size * 0.8,
              objectFit: 'contain',
              filter: logoFilter
            }} />
          </div>
        )}
        {username && (
          <span dir="ltr" style={{ fontSize, letterSpacing: 4, color: brandColor, fontWeight: 600, unicodeBidi: "isolate" }}>
            {`\u200E${formatHandle(username, "@elqor4n")}`}
          </span>
        )}
      </div>
      {secondary && (
        <>
          <span style={{ fontSize: fontSize * 1.1, color: brandColor, opacity: 0.55 }}>×</span>
          <div dir="ltr" style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {secondary.logoUrl && (
              <div style={{
                width: size,
                height: size,
                borderRadius: size * 0.2,
                overflow: 'hidden',
                backgroundColor: hasBg ? 'rgba(255,255,255,0.15)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <img src={secondary.logoUrl} crossOrigin="anonymous" alt="" style={{
                  width: size * 0.8,
                  height: size * 0.8,
                  objectFit: 'contain',
                  filter: logoFilter
                }} />
              </div>
            )}
            {secondary.username && (
              <span dir="ltr" style={{ fontSize, letterSpacing: 4, color: brandColor, fontWeight: 600, unicodeBidi: "isolate" }}>
                {`\u200E${formatHandle(secondary.username, "@fajr_al_tilawa")}`}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      id={id}
      dir="rtl"
      style={{
        width: W,
        height: H,
        background: t.bg,
        color: t.ink,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {hasBg && (
        <>
          <img
            src={settings.backgroundUrl!}
            crossOrigin="anonymous"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: `${t.dimColor}${settings.backgroundDim})` }} />
        </>
      )}

      <div style={{ position: "relative", padding: 90, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", width: "100%", height: "100%", boxSizing: "border-box" }}>
        {/* Logo is sized to sit just above the handle cap-height so the
            two read as one lockup instead of a giant mark. */}
        <BrandRow size={secondary ? 78 : 96} fontSize={secondary ? 38 : 46} />

        <div style={{ display: "flex", flexDirection: "column", gap: 50, alignItems: "center" }}>
          {settings.showAccentBars && (
            <div style={{ width: 120, height: 6, background: settings.accent, borderRadius: 3 }} />
          )}
          <div
            className="warsh-text"
            style={{ fontSize: 110, lineHeight: 1.35, fontWeight: 600, maxWidth: 920, textAlign: 'center', direction: 'rtl', wordSpacing: 'normal', color: hasBg ? "#fff" : t.ink, textShadow: hasBg ? "0 4px 30px rgba(0,0,0,0.6)" : undefined }}
          >
            {title}
          </div>
          {subtitle && (
            <div className="warsh-text" style={{ fontSize: 52, opacity: 0.85, color: hasBg ? "#f3f4f6" : t.sub, maxWidth: 820, textAlign: 'center', direction: 'rtl', wordSpacing: 'normal' }}>
              {subtitle}
            </div>
          )}
          {settings.showAccentBars && (
            <div style={{ width: 120, height: 6, background: settings.accent, borderRadius: 3 }} />
          )}
        </div>

        <div style={{ height: secondary ? 130 : 60 }} />
      </div>
    </div>
  );
}
