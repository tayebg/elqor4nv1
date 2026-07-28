import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ScrollText, Shield, MessageSquareQuote } from "lucide-react";

export const Route = createFileRoute("/posts")({
  head: () => ({
    meta: [
      { title: "المنشورات · ELQOR4N" },
      { name: "description", content: "بطاقات وكاروسيلات جاهزة للنشر: القرآن، الحديث، الأذكار، والتغريدات." },
    ],
  }),
  component: PostsHub,
});

const ITEMS = [
  { to: "/quran" as const, title: "حِزْبٌ كُلَّ يَوْم", arabic: "حِزْبٌ كُلَّ يَوْم", desc: "كاروسيلات قرآنية — رواية وَرْش عن نافع.", Icon: BookOpen, accent: "from-amber-50 to-stone-100 text-stone-900 border-stone-300" },
  { to: "/nawawi" as const, title: "حَدِيثٌ كُلَّ يَوْم", arabic: "حَدِيثٌ كُلَّ يَوْم", desc: "الأربعون النووية للإمام النووي.", Icon: ScrollText, accent: "from-emerald-950 to-emerald-900 text-amber-50 border-emerald-800" },
  { to: "/hisn" as const, title: "حِصْنُ الْيَوْم", arabic: "حِصْنُ الْيَوْم", desc: "أذكار الحصن بابًا بابًا.", Icon: Shield, accent: "from-indigo-950 to-slate-900 text-slate-100 border-indigo-800" },
  { to: "/tweet" as const, title: "تَغْرِيدَة", arabic: "تَغْرِيدَة", desc: "منشور بأسلوب تويتر الكلاسيكي.", Icon: MessageSquareQuote, accent: "from-sky-50 to-slate-100 text-slate-900 border-sky-200" },
];

function PostsHub() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ to, title, arabic, desc, Icon, accent }) => (
          <Link key={to} to={to} className="group">
            <div className={`h-56 rounded-xl border bg-gradient-to-br p-5 flex flex-col justify-between transition-transform group-hover:-translate-y-1 ${accent}`}>
              <div className="flex items-start justify-between">
                <Icon className="h-6 w-6 opacity-80" />
                <span className="warsh-text text-xl opacity-90" style={{ lineHeight: 1 }}>{arabic}</span>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-semibold tracking-tight">{title}</div>
                <div className="text-xs opacity-80">{desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
