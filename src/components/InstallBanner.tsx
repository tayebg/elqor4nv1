import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "elqor4n:install-dismissed-at";
const DISMISS_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Inline install banner.
 *
 * Rendered as a normal block at the top of the app shell (see __root.tsx),
 * NOT with fixed/absolute positioning — so it takes its own space in the
 * layout and pushes content down instead of covering it. Dismissing it
 * unmounts the block and the page moves up naturally.
 */
export function InstallBanner() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS
      window.navigator.standalone === true;
    if (standalone) return;

    const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissed && Date.now() - dismissed < DISMISS_MS) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt as EventListener);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !evt) return null;

  const install = async () => {
    try {
      await evt.prompt();
      await evt.userChoice;
    } finally {
      setVisible(false);
      setEvt(null);
    }
  };
  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="تثبيت التطبيق"
      dir="rtl"
      className="border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60"
    >
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background">
          <img
            src="/app-icon/app-icon-192.png"
            alt=""
            className="h-7 w-7 object-contain"
          />
        </span>
        <div className="min-w-0 flex-1 text-start">
          <p className="text-sm font-semibold leading-tight">ELQOR4N القرآن</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
            ثبّت التطبيق للوصول السريع والعمل بدون إنترنت.
          </p>
        </div>
        <button
          onClick={install}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <Download className="h-3.5 w-3.5" />
          تثبيت
        </button>
        <button
          onClick={dismiss}
          aria-label="إغلاق"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
