import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadHisn, type HisnChapter } from "@/lib/hisn";
import { paginateHadith } from "@/lib/nawawi";
import { HisnItemSlide, HisnClosingSlide } from "@/components/slides/HisnSlide";
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

const EXPORT_ID = "slide-export-hisn";
const SHOW_CAROUSEL_SHARE = false; // temporarily hidden while sharing pipeline is reviewed

export const Route = createFileRoute("/hisn")({
  head: () => ({
    meta: [
      { title: "ELQOR4N · حِصْنُ الْيَوْم" },
      { name: "description", content: "توليد كاروسيلات أذكار حصن المسلم لإنستغرام." },
      { property: "og:title", content: "ELQOR4N · حِصْنُ الْيَوْم" },
      { property: "og:description", content: "توليد كاروسيلات أذكار حصن المسلم لإنستغرام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">جارٍ التحميل…</div>}>
      <HisnPage />
    </ClientOnly>
  ),
});

function HisnPage() {
  const s = useSettings();
  const [all, setAll] = useState<HisnChapter[] | null>(null);
  const [chIdx, setChIdxState] = useState(s.pageState.selectedHisnChapter);
  const [exporting, setExporting] = useState(false);
  const [exportIdx, setExportIdx] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const downloadRef = useRef<any>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [sharingAll, setSharingAll] = useState(false);
  const [shareIndex, setShareIndex] = useState(0);

  const setChIdx = (i: number) => {
    setChIdxState(i);
    s.setPageState("selectedHisnChapter", i);
  };

  useEffect(() => { loadHisn().then(setAll); }, []);

  const chapter = all?.find((c) => c.index === chIdx);
  const slideIds = useMemo(() => {
    if (!chapter) return [];
    const slides: {
      type: "item" | "closing";
      itemIndex?: number;
      pageText?: string;
      pageNumber?: number;
      totalPages?: number;
      id: string;
    }[] = [];

    chapter.items.forEach((item, itemIndex) => {
      const cleanText = item.text.replace(/[\(\)\[\]\{\}\*_\-]/g, '').trim();
      const pages = paginateHadith(cleanText);
      pages.forEach((pageText, pageIdx) => {
        slides.push({
          type: "item",
          itemIndex,
          pageText,
          pageNumber: pageIdx + 1,
          totalPages: pages.length,
          id: `h-item-${itemIndex}-page-${pageIdx}`,
        });
      });
    });
    slides.push({ type: "closing", id: "h-closing" });
    return slides;
  }, [chapter]);

  const total = slideIds.length;
  const safeIdx = Math.min(previewIdx, Math.max(0, total - 1));

  const handleZip = () => {
    if (!chapter) return;
    downloadRef.current = startDownload({
      id: `hisn-chapter-${chIdx}`,
      label: `تنزيل صور حصن المسلم ${chIdx}`,
      filename: `hisn-${String(chIdx).padStart(3, "0")}.zip`,
      generateBlob: async (onProgress, signal) => {
        setExporting(true);
        setExportProgress(0);
        try {
          const { blob } = await exportAllPngZip({
            count: slideIds.length,
            hizb: chIdx,
            captureId: EXPORT_ID,
            onProgress,
            signal,
            prepareSlide: async (i) => {
              setExportIdx(i);
              await new Promise((r) => requestAnimationFrame(() => r(null)));
            },
          });
          return blob;
        } finally {
          setExporting(false);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)] gap-8">
        <aside className="space-y-6 w-full min-w-0">
          <section className="space-y-3">
            <label className="text-sm font-medium">اختر الباب</label>
            <Select
              value={String(chIdx)}
              onValueChange={(v) => { setChIdx(Number(v)); setPreviewIdx(0); }}
              disabled={!all}
            >
              <SelectTrigger className="w-full bg-background" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {all?.map((c) => (
                  <SelectItem key={c.index} value={String(c.index)} dir="rtl">
                    {c.index}. {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section className="space-y-2">
            <div className="text-sm font-medium">التصدير</div>
            <Button
              onClick={() => {
                if (exporting && downloadRef.current) {
                  downloadRef.current.cancel();
                  downloadRef.current = null;
                } else {
                  handleZip();
                }
              }}
              disabled={!chapter && !exporting}
              className="w-full"
              variant={exporting ? "destructive" : "default"}
            >
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {exporting ? `إلغاء التحميل (${exportProgress}%)` : `تنزيل ${total} صورة (ZIP)`}
            </Button>
            {SHOW_CAROUSEL_SHARE && (
              <ShareMenu
                className="w-full"
                label="مشاركة الكاروسيل"
                title="حصن المسلم"
                text={chapter ? `${chapter.title} · حصن المسلم` : "حصن المسلم"}
                disabled={!chapter || sharingAll}
                getFile={async () => {
                  const slide = slideIds[safeIdx];
                  const blob = await captureNodeToBlob(`preview-${slide.id}`, { width: 1080, height: 1080 });
                  return new File([blob], `hisn-${String(chIdx).padStart(3, "0")}-${safeIdx + 1}.png`, { type: "image/png" });
                }}
                getFiles={async () => {
                  setSharingAll(true);
                  try {
                    return await exportAllPngFiles({
                      count: slideIds.length,
                      captureId: EXPORT_ID,
                      filename: (i) => `hisn-${String(chIdx).padStart(3, "0")}-${String(i + 1).padStart(2, "0")}.png`,
                      prepareSlide: async (i) => {
                        setShareIndex(i);
                        await new Promise((r) => requestAnimationFrame(() => r(null)));
                      },
                    });
                  } finally {
                    setSharingAll(false);
                  }
                }}
              />
            )}

            <p className="text-xs text-muted-foreground">1080×1080 — مناسبة لكاروسيل إنستغرام.</p>
          </section>

          {chapter && (
            <section className="text-xs text-muted-foreground space-y-1">
              <div>{chapter.items.length} ذكرًا في هذا الباب</div>
              <div>{total} شرائح إجمالًا</div>
            </section>
          )}

          <section className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
            <p className="text-xs font-medium text-foreground">محتوى الحصن</p>
            <div className="space-y-1.5">
              <Label className="text-xs">دعاء الختام</Label>
              <ArabicField multiline value={s.hisn.closingDua} onChange={(v) => s.setHisn("closingDua", v)} />
            </div>
          </section>
        </aside>

        <section className="space-y-4 w-full min-w-0">
          {!all || !chapter ? (
            <div className="aspect-square w-full max-w-xl mx-auto rounded-md border border-dashed flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />جارٍ التحميل…
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">معاينة {safeIdx + 1} / {total}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={safeIdx === 0}
                    onClick={() => setPreviewIdx((i) => Math.max(0, i - 1))}>السابق</Button>
                  <Button size="sm" variant="outline" disabled={safeIdx === total - 1}
                    onClick={() => setPreviewIdx((i) => Math.min(total - 1, i + 1))}>التالي</Button>
                </div>
              </div>
              <div className="w-full max-w-xl mx-auto">
                <ScaledSlide>
                  <RenderSlide idx={safeIdx} chapter={chapter} slideIds={slideIds} />
                </ScaledSlide>
              </div>
              <div className="flex gap-2 overflow-x-auto py-2">
                {slideIds.map((_, i) => (
                  <button key={i} onClick={() => setPreviewIdx(i)}
                    className={`shrink-0 w-14 h-14 rounded border text-xs ${i === safeIdx ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {exporting && chapter &&
        createPortal(
          <div aria-hidden style={{ position: "fixed", top: 0, left: -2000, width: 1080, pointerEvents: "none" }}>
            <RenderSlide idx={exportIdx} chapter={chapter} slideIds={slideIds} slideId={EXPORT_ID} />
          </div>,
          document.body,
        )}

      {sharingAll && chapter &&
        createPortal(
          <div aria-hidden style={{ position: "fixed", top: 0, left: -2000, width: 1080, pointerEvents: "none" }}>
            <RenderSlide idx={shareIndex} chapter={chapter} slideIds={slideIds} slideId={EXPORT_ID} />
          </div>,
          document.body,
        )}
    </div>
  );
}


function RenderSlide({
  idx, chapter, slideIds, slideId,
}: { idx: number; chapter: HisnChapter; slideIds: any[]; slideId?: string }) {
  const slide = slideIds[idx];
  const id = slideId ?? `preview-${slide.id}`;
  if (slide.type === "closing") return <HisnClosingSlide slideId={id} />;
  return (
    <HisnItemSlide 
      chapter={chapter} 
      itemIndex={slide.itemIndex!} 
      slideId={id} 
      pageText={slide.pageText!}
      pageNumber={slide.pageNumber!}
      totalPages={slide.totalPages!}
    />
  );
}
