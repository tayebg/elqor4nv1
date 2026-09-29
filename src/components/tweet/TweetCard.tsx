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
  textZoom?: number;
  imageUrl?: string | null;
}

const THEMES = {
  light: { bg: "#ffffff", ink: "#0f1419", sub: "#536471", border: "#eff3f4" },
  dim: { bg: "#15202b", ink: "#f7f9f9", sub: "#8b98a5", border: "#38444d" },
  dark: { bg: "#000000", ink: "#e7e9ea", sub: "#71767b", border: "#2f3336" },
} as const;

export function TweetCard({
  id, text, displayName, handle, theme, showTimestamp, avatarUrl, collabBrand = "primary",
  textZoom = 100, imageUrl,
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
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
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
              <VerifiedBadge size={40} />
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
            fontSize: Math.round(62 * (textZoom ?? 100) / 100),
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: t.ink,
          }}
        >
          {text}
        </div>

        {imageUrl && (
          <div style={{
            marginTop: 30,
            borderRadius: 24,
            overflow: 'hidden',
            border: `1px solid ${t.border}`,
            maxHeight: 500,
          }}>
            <img
              src={imageUrl}
              crossOrigin="anonymous"
              alt=""
              style={{
                width: '100%',
                maxHeight: 500,
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        )}

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

/**
 * Twitter/X verified badge — scalloped blue burst with white check.
 * The exact path used by X's public brand assets, so it reads as a real
 * verified mark instead of the generic lucide checkmark.
 */
function VerifiedBadge({ size = 40 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 22 22"
      width={size}
      height={size}
      aria-label="Verified"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        fill="#1d9bf0"
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.245.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      />
    </svg>
  );
}

