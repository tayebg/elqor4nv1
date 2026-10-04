import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ImagePlay, Video, Clapperboard, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = {
  to: "/" | "/posts" | "/videos" | "/reels" | "/settings";
  label: string;
  Icon: LucideIcon;
  match: (path: string) => boolean;
};

const POSTS_ROOTS = ["/posts", "/quran", "/nawawi", "/hisn", "/tweet"];
const isPostsPath = (p: string) =>
  POSTS_ROOTS.some((r) => p === r || p.startsWith(`${r}/`)) &&
  !p.startsWith("/quran-video");

const ITEMS: Item[] = [
  { to: "/", label: "الرئيسية", Icon: Home, match: (p) => p === "/" },
  { to: "/posts", label: "منشورات", Icon: ImagePlay, match: isPostsPath },
  {
    to: "/videos",
    label: "فيديوهات",
    Icon: Video,
    match: (p) => p === "/videos" || p.startsWith("/quran-video"),
  },
  {
    to: "/reels",
    label: "ريلز",
    Icon: Clapperboard,
    match: (p) =>
      p === "/reels" ||
      p.startsWith("/reels/") ||
      p.startsWith("/reels-") ||
      p.startsWith("/reel-cover"),
  },
  {
    to: "/settings",
    label: "الإعدادات",
    Icon: Settings,
    match: (p) => p === "/settings" || p.startsWith("/settings/"),
  },
];

/**
 * Mobile-app style bottom nav bar. Fixed to the viewport bottom,
 * respects iOS safe-area, and highlights the active tab.
 */
export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="no-callout fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="max-w-2xl mx-auto grid grid-cols-5">
        {ITEMS.map(({ to, label, Icon, match }) => {
          const active = match(path);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                draggable={false}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
