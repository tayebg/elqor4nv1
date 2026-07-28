import { useSettings } from "@/lib/settings";
import { formatHandle } from "@/lib/settings";
import { useState, type CSSProperties } from "react";
import defaultLogoUrl from "@/assets/elqor4n-logo.png";
import fajrLogoUrl from "@/assets/fajr-al-tilawa-logo.png";

interface Props {
  /** Logo size in px (rendered at slide scale). */
  size?: number;
  /** Username font size in px. */
  fontSize?: number;
  /** Gap between logo and username. */
  gap?: number;
  /** Gap between the two brand blocks when collaboration is enabled. */
  crossGap?: number;
  /** Optional CSS filter to recolor the logo (e.g. "brightness(0) invert(1)"). */
  logoFilter?: string;
  /** Optional color for the × connector and username text. */
  color?: string;
  className?: string;
  style?: CSSProperties;
}

/** True when a stored URL points at a real logo (not empty / not stripped). */
function hasLogo(url: string | null | undefined): boolean {
  return !!(url && url.trim());
}
/** True when the user has entered a handle. */
function hasHandle(u: string | null | undefined): boolean {
  const s = (u ?? "").replace(/^@+/, "").replace(/@+$/, "").trim();
  return s.length > 0;
}

/**
 * Single source of truth for the footer handle line used by content slides.
 * Collaboration renders "@one × @two"; solo renders just "@one".
 */
export function useBrandHandles() {
  const username = useSettings((s) => s.username);
  const collaboration = useSettings((s) => s.collaboration);
  const secondaryUsername = useSettings((s) => s.secondaryUsername);
  const brandDisplay = useSettings((s) => s.brandDisplay);
  const secondaryDisplay = useSettings((s) => s.secondaryDisplay);
  const primary =
    brandDisplay !== "logo" && hasHandle(username) ? formatHandle(username, "@elqor4n") : "";
  const secondary =
    secondaryDisplay !== "logo" && hasHandle(secondaryUsername)
      ? formatHandle(secondaryUsername, "")
      : "";
  return {
    collaboration,
    primary,
    secondary,
    /** "@one × @two" when collaborating with both, otherwise "@one". */
    line: collaboration && secondary && primary ? `${primary} × ${secondary}` : primary || secondary,
  };
}

/** Logo <img> that falls back to the bundled mark if the stored URL fails. */
function BrandLogoImg({
  src,
  fallback,
  size,
  filter,
}: {
  src: string;
  fallback: string;
  size: number;
  filter?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = !src || failed ? fallback : src;
  return (
    <img
      src={resolved}
      alt=""
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
      style={{ height: size, width: size, objectFit: "contain", filter, flexShrink: 0 }}
    />
  );
}

/**
 * Shared brand renderer used by every generator (slides, covers, tweet card).
 * Automatically shows 1 or 2 logo+handle blocks based on the global
 * collaboration flag. Branding flexibility: if a block has NO handle,
 * only the logo renders; if it has NO logo, only the handle renders. The
 * invariant "both logo AND handle empty" is never allowed for the primary
 * block — it falls back to the default logo.
 *
 * Every brand block is forced dir="ltr" so `Logo + @Username` reads
 * left-to-right even inside an RTL page.
 */
export function BrandGroup({
  size = 120,
  fontSize = 40,
  gap = 14,
  crossGap = 40,
  logoFilter,
  color,
  className,
  style,
}: Props) {
  const {
    logoUrl,
    username,
    collaboration,
    secondaryLogoUrl,
    secondaryUsername,
    brandDisplay,
    secondaryDisplay,
  } = useSettings();

  const Brand = ({
    logo,
    fallback,
    name,
    showLogo,
    showName,
    filter,
  }: {
    logo: string;
    fallback: string;
    name: string;
    showLogo: boolean;
    showName: boolean;
    filter?: string;
  }) => (
    <div
      dir="ltr"
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        minWidth: 0,
        direction: "ltr",
      }}
    >
      {showLogo && <BrandLogoImg src={logo} fallback={fallback} size={size} filter={filter} />}
      {showName && (
        <span
          style={{
            fontSize,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color,
            whiteSpace: "nowrap",
            direction: "ltr",
            unicodeBidi: "isolate",
          }}
        >
          {name}
        </span>
      )}
    </div>
  );

  // Primary: at least one of logo/handle must render. If both empty, fall
  // back to the default logo (never render nothing).
  // `display` picks which elements the user wants; availability of the
  // actual value decides the rest. If the resulting pair would be empty,
  // the logo is force-rendered so a brand block is never blank.
  const resolve = (
    display: "both" | "logo" | "name",
    logoAvailable: boolean,
    handleAvailable: boolean,
  ) => {
    let showLogo = display !== "name" && logoAvailable;
    let showName = display !== "logo" && handleAvailable;
    if (!showLogo && !showName) showLogo = true;
    return { showLogo, showName };
  };

  const primary = resolve(brandDisplay, hasLogo(logoUrl), hasHandle(username));
  const secondary = resolve(
    secondaryDisplay,
    hasLogo(secondaryLogoUrl),
    hasHandle(secondaryUsername),
  );

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: crossGap,
        flexWrap: "nowrap",
        direction: "ltr",
        ...style,
      }}
    >
      <Brand
        logo={logoUrl}
        fallback={defaultLogoUrl}
        name={formatHandle(username, "@elqor4n")}
        showLogo={primary.showLogo}
        showName={primary.showName}
        filter={logoFilter}
      />
      {collaboration && (
        <>
          <span
            style={{
              fontSize: fontSize * 1.1,
              opacity: 0.55,
              color,
              lineHeight: 1,
            }}
          >
            ×
          </span>
          <Brand
            logo={secondaryLogoUrl}
            fallback={fajrLogoUrl}
            name={formatHandle(secondaryUsername, "@fajr_al_tilawa")}
            showLogo={secondary.showLogo}
            showName={secondary.showName}
            // Subtle drop-shadow keeps the light Fajr Al-Tilawa mark
            // legible on white/light post templates while staying
            // invisible on dark backgrounds.
            filter="drop-shadow(0 1px 1px rgba(0,0,0,0.28)) drop-shadow(0 0 1px rgba(0,0,0,0.22))"
          />
        </>
      )}
    </div>
  );
}
