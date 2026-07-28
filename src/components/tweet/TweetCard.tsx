import { Verified } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { formatHandle } from "@/lib/settings";
import fajrLogoUrl from "@/assets/fajr-al-tilawa-logo.png";

export const TWEET_SIZE = 1080;

interface Props {
  id: string;
  text: string;
  displayName: string;
  handle: string;
  theme: "light" | "dim" | "dark";
  showTimestamp: boolean;
  avatarUrl: string;
  /**
   * In collaboration mode, which brand's identity powers this tweet.
   * "primary"   → your logo + your handle only.
   * "secondary" → second brand's logo + handle only.
   * Non-collab always renders the primary brand regardless of this prop.
   */
  collabBrand?: "primary" | "secondary";
}

const THEMES = {
  light: { bg: "#ffffff", ink: "#0f1419", sub: "#536471", border: "#eff3f4" },
  dim: { bg: "#15202b", ink: "#f7f9f9", sub: "#8b98a5", border: "#38444d" },
  dark: { bg: "#000000", ink: "#e7e9ea", sub: "#71767b", border: "#2f3336" },
} as const;

export function TweetCard({
  id, text, displayName, handle, theme, showTimestamp, avatarUrl, collabBrand = "primary",
}: Props) {
  const t = THEMES[theme];
  const collaboration = useSettings((s) => s.collaboration);
  const secondaryLogoUrl = useSettings((s) => s.secondaryLogoUrl);
  const secondaryUsername = useSettings((s) => s.secondaryUsername);
  const brandDisplay = useSettings((s) => s.brandDisplay);
  const secondaryDisplay = useSettings((s) => s.secondaryDisplay);

  // Collaboration now picks ONE brand instead of stacking both.
  const useSecondary = collaboration && collabBrand === "secondary";
  const shownAvatar = useSecondary ? (secondaryLogoUrl || fajrLogoUrl) : avatarUrl;
  const shownHandle = useSecondary
    ? formatHandle(secondaryUsername, "fajr_al_tilawa")
    : formatHandle(handle, "elqor4n");
  // Branding mode for the active brand: "logo" hides the @handle line,
  // "name" hides the avatar. The display name always stays.
  const display = useSecondary ? secondaryDisplay : brandDisplay;
  const showAvatar = display !== "name";
  const showHandle = display !== "logo";
  const timestamp = "١٠:٢٤ ص · " + new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  return (
    <div
      id={id}
      dir="rtl"
      style={{
        width: TWEET_SIZE,
        height: TWEET_SIZE,
        backgroundColor: t.bg,
        color: t.ink,
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        padding: 80,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%" }}>
        {/* Header — title on top, @handle directly underneath */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
          {showAvatar && <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 9999,
              overflow: "hidden",
              backgroundColor: theme === "light" ? "#f1f5f9" : "#1e293b",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // Subtle outline so light-on-white logos (Fajr) stay legible.
              boxShadow:
                theme === "light" && useSecondary
                  ? "inset 0 0 0 1px rgba(15,23,42,0.12), 0 1px 2px rgba(15,23,42,0.08)"
                  : undefined,
            }}
          >
            <img
              src={shownAvatar}
              crossOrigin="anonymous"
              alt=""
              style={{
                maxWidth: "80%",
                maxHeight: "80%",
                objectFit: "contain",
                filter: useSecondary
                  ? theme === "light"
                    ? "drop-shadow(0 1px 1px rgba(15,23,42,0.35)) drop-shadow(0 0 1px rgba(15,23,42,0.35))"
                    : undefined
                  : theme === "light"
                    ? "brightness(0)"
                    : "brightness(0) invert(1)",
              }}
            />
          </div>}
          {/* alignItems:flex-start keeps the @handle glued to the same
              (right, in RTL) edge as the display name above it. */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 42, fontWeight: 700, lineHeight: 1.15 }}>
              <span dir={useSecondary ? "rtl" : undefined} className={useSecondary ? "warsh-text" : undefined}>
                {displayName}
              </span>
              <Verified size={36} color="#1d9bf0" fill="#1d9bf0" style={{ color: "#fff" }} />
            </div>
            {showHandle && (
              <div dir="ltr" style={{ fontSize: 30, color: t.sub, marginTop: 6, unicodeBidi: "isolate" }}>
                {shownHandle}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div
          className="warsh-text"
          style={{
            fontSize: 62,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: t.ink,
          }}
        >
          {text}
        </div>

        {showTimestamp && (
          <div
            style={{
              marginTop: 60,
              paddingTop: 30,
              borderTop: `1px solid ${t.border}`,
              fontSize: 28,
              color: t.sub,
            }}
          >
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}
