import { useRef, useState, useMemo } from "react";

/**
 * Feature flags for the video studio.
 *
 * `videoExport` controls the native video export buttons (Export video +
 * Reels 60s). `shareSlot` controls the "Export and share" ShareMenu drop-in.
 * Both stay wired up so they can be re-enabled without re-implementing anything.
 */
const FEATURE_FLAGS = { videoExport: true, shareSlot: false };
import { useTranslation } from "react-i18next";
import { videoSizes } from "../data/quranData";
import { defaultBackgrounds, translationLanguages, tafsirSources } from "../data/backgrounds";
import { usePixabay } from "../hooks/usePixabay";
import {
  BookOpen,
  ListOrdered,
  Film,
  Mic,
  Image as ImageIcon,
  Palette,
  Languages,
  SlidersHorizontal,
  Search,
  Upload,
  Loader2,
  Music,
  Smartphone,
  Wand2,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeTapButton } from "@/components/SafeTapButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Section header — icon chip + label + hairline, all on design tokens. */
function Section({ icon: Icon, title }) {
  return (
    <div className="mt-6 mb-3 flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-muted/60 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
      <Separator className="flex-1" />
    </div>
  );
}

function Panel({ className, children }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card/50 p-4", className)}>{children}</div>
  );
}

export default function SettingsPanel({
  settings, onSettingsChange, chapters, reciters, loading,
  bgImage, onBgChange, onCustomBgUpload, onCustomBgFromUrl,
  textColor, onTextColorChange,
  translationColor, onTranslationColorChange,
  showTranslation, onShowTranslationChange, translationId, onTranslationIdChange,
  contentMode, onContentModeChange, tafsirId, onTafsirIdChange,
  bgScale, onBgScaleChange, bgDim, onBgDimChange,
  bgBlur, onBgBlurChange, textScale, onTextScaleChange,
  timedVerses, onAutoShorts,
  onExportVideo, onExportReels, onDownloadAudio,
  isExporting = false, exportProgress = 0,
  exportStatus = "", audioReady = false,
  shareSlot = null,
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const { results: pixabayResults, loading: pixLoading, error: pixError, searchImages, searchVideos } = usePixabay();
  const [pixQuery, setPixQuery] = useState("");
  const [pixMode, setPixMode] = useState("image");
  // Track which export button initiated the current export so only that
  // button shows the loading state.
  const [activeExport, setActiveExport] = useState(null); // "video" | "reels" | null
  if (!isExporting && activeExport) {
    // Reset once the parent's isExporting flips back to false.
    setActiveExport(null);
  }
  const handleExportVideo = () => {
    setActiveExport("video");
    onExportVideo?.();
  };
  const handleExportReels = () => {
    setActiveExport("reels");
    onExportReels?.();
  };
  const isExportingVideo = isExporting && activeExport === "video";
  const isExportingReels = isExporting && activeExport === "reels";

  const [showPixModal, setShowPixModal] = useState(false);

  const selectedChapter = useMemo(
    () => chapters.find((c) => c.id === settings.surahId),
    [chapters, settings.surahId],
  );
  const maxAyah = selectedChapter ? selectedChapter.verses_count : 1;

  const handleSurahChange = (value) => {
    const surahId = parseInt(value, 10);
    const chapter = chapters.find((c) => c.id === surahId);
    onSettingsChange({ ...settings, surahId, fromAyah: 1, toAyah: chapter?.verses_count || 1 });
  };

  const handlePixSearch = () => {
    if (!pixQuery.trim()) return;
    if (pixMode === "video") searchVideos(pixQuery);
    else searchImages(pixQuery);
    setShowPixModal(true);
  };

  const handlePixSelect = async (item) => {
    setShowPixModal(false);
    const isVideo = item.type === "video";
    try {
      const res = await fetch(item.large);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      onCustomBgFromUrl(URL.createObjectURL(blob), isVideo);
    } catch {
      onCustomBgFromUrl(item.large, isVideo);
    }
  };

  const sliders = [
    { key: "bgScale", label: t("bg_scale"), value: bgScale, unit: "%", min: 50, max: 150, onChange: onBgScaleChange },
    { key: "bgDim", label: t("bg_dim"), value: bgDim, unit: "%", min: 0, max: 100, onChange: onBgDimChange },
    { key: "bgBlur", label: t("bg_blur"), value: bgBlur, unit: "px", min: 0, max: 30, onChange: onBgBlurChange },
    { key: "textScale", label: t("text_scale"), value: textScale, unit: "%", min: 50, max: 150, onChange: onTextScaleChange },
  ];

  return (
    <aside className="flex w-full min-h-0 flex-1 flex-col border-t border-border bg-background lg:h-full lg:w-1/3 lg:border-s lg:border-t-0">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 md:px-5">
        <Section icon={BookOpen} title={t("surah")} />
        <Panel>
          <Select value={String(settings.surahId)} onValueChange={handleSurahChange} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("loading_text")} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {chapters.map((ch) => (
                <SelectItem key={ch.id} value={String(ch.id)}>
                  {ch.id}. {ch.name_arabic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Panel>

        <Section icon={ListOrdered} title={t("ayah_range")} />
        <Panel className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("from_ayah")}</Label>
              <Select
                value={String(settings.fromAyah)}
                onValueChange={(v) => {
                  const n = parseInt(v, 10);
                  onSettingsChange({ ...settings, fromAyah: n, toAyah: Math.max(n, settings.toAyah) });
                }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {Array.from({ length: maxAyah }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("to_ayah")}</Label>
              <Select
                value={String(settings.toAyah)}
                onValueChange={(v) => onSettingsChange({ ...settings, toAyah: parseInt(v, 10) })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {Array.from({ length: maxAyah - settings.fromAyah + 1 }, (_, i) => {
                    const v = settings.fromAyah + i;
                    return <SelectItem key={v} value={String(v)}>{v}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full h-auto min-h-9 whitespace-normal text-center leading-snug py-2 gap-2"
            onClick={onAutoShorts}
            disabled={!timedVerses || timedVerses.length === 0}
          >
            <Wand2 className="h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{t("auto_shorts")}</span>
          </Button>
        </Panel>

        <Section icon={Film} title={t("video_size")} />
        <Panel>
          <Select
            value={settings.videoSize}
            onValueChange={(v) => onSettingsChange({ ...settings, videoSize: v })}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {videoSizes.map((size) => (
                <SelectItem key={size.id} value={size.id}>{t(`size_${size.id}`, { defaultValue: size.name })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Panel>

        <Section icon={Mic} title={t("reciter")} />
        <Panel>
          <Select
            value={settings.reciterId}
            onValueChange={(v) => onSettingsChange({ ...settings, reciterId: v })}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {reciters.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.translated_name?.name || r.reciter_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Panel>

        <Section icon={ImageIcon} title={t("background")} />
        <Panel className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {defaultBackgrounds.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => onBgChange(bg.src)}
                className={cn(
                  "relative aspect-video overflow-hidden rounded-md border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  bgImage === bg.src
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50",
                )}
              >
                <img src={bg.src} alt={bg.name} className="h-full w-full object-cover" loading="lazy" />
                {bgImage === bg.src && (
                  <span className="absolute inset-0 grid place-items-center bg-primary/25 text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            ))}
          </div>

          <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            {t("upload_bg")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onCustomBgUpload(file);
              // Reset so the same file can be selected again after removal.
              e.target.value = "";
            }}
          />


          <div className="space-y-2">
            <Tabs value={pixMode} onValueChange={setPixMode}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image">{t("pixabay_images")}</TabsTrigger>
                <TabsTrigger value="video">{t("pixabay_videos")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex gap-2">
            <Input
              value={pixQuery}
              onChange={(e) => setPixQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePixSearch()}
              placeholder={pixMode === "video" ? t("search_videos") : t("search_photos")}
            />
            <SafeTapButton variant="secondary" size="icon" onClick={handlePixSearch} disabled={pixLoading}>
              {pixLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </SafeTapButton>
          </div>
        </Panel>

        <Section icon={SlidersHorizontal} title={t("effects")} />
        <Panel className="space-y-5">
          {sliders.map((s) => (
            <div key={s.key} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="min-w-0 truncate text-xs text-muted-foreground">{s.label}</Label>
                <span className="shrink-0 font-mono text-xs font-medium text-primary">
                  {s.value}{s.unit}
                </span>
              </div>
              <Slider
                min={s.min}
                max={s.max}
                step={1}
                value={[s.value]}
                onValueChange={(v) => s.onChange(v[0])}
              />
            </div>
          ))}
        </Panel>

        <Section icon={Palette} title={t("colors")} />
        <Panel>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("text_color"), value: textColor, onChange: onTextColorChange },
              { label: t("translation_color"), value: translationColor, onChange: onTranslationColorChange },
            ].map((c) => (
              <div key={c.label} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{c.label}</Label>
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-2">
                  <input
                    type="color"
                    value={c.value}
                    onChange={(e) => c.onChange(e.target.value)}
                    className="h-6 w-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label={c.label}
                  />
                  <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
                    {c.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Section icon={Languages} title={t("translation_section")} />
        <Panel className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="qv-show-translation" className="text-sm">
              {t("show_helper_text")}
            </Label>
            <Switch
              id="qv-show-translation"
              checked={showTranslation}
              onCheckedChange={onShowTranslationChange}
            />
          </div>

          {showTranslation && (
            <>
              <Tabs value={contentMode} onValueChange={onContentModeChange}>
                <TabsList className="w-full">
                  <TabsTrigger value="translation" className="flex-1">
                    <Languages className="h-3.5 w-3.5" />
                    {t("translation")}
                  </TabsTrigger>
                  <TabsTrigger value="tafsir" className="flex-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {t("tafsir")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {contentMode === "translation" ? (
                <Select
                  value={String(translationId)}
                  onValueChange={(v) => onTranslationIdChange(parseInt(v, 10))}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {translationLanguages.map((lang) => (
                      <SelectItem key={lang.id} value={String(lang.id)}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={String(tafsirId)} onValueChange={(v) => onTafsirIdChange(parseInt(v, 10))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {tafsirSources.map((src) => (
                      <SelectItem key={src.id} value={String(src.id)}>{src.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}
          <p className="text-xs text-muted-foreground">
            العلامة المائية والشعارات والتعاون تُدار من الإعدادات ← الهوية.
          </p>
        </Panel>
      </div>

      {/* Sticky action bar.
          Video export (Export video + Reels 60s) is enabled. The ShareMenu
          drop-in ("Export and share") is temporarily hidden while its pipeline
          is reviewed. The handlers, ShareMenu slot and progress UI stay wired
          up behind FEATURE_FLAGS so they can be re-enabled without changes. */}
      <div className="shrink-0 space-y-3 border-t border-border bg-card/60 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur md:p-5">
        {FEATURE_FLAGS.videoExport && isExporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="min-w-0 truncate">{exportStatus}</span>
              <span className="shrink-0 font-mono">{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-xs text-muted-foreground">{t("export_keep_open")}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">
            {selectedChapter?.name_arabic || "الفاتحة"} · {t("ayah_word")} {settings.fromAyah}–{settings.toAyah}
          </span>
          <span className="shrink-0">
            {settings.toAyah - settings.fromAyah + 1} {t("ayah_word")}
          </span>
        </div>

        <div className="grid gap-2">
          <SafeTapButton
            variant="outline"
            onClick={onDownloadAudio}
            disabled={!audioReady || isExporting}
          >
            <Music className="h-4 w-4" />
            {t("download_audio")}
          </SafeTapButton>
          {FEATURE_FLAGS.shareSlot && shareSlot}
        </div>

        {FEATURE_FLAGS.videoExport && (
          <div className="grid gap-2">
            <SafeTapButton
              onClick={handleExportVideo}
              disabled={!audioReady || isExporting}
            >
              {isExportingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
              {isExportingVideo ? t("exporting") : t("export_video")}
            </SafeTapButton>
            <SafeTapButton
              variant="secondary"
              onClick={handleExportReels}
              disabled={!audioReady || isExporting}
            >
              {isExportingReels ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
              {isExportingReels ? t("exporting") : t("reels_60s")}
            </SafeTapButton>
          </div>
        )}

      </div>

      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("choose_pixabay")}</DialogTitle>
          </DialogHeader>

          <Tabs value={pixMode} onValueChange={setPixMode}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image">{t("pixabay_images")}</TabsTrigger>
              <TabsTrigger value="video">{t("pixabay_videos")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Input
              value={pixQuery}
              onChange={(e) => setPixQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePixSearch()}
              placeholder={t("search_placeholder")}
              autoFocus
            />
            <SafeTapButton onClick={handlePixSearch} disabled={pixLoading}>
              {pixLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {t("search")}
            </SafeTapButton>
          </div>

          <div className="max-h-[55vh] overflow-y-auto">
            {pixLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t("searching")}
              </div>
            ) : pixError ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                <AlertTriangle className="h-9 w-9 opacity-40" />
                <p className="text-sm">{pixError}</p>
              </div>
            ) : pixabayResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {pixabayResults.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => handlePixSelect(item)}
                    className="group relative aspect-video overflow-hidden rounded-md border border-border transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.type === "video" ? (
                      <video
                        src={item.medium || item.large}
                        poster={item.preview}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={item.preview}
                        alt={item.tags}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {item.type === "video" && (
                      <span className="absolute start-2 top-2 rounded-md bg-card/90 px-1.5 py-0.5 text-[10px] font-medium text-card-foreground shadow-sm">
                        {t("pixabay_video")}{item.duration ? ` · ${item.duration}s` : ""}
                      </span>
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-background/0 transition-colors group-hover:bg-background/60">
                      <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        {t("select_check")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                <ImageIcon className="h-9 w-9 opacity-40" />
                <p className="text-sm">{t("search_hint")}</p>
              </div>
            )}
          </div>

          <DialogFooter className="items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">{t(pixMode === "video" ? "pixabay_free_videos" : "pixabay_free")}</span>
            <Button variant="outline" onClick={() => setShowPixModal(false)}>{t("cancel")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
