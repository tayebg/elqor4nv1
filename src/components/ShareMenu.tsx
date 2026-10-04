import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { Loader2, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { SafeTapButton } from "@/components/SafeTapButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SocialIcon } from "@/components/SocialIcons";
import {
  SHARE_PLATFORMS,
  shareFilesNow,
  shareToPlatform,
  resolveShareFiles,
  nativeFileShareSupported,
  type SharePayload,
  type ShareOutcome,
} from "@/lib/share";

interface Props extends SharePayload {
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
}

function report(outcome: ShareOutcome, platform?: string) {
  switch (outcome.kind) {
    case "shared":
      toast.success("تمت المشاركة", {
        description: platform ? `تم الإرسال إلى ${platform}.` : undefined,
      });
      break;
    case "cancelled":
    case "needs-gesture":
      break;
    case "link-opened":
      toast.success(`تم فتح ${platform ?? "التطبيق"}`, {
        description: "تم نسخ النص — الصقه في المنشور.",
      });
      break;
    case "downloaded-and-opened":
      toast.success("تم حفظ الملف", {
        description: platform
          ? `${platform} لا يقبل الرفع المباشر من المتصفح — أرفق الملف المحفوظ (تم نسخ النص).`
          : "أرفقه من قائمة التنزيلات.",
      });
      break;
    case "error":
      toast.error("فشلت المشاركة", { description: outcome.message });
      break;
  }
}

/**
 * Shared "Share" control used by every generator.
 *
 * GESTURE SAFETY — the Web Share API requires `navigator.share` to run inside
 * the user's tap. Generating the media (canvas → blob, video export) is async
 * and destroys that activation, which is what produced
 * "Must be handling a user gesture to perform a share request".
 *
 * Fix: the files are PRE-WARMED before the tap completes (mouse pointerdown /
 * focus / hover). By the time `onClick` runs they are usually
 * ready, so `shareFilesNow` calls `navigator.share` synchronously. If they are
 * not ready yet, we finish preparing and then ask the user for one fresh tap
 * via a toast action — never a silent failure.
 */
export function ShareMenu({
  getFile,
  getFiles,
  title,
  text,
  label = "مشاركة",
  variant = "outline",
  size = "default",
  className,
  disabled,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const native = nativeFileShareSupported();
  // Coarse pointer = mobile/tablet. On these devices, tapping "Share" should
  // open the OS share sheet directly instead of a dropdown of web fallbacks.
  const isTouch =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const useNativeDirect = native && isTouch;

  const payloadRef = useRef<SharePayload>({ getFile, getFiles, title, text });
  payloadRef.current = { getFile, getFiles, title, text };

  /** Files resolved ahead of the tap, plus the in-flight preparation promise. */
  const readyFiles = useRef<File[] | null>(null);
  const pending = useRef<Promise<File[]> | null>(null);
  const [preparing, setPreparing] = useState(false);
  const preparingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Safety net: no matter what happens, the spinner MUST stop.
  // If media preparation stalls for more than 20s (e.g. a slow ffmpeg export
  // that never resolves), we release the busy state and show an error so the
  // user can retry instead of staring at an endless loader.
  const releasePreparing = useCallback(() => {
    setPreparing(false);
    if (preparingTimer.current) {
      clearTimeout(preparingTimer.current);
      preparingTimer.current = null;
    }
  }, []);

  useEffect(() => () => releasePreparing(), [releasePreparing]);

  // Any change to the payload invalidates the pre-warmed media.
  useEffect(() => {
    readyFiles.current = null;
    pending.current = null;
  }, [getFile, getFiles, title, text]);

  /** Start (or reuse) media preparation. Safe to call on every pointer event. */
  const prewarm = useCallback(() => {
    if (readyFiles.current || pending.current || disabled)
      return pending.current;
    setPreparing(true);
    preparingTimer.current = setTimeout(() => {
      setPreparing(false);
      pending.current = null;
      toast.error("تعذّر تحضير الملف", {
        description: "المحاولة استغرقت وقتًا طويلًا. حاول مجددًا.",
      });
    }, 20_000);
    const p = resolveShareFiles(payloadRef.current)
      .then((files) => {
        readyFiles.current = files;
        return files;
      })
      .catch(() => {
        pending.current = null;
        return [] as File[];
      })
      .finally(releasePreparing);
    pending.current = p;
    return p;
  }, [disabled, releasePreparing]);

  const prewarmProps = {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse") void prewarm();
    },
    onMouseEnter: () => void prewarm(),
    onFocus: () => void prewarm(),
  };

  /** Ask for one more tap once the media finished preparing. */
  const askForTap = (run: () => void) => {
    toast("الوسائط جاهزة", {
      description: "اضغط للمشاركة الآن.",
      action: { label: "مشاركة", onClick: run },
      duration: 15000,
    });
  };

  /** Native sheet — called straight from the click handler (no await before). */
  const handleNativeClick = () => {
    const files = readyFiles.current;
    const { title: t, text: x } = payloadRef.current;
    if (files) {
      void shareFilesNow(files, t, x).then((o) => {
        if (o.kind === "needs-gesture") askForTap(handleNativeClick);
        else report(o);
      });
      return;
    }
    // Not warm yet: finish preparing, then request a fresh gesture.
    setBusy("native");
    void (pending.current ?? prewarm() ?? resolveShareFiles(payloadRef.current))
      .then((f) => {
        readyFiles.current = f;
        askForTap(handleNativeClick);
      })
      .catch((err: unknown) =>
        report({
          kind: "error",
          message: err instanceof Error ? err.message : "Sharing failed",
        }),
      )
      .finally(() => setBusy(null));
  };

  const handlePlatform = (platformId: string) => {
    const platform = SHARE_PLATFORMS.find((p) => p.id === platformId);
    if (!platform) return;
    const files = readyFiles.current;
    if (files) {
      void shareToPlatform(platform, payloadRef.current, files).then((o) => {
        if (o.kind === "needs-gesture")
          askForTap(() => handlePlatform(platformId));
        else report(o, platform.label);
      });
      return;
    }
    setBusy(platform.id);
    void (pending.current ?? prewarm() ?? resolveShareFiles(payloadRef.current))
      .then((f) => {
        readyFiles.current = f;
        return shareToPlatform(platform, payloadRef.current, f);
      })
      .then((o) => {
        if (o.kind === "needs-gesture")
          askForTap(() => handlePlatform(platformId));
        else report(o, platform.label);
      })
      .finally(() => setBusy(null));
  };

  const spinning = !!busy || preparing;

  if (useNativeDirect) {
    return (
      <SafeTapButton
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        {...prewarmProps}
        onClick={handleNativeClick}
      >
        {spinning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {size !== "icon" && <span>{label}</span>}
      </SafeTapButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SafeTapButton
          variant={variant}
          size={size}
          className={className}
          disabled={disabled}
          {...prewarmProps}
        >
          {spinning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {size !== "icon" && <span>{label}</span>}
        </SafeTapButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between gap-2 text-xs">
          <span>مشاركة إلى</span>
          {native && (
            <span className="inline-flex items-center gap-1 text-[10px] font-normal text-primary">
              <Check className="h-3 w-3" />
              أصلي
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SHARE_PLATFORMS.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse") void prewarm();
            }}
            onSelect={(e) => {
              e.preventDefault();
              handlePlatform(p.id);
            }}
            className="gap-2.5"
          >
            <SocialIcon
              name={p.id}
              className="h-4 w-4 shrink-0 text-muted-foreground"
            />
            <span className="flex-1">{p.label}</span>
            {busy === p.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
