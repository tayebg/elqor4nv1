import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@/components/ClientOnly";

// Load the Quran Video producer only in the browser — it uses ffmpeg,
// mp4-muxer and canvas APIs which are not SSR-safe.
const QuranVideoApp = lazy(
  () => import("@/features/quran-video/QuranVideoApp"),
);

export const Route = createFileRoute("/quran-video")({
  head: () => ({
    meta: [
      { title: "استوديو فيديوهات القرآن · ELQOR4N" },
      {
        name: "description",
        content:
          "أنشئ فيديوهات قرآنية بالتلاوة والنص المتزامن وصدّرها بصيغة MP4.",
      },
      { property: "og:title", content: "استوديو فيديوهات القرآن · ELQOR4N" },
      {
        property: "og:description",
        content:
          "أنشئ فيديوهات قرآنية بالتلاوة والنص المتزامن وصدّرها بصيغة MP4.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuranVideoPage,
});

function Fallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <div className="h-8 w-8 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
      <span>جارٍ تحميل استوديو الفيديو…</span>
    </div>
  );
}

function QuranVideoPage() {
  return (
    <div className="min-h-screen bg-background">
      <DedicationBanner />
      <ClientOnly fallback={<Fallback />}>
        <Suspense fallback={<Fallback />}>
          <QuranVideoApp />
        </Suspense>
      </ClientOnly>
    </div>
  );
}

/**
 * Arabic-only Sunnah supplication dedicated to the mother of the
 * platform's contributor. Purely presentational, never localized.
 */
function DedicationBanner() {
  return (
    <section
      dir="rtl"
      lang="ar"
      aria-label="دعاء لأم المساهم في المشروع"
      className="mx-auto max-w-3xl px-4 pt-4"
    >
      <figure className="mx-auto flex max-w-2xl items-start gap-3 bg-transparent py-2 text-start">
        <blockquote className="warsh-text text-sm sm:text-base leading-relaxed text-muted-foreground">
          اللَّهُمَّ اغْفِرْ لَهَا وَارْحَمْهَا وَعَافِهَا وَاعْفُ عَنْهَا،
          وَأَكْرِمْ نُزُلَهَا، وَوَسِّعْ مُدْخَلَهَا، وَاغْسِلْهَا بِالْمَاءِ
          وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهَا مِنَ الْخَطَايَا كَمَا يُنَقَّى
          الثَّوْبُ الْأَبْيَضُ مِنَ الدَّنَسِ.
          <span className="ms-1 text-[10px] uppercase tracking-widest text-primary/70">
            — دعاء لأم المساهم
          </span>
        </blockquote>
      </figure>
    </section>
  );
}
