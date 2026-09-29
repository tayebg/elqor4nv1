import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadNawawi, paginateHadith, hadithTitleAr, type NawawiHadith } from "@/lib/nawawi";
import { NawawiContentSlide, NawawiClosingSlide } from "@/components/slides/NawawiSlide";
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

const EXPORT_ID = "slide-export-nawawi";
const SHOW_CAROUSEL_SHARE = false; // temporarily hidden while sharing pipeline is reviewed

export const Route = createFileRoute("/nawawi")({
  head: () => ({
    meta: [
      { title: "ELQOR4N · حديثٌ كُلَّ يَوْم" },
      { name: "description", content: "توليد كاروسيلات الأربعين النووية لإنستغرام." },
      { property: "og:title", content: "ELQOR4N · حديثٌ كُلَّ يَوْم" },
      { property: "og:description", content: "توليد كاروسيلات الأربعين النووية لإنستغرام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">جارٍ التحميل…</div>}>
      <NawawiPage />
    </ClientOnly>
  ),
});

function NawawiPage() {
  const s = useSettings();
  const [all, setAll] = useState<NawawiHadith[] | null>(null);
  const [index, setIndexState] = useState(s.pageState.selectedHadith);
  const [exporting, setExporting] = useState(false);
  const [exportIdx, setExportIdx] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [sharingAll, setSharingAll] = useState(false);
  const [shareIndex, setShareIndex] = useState(0);

  const setIndex = (i: number) => {
    setIndexState(i);
    s.setPageState("selectedHadith", i);
  };

  useEffect(() => { loadNawawi().then(setAll); }, []);

  const hadith = all?.find((h) => h.index === index);
  const pages = useMemo(() => hadith ? paginateHadith(hadith.body) : [], [hadith]);
  const slideIds = useMemo(
    () => [...pages.map((_, i) => `n-content-${i}`), "n-closing"],
    [pages],
  );

  const total = slideIds.length;
  const safeIdx = Math.min(previewIdx, Math.max(0, total - 1));

  const handleZip = () => {
    if (!hadith) return;
    startDownload({
      id: `nawawi-hadith-${index}`,
      label: `تنزيل صور الحديث ${index}`,
      filename: `hadith-${String(index).padStart(2, "0")}.zip`,
      generateBlob: async (onProgress, signal) => {
        setExporting(true);
        setExportProgress(0);
        try {
          const { blob } = await exportAllPngZip({
            count: slideIds.length,
            hizb: index, // reused as folder/filename number
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
            <label className="text-sm font-medium">اختر الحديث</label>
            <Select
              value={String(index)}
              onValueChange={(v) => { setIndex(Number(v)); setPreviewIdx(0); }}
              disabled={!all}
            >
              <SelectTrigger className="w-full bg-background" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {all?.map((h) => (
                  <SelectItem key={h.index} value={String(h.index)} dir="rtl">
                    {hadithTitleAr(h.index)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section className="space-y-2">
            <div className="text-sm font-medium">التصدير</div>
            <Button onClick={handleZip} disabled={!all || exporting} className="w-full">
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {exporting ? `جارٍ التوليد… ${exportProgress}%` : `تنزيل ${total} صورة (ZIP)`}
            </Button>
            {SHOW_CAROUSEL_SHARE && (
              <ShareMenu
                className="w-full"
                label="مشاركة الكاروسيل"
                title="الأربعون النووية"
                text="الأربعون النووية"
                disabled={!all || sharingAll}
                getFile={async () => {
                  const blob = await captureNodeToBlob(`preview-${slideIds[safeIdx]}`, { width: 1080, height: 1080 });
                  return new File([blob], `nawawi-${safeIdx + 1}.png`, { type: "image/png" });
                }}
                getFiles={async () => {
                  setSharingAll(true);
                  try {
                    return await exportAllPngFiles({
                      count: slideIds.length,
                      captureId: EXPORT_ID,
                      filename: (i) => `hadith-${String(index).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}.png`,
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

          <section className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
            <p className="text-xs font-medium text-foreground">محتوى الأربعين النووية</p>
            <div className="space-y-1.5">
              <Label className="text-xs">سطر الختام</Label>
              <ArabicField multiline value={s.nawawi.closingDua} onChange={(v) => s.setNawawi("closingDua", v)} />
            </div>
          </section>
        </aside>

        <section className="space-y-4 w-full min-w-0">
          {!all || !hadith ? (
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
                  <RenderSlide idx={safeIdx} hadith={hadith} pages={pages} slideIds={slideIds} />
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

      {exporting && hadith &&
        createPortal(
          <div aria-hidden style={{ position: "fixed", top: 0, left: -2000, width: 1080, pointerEvents: "none" }}>
            <RenderSlide idx={exportIdx} hadith={hadith} pages={pages} slideIds={slideIds} slideId={EXPORT_ID} />
          </div>,
          document.body,
        )}

      {sharingAll && hadith &&
        createPortal(
          <div aria-hidden style={{ position: "fixed", top: 0, left: -2000, width: 1080, pointerEvents: "none" }}>
            <RenderSlide idx={shareIndex} hadith={hadith} pages={pages} slideIds={slideIds} slideId={EXPORT_ID} />
          </div>,
          document.body,
        )}
    </div>
  );
}


function RenderSlide({
  idx, hadith, pages, slideIds, slideId,
}: { idx: number; hadith: NawawiHadith; pages: string[]; slideIds: string[]; slideId?: string }) {
  const id = slideId ?? `preview-${slideIds[idx]}`;
  if (idx === slideIds.length - 1) return <NawawiClosingSlide slideId={id} />;
  return (
    <NawawiContentSlide
      hadith={hadith}
      pageText={pages[idx]}
      pageNumber={idx + 1}
      totalPages={pages.length}
      slideId={id}
    />
  );
}
