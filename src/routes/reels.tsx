import { createFileRoute, Link } from "@tanstack/react-router";
import { Clapperboard, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/reels")({
  head: () => ({
    meta: [
      { title: "ريلز · ELQOR4N" },
      {
        name: "description",
        content: "أدوات الريلز: علامة مائية على الفيديو، وأغلفة 9:16.",
      },
    ],
  }),
  component: ReelsHub,
});

const ITEMS = [
  {
    to: "/reels-watermark" as const,
    title: "علامة مائية",
    arabic: "ريلز",
    desc: "أضف الشعار والمعرّف إلى فيديو.",
    Icon: Clapperboard,
    accent: "from-indigo-950 to-slate-900 text-slate-100 border-indigo-800",
  },
  {
    to: "/reel-cover" as const,
    title: "غلاف",
    arabic: "غِلَاف",
    desc: "صورة ثابتة 9:16 — 1080×1920.",
    Icon: ImageIcon,
    accent: "from-emerald-950 to-emerald-900 text-amber-50 border-emerald-800",
  },
];

function ReelsHub() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 grid gap-6 sm:grid-cols-2">
        {ITEMS.map(({ to, title, arabic, desc, Icon, accent }) => (
          <Link key={to} to={to} className="group">
            <div
              className={`h-56 rounded-xl border bg-gradient-to-br p-5 flex flex-col justify-between transition-transform group-hover:-translate-y-1 ${accent}`}
            >
              <div className="flex items-start justify-between">
                <Icon className="h-6 w-6 opacity-80" />
                <span
                  className="warsh-text text-xl opacity-90"
                  style={{ lineHeight: 1 }}
                >
                  {arabic}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-semibold tracking-tight">
                  {title}
                </div>
                <div className="text-xs opacity-80">{desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
