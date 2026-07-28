import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { formatHandle } from "@/lib/settings";
import appLogoUrl from "@/assets/elqor4n-logo.png";
import type { ReactNode } from "react";

export type Crumb = { label: string; to?: string };

interface Props {
  /** Kept for API compatibility. */
  crumbs?: Crumb[];
  subtitleAr?: string;
  subtitle?: string;
  /** Optional explicit override — otherwise hierarchical parent is used. */
  backTo?: string;
  actions?: ReactNode;
  hideAdmin?: boolean;
}

/**
 * Map every route to its logical parent so back navigation always follows
 * the app's hierarchy (Home → Posts → Ahzab → Back → Posts → Back → Home)
 * regardless of what the user visited earlier in the browser history.
 */
function getParentPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "/";
  // Posts family
  if (["/quran", "/nawawi", "/hisn", "/tweet"].some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "/posts";
  }
  if (pathname === "/posts") return "/";
  // Reels family
  if (pathname === "/reels-watermark" || pathname === "/reel-cover" || pathname.startsWith("/reels/")) {
    return "/reels";
  }
  if (pathname === "/reels") return "/";
  // Videos
  if (pathname === "/quran-video" || pathname.startsWith("/quran-video/")) return "/";
  if (pathname === "/videos") return "/";
  // Settings tree
  if (pathname.startsWith("/settings/")) return "/settings";
  if (pathname === "/settings") return "/";
  return "/";
}

export function TopNav({ backTo, actions }: Props) {
  const { username } = useSettings();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const handle = formatHandle(username, "@elqor4n");

  const goBack = () => {
    const target = backTo ?? getParentPath(pathname);
    router.navigate({ to: target });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        {/* Brand lockup — ELQOR4N + Arabic القرآن, same size, baseline aligned */}
        <Link to="/" aria-label="ELQOR4N القرآن" title={handle} className="flex items-center gap-2 min-w-0" dir="ltr">
          <span className="h-8 w-8 rounded-md bg-card border border-border grid place-items-center overflow-hidden shrink-0">
            <img
              src={appLogoUrl}
              alt=""
              className="max-h-5 max-w-5 object-contain invert dark:invert-0"
              crossOrigin="anonymous"
            />
          </span>
          <span className="flex items-baseline gap-2 min-w-0 leading-none">
            <span className="font-semibold tracking-[0.22em] text-sm sm:text-base text-foreground">
              ELQOR4N
            </span>
            <span
              className="warsh-text text-sm sm:text-base text-foreground"
              dir="rtl"
              lang="ar"
              style={{ lineHeight: 1 }}
            >
              القرآن
            </span>
          </span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-1 shrink-0">
          {actions}
          <button
            onClick={goBack}
            aria-label="رجوع"
            title="رجوع"
            className="h-9 w-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {/* RTL: back visually points right */}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
