import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadQuran, getHizbSlice, paginateHizb, type Ayah } from "@/lib/quran";
import { HIZB_STARTS, hizbTitleAr } from "@/lib/hizb-map";
import { CoverSlide } from "@/components/slides/CoverSlide";
import { ContentSlide } from "@/components/slides/ContentSlide";
import { ClosingSlide } from "@/components/slides/ClosingSlide";
import { Button } from "@/components/ui/button";
import { exportAllPngZip, exportAllPngFiles, triggerDownloadUrl, captureNodeToBlob } from "@/lib/export";
import { ShareMenu } from "@/components/ShareMenu";
import { Loader2, Download } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { ScaledSlide } from "@/components/ScaledSlide";
import { useSettings } from "@/lib/settings";
import { ArabicField } from "@/components/ArabicField";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startDownload } from "@/lib/download-manager";

const EXPORT_SLIDE_ID = "slide-export-current";
const SHOW_CAROUSEL_SHARE = false; // temporarily hidden while sharing pipeline is reviewed

export const Route = createFileRoute("/quran")({
  head: () => ({
    meta: [
      { title: "ELQOR4N · حِزْبٌ كُلَّ يَوْم" },
      { name: "description", content: "توليد كاروسيلات الأحزاب (رواية ورش) لإنستغرام." },
      { property: "og:title", content: "ELQOR4N · حِزْبٌ كُلَّ يَوْم" },
      { property: "og:description", content: "توليد كاروسيلات الأحزاب (رواية ورش) لإنستغرام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">جارٍ التحميل…</div>}>
      <Index />
    </ClientOnly>
  ),
});

function Index() {
  const s = useSettings();
  const [all, setAll] = useState<Ayah[] | null>(null);
  const [hizb, setHizbState] = useState(s.pageState.selectedHizb);
  const [exporting, setExporting] = useState(false);
  const [exportIndex, setExportIndex] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [sharingAll, setSharingAll] = useState(false);
  const [shareIndex, setShareIndex] = useState(0);

  const setHizb = (h: number) => {
    setHizbState(h);
    s.setPageState("selectedHizb", h);
  };

  useEffect(() => {
    loadQuran().then(setAll);
  }, []);

  const pages = useMemo(() => {
    if (!all) return [];
    const slice = getHizbSlice(all, hizb);
    return paginateHizb(slice, 18);
  }, [all, hizb]);

  const slideIds = useMemo(
    () => ["slide-cover", ...pages.map((_, i) => `slide-content-${i}`), "slide-closing"],
    [pages],
  );

  const handleZip = () => {
    startDownload({
      id: `quran-hizb-${hizb}`,
      label: `تنزيل صور الحزب ${hizb}`,
      filename: `hizb-${String(hizb).padStart(2, "0")}.zip`,
      generateBlob: async (onProgress, signal) => {
        setExporting(true);
        setExportProgress(0);
        try {
          const { blob } = await exportAllPngZip({
            count: slideIds.length,
            hizb,
            captureId: EXPORT_SLIDE_ID,
            onProgress,
            signal,
            prepareSlide: async (index) => {
              setExportIndex(index);
              await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
            },
          });
          return blob;
        } finally {
          setExporting(false);
        }
      }
    });
  };

  const total = slideIds.length;
  const safeIdx = Math.min(previewIndex, total - 1);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)] gap-8">
        <aside className="space-y-6 w-full min-w-0">
          <section className="space-y-3">
            <label className="text-sm font-medium">اختر الحزب</label>
            <Select
              value={String(hizb)}
              onValueChange={(v) => { setHizb(Number(v)); setPreviewIndex(0); }}
            >
              <SelectTrigger className="w-full bg-background" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {HIZB_STARTS.map((h) => (
                  <SelectItem key={h.hizb} value={String(h.hizb)} dir="rtl">
                    {hizbTitleAr(h.hizb)} — الجزء {Math.ceil(h.hizb / 2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section className="space-y-2">
            <div className="text-sm font-medium">التصدير</div>
            <Button onClick={handleZip} disabled={!all || exporting} className="w-full">
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {exporting
                ? `جارٍ التوليد… ${exportProgress}%`
                : `تنزيل ${slideIds.length} صورة (ZIP)`}
            </Button>
            {SHOW_CAROUSEL_SHARE && (
              <ShareMenu
                className="w-full"
                label="مشاركة الكاروسيل"
                title="حِزْبٌ كُلَّ يَوْم"
                text="حِزْبٌ كُلَّ يَوْم"
                disabled={!all || sharingAll}
                getFile={async () => {
                  const blob = await captureNodeToBlob(`preview-${slideIds[safeIdx]}`, { width: 1080, height: 1080 });
                  return new File([blob], `hizb-${safeIdx + 1}.png`, { type: "image/png" });
                }}
                getFiles={async () => {
                  setSharingAll(true);
                  try {
                    return await exportAllPngFiles({
                      count: slideIds.length,
                      captureId: EXPORT_SLIDE_ID,
                      filename: (i) => `hizb-${String(hizb).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}.png`,
                      prepareSlide: async (i) => {
                        setShareIndex(i);
                        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
                      },
                    });
                  } finally {
                    setSharingAll(false);
                  }
                }}
              />
            )}

            <p className="text-xs text-muted-foreground">
              الصور بحجم 1080×1080 — مناسبة لكاروسيل إنستغرام.
            </p>
          </section>

          {all && (
            <section className="text-xs text-muted-foreground space-y-1">
              <div>عدد الآيات في البيانات: {all.length.toLocaleString()}</div>
              <div>عدد الشرائح في هذا الكاروسيل: {total}</div>
            </section>
          )}

          <section className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
            <p className="text-xs font-medium text-foreground">محتوى الحزب</p>
            <div className="space-y-1.5">
              <Label className="text-xs">سطر الرواية</Label>
              <ArabicField value={s.quran.narration} onChange={(v) => s.setQuran("narration", v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الاستعاذة (الغلاف)</Label>
              <ArabicField value={s.quran.isticadhah} onChange={(v) => s.setQuran("isticadhah", v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">دعاء الختام</Label>
              <ArabicField multiline value={s.quran.closingDua} onChange={(v) => s.setQuran("closingDua", v)} />
            </div>
          </section>
        </aside>

        <section className="space-y-4 w-full min-w-0">
          {!all ? (
            <div className="aspect-square w-full max-w-xl mx-auto rounded-md border border-dashed flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />جارٍ تحميل بيانات ورش…
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  معاينة {safeIdx + 1} / {total}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={safeIdx === 0}
                    onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}>السابق</Button>
                  <Button size="sm" variant="outline" disabled={safeIdx === total - 1}
                    onClick={() => setPreviewIndex((i) => Math.min(total - 1, i + 1))}>التالي</Button>
                </div>
              </div>

              <div className="w-full max-w-xl mx-auto">
                <ScaledSlide>
                  <RenderSlide
                    index={safeIdx}
                    hizb={hizb}
                    pages={pages}
                    slideIds={slideIds}
                  />
                </ScaledSlide>
              </div>

              <div className="flex gap-2 overflow-x-auto py-2">
                {slideIds.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPreviewIndex(i)}
                    className={`shrink-0 w-14 h-14 rounded border text-xs ${
                      i === safeIdx
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {exporting &&
        createPortal(
          <div
            aria-hidden
            style={{
              position: "fixed",
              top: 0,
              left: -2000,
              width: 1080,
              pointerEvents: "none",
            }}
          >
            <RenderSlide
              index={exportIndex}
              hizb={hizb}
              pages={pages}
              slideIds={slideIds}
              slideId={EXPORT_SLIDE_ID}
            />
          </div>,
          document.body,
        )}

      {sharingAll &&
        createPortal(
          <div
            aria-hidden
            style={{
              position: "fixed",
              top: 0,
              left: -2000,
              width: 1080,
              pointerEvents: "none",
            }}
          >
            <RenderSlide
              index={shareIndex}
              hizb={hizb}
              pages={pages}
              slideIds={slideIds}
              slideId={EXPORT_SLIDE_ID}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}


function RenderSlide({
  index, hizb, pages, slideIds, slideId,
}: { index: number; hizb: number; pages: ReturnType<typeof paginateHizb>; slideIds: string[]; slideId?: string }) {
  const id = slideId ?? `preview-${slideIds[index]}`;
  if (index === 0) return <CoverSlide hizb={hizb} slideId={id} />;
  if (index === slideIds.length - 1) return <ClosingSlide slideId={id} />;
  const p = pages[index - 1];
  return (
    <ContentSlide
      hizb={hizb}
      page={p}
      pageNumber={index}
      totalPages={pages.length}
      slideId={id}
    />
  );
}
