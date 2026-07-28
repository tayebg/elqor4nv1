import { useEffect, useState } from "react";
import { formatHijriLong } from "@/lib/hijri";

interface Props {
  /** Foreground color for the text and dividers. */
  color?: string;
  /** Accent color for the small dot separators. */
  accent?: string;
  fontSize?: number;
  className?: string;
}

/**
 * Small Hijri-date badge used on cover / first slides across every generator.
 * Renders nothing on the server (Intl month values differ) so slide capture is
 * deterministic once mounted client-side.
 */
export function HijriBadge({
  color = "currentColor",
  accent = "currentColor",
  fontSize = 30,
  className,
}: Props) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => { setLabel(formatHijriLong()); }, []);
  if (!label) return null;
  return (
    <div
      dir="rtl"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 18,
        color,
        fontSize,
        letterSpacing: "0.04em",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 9999, background: accent, opacity: 0.75 }} />
      <span className="warsh-text" style={{ fontSize: fontSize * 1.05 }}>{label}</span>
      <span style={{ width: 6, height: 6, borderRadius: 9999, background: accent, opacity: 0.75 }} />
    </div>
  );
}
