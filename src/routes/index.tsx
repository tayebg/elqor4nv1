import { createFileRoute, Link } from "@tanstack/react-router";
import { useSettings } from "@/lib/settings";
import { Heart, Github, Linkedin, Mail, Sparkles } from "lucide-react";
import {
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
} from "@/components/SocialIcons";
import appLogoUrl from "@/assets/elqor4n-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ELQOR4N · منصة المحتوى الإسلامي" },
      {
        name: "description",
        content: "منصة توليد منشورات وفيديوهات إسلامية: قرآن، حديث، حصن، تغريدات، ريلز.",
      },
      { property: "og:title", content: "ELQOR4N · منصة المحتوى الإسلامي" },
      { property: "og:description", content: "منصة توليد منشورات وفيديوهات إسلامية: قرآن، حديث، حصن، تغريدات، ريلز." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

// Official social accounts — the reference layout is a single dark row with
// icon + username. Instagram gets numbered badges because there are two pages.
const SOCIALS = [
  { Icon: TikTokIcon, handle: "@elqor4n", href: "https://www.tiktok.com/@elqor4n" },
  { Icon: FacebookIcon, handle: "@elqor4n", href: "https://www.facebook.com/elqor4n" },
  { Icon: InstagramIcon, handle: "@elqor4n", href: "https://www.instagram.com/elqor4n/", badge: 1 },
  { Icon: InstagramIcon, handle: "@fajr_al_tilawa", href: "https://www.instagram.com/fajr_al_tilawa/", badge: 2 },
];

function Home() {
  // Reserved for future personalization on the home screen.
  useSettings();
  return (
    // Single-screen landing: the page owns the viewport height and never
    // scrolls — every block is sized with fluid clamp() values instead.
    // 4rem is the fixed bottom-nav strip reserved by the root layout.
    <div className="h-[calc(100dvh-4rem)] overflow-hidden bg-background">
      <main className="mx-auto flex h-full w-full max-w-3xl flex-col justify-between gap-[clamp(0.5rem,2.2vh,1.25rem)] px-5 py-[clamp(0.75rem,2.5vh,1.5rem)]">
        {/* Combined logo lockup */}
        <header className="no-callout flex select-none items-center justify-center gap-3" dir="ltr">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-card">
            <img
              src={appLogoUrl}
              alt=""
              draggable={false}
              className="max-h-6 max-w-6 object-contain invert dark:invert-0"
              crossOrigin="anonymous"
            />
          </span>
          <span className="flex items-baseline gap-3 leading-none">
            <span className="text-lg font-semibold tracking-[0.28em] text-foreground sm:text-xl">
              ELQOR4N
            </span>
            <span
              className="warsh-text text-lg text-foreground sm:text-xl"
              dir="rtl"
              lang="ar"
              style={{ lineHeight: 1 }}
            >
              القرآن
            </span>
          </span>
        </header>

        {/* Hero */}
        <section className="space-y-2 text-center">
          <h1 className="text-[clamp(1.15rem,4.2vw,1.75rem)] font-semibold tracking-tight text-foreground">
            محتوى إسلامي جميل، بأبسط طريقة.
          </h1>
          <p className="mx-auto max-w-xl text-[clamp(0.72rem,2.6vw,0.85rem)] leading-relaxed text-muted-foreground">
            مبادرة غير ربحية لصنّاع المحتوى — منشورات القرآن والحديث والحصن والتغريدات
            والريلز وفيديوهات القرآن بجودة عالية وتناسق ثابت.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              to="/posts"
              className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:text-sm"
            >
              <Sparkles className="h-4 w-4" />
              ابدأ الإنشاء
            </Link>
            <Link
              to="/quran-video"
              className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted sm:text-sm"
            >
              استوديو الفيديوهات
            </Link>
          </div>
        </section>

        {/* Follow Us — icon-only horizontal row */}
        <section className="rounded-xl border border-border bg-card/70 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3" dir="rtl">
            <span className="shrink-0 text-xs font-semibold text-foreground">تابعنا</span>
            <ul className="flex items-center justify-end gap-2" dir="ltr">
              {SOCIALS.map(({ Icon, handle: h, href, badge }) => (
                <li key={`${href}-${h}`}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer external"
                    aria-label={h}
                    className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-background/70 text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    {badge && (
                      <span className="absolute -end-1.5 -top-1 grid h-4 w-4 place-items-center rounded-full border border-background bg-primary text-[9px] leading-none text-primary-foreground">
                        {badge}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Compact combined info card */}
        <section className="rounded-xl border border-border bg-card/50 p-3 sm:p-4">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <H2>
                <Heart className="me-1 inline h-3.5 w-3.5 text-primary" />
                مشروع خير
              </H2>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                مبادرة خيرية لخدمة المسلمين. المحتوى المُولَّد مباح للاستخدام والمشاركة.
              </p>
            </div>
            <div>
              <H2>المطوّر</H2>
              <p className="text-[11px] leading-relaxed">
                <strong>الطيّب بكوش</strong>
                <br />
                <a
                  href="https://github.com/tayebg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  dir="ltr"
                >
                  <Github className="h-3 w-3" /> @tayebg
                </a>
                <br />
                <a
                  href="https://www.linkedin.com/in/tayebbekkouche"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  dir="ltr"
                >
                  <Linkedin className="h-3 w-3" /> tayebbekkouche
                </a>
              </p>
            </div>
            <div>
              <H2>تواصل</H2>
              <p className="text-[11px] text-start">
                <a
                  href="mailto:elqor4n@gmail.com"
                  dir="ltr"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" /> elqor4n@gmail.com
                </a>
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground text-start" dir="rtl">اقتراحاتكم مرحّب بها.</p>
            </div>
          </div>
        </section>

        {/* Thanks */}
        <footer className="w-full min-w-0 space-y-1 text-center text-muted-foreground" dir="rtl">
          <div className="flex w-full min-w-0 flex-nowrap items-center justify-center gap-x-2 text-[10px] sm:gap-x-4 sm:text-[11px]">
            <span className="shrink-0 font-semibold text-foreground">شكر خاص</span>
            {[
              { handle: "@med_bentouati", href: "https://instagram.com/med_bentouati" },
              { handle: "@yacine_san8", href: "https://instagram.com/yacine_san8" },
            ].map(({ handle: h, href }) => (
              <a
                key={h}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline sm:gap-1.5"
              >
                <InstagramIcon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                <span>{h}</span>
              </a>
            ))}
          </div>
          <div dir="ltr" className="font-mono text-[10px] text-muted-foreground/70">
            © 2026
          </div>
        </footer>
      </main>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-tight text-foreground mb-1.5">
      {children}
    </h2>
  );
}
