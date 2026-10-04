import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Maximum font-size in px (starting point). */
  max?: number;
  /** Minimum font-size in px. */
  min?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Dependency key — when it changes, refit. */
  deps?: unknown;
}

/**
 * Renders content and shrinks its font-size with binary search until the
 * inner element fits inside the parent's box (no overflow).
 */
export function AutoFitText({
  children,
  max = 64,
  min = 18,
  className,
  style,
  deps,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(max);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner) return;
    let lo = min;
    let hi = max;
    let best = min;
    // measure helper
    const fits = (px: number) => {
      inner.style.fontSize = `${px}px`;
      return (
        inner.scrollHeight <= box.clientHeight &&
        inner.scrollWidth <= box.clientWidth
      );
    };
    // binary search
    for (let i = 0; i < 18 && lo <= hi; i++) {
      const mid = Math.floor((lo + hi) / 2);
      if (fits(mid)) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    inner.style.fontSize = `${best}px`;
    setSize(best);
  }, [deps, max, min]);

  return (
    <div
      ref={boxRef}
      style={{ width: "100%", height: "100%", overflow: "hidden", ...style }}
      className={className}
    >
      <div ref={innerRef} style={{ fontSize: size }}>
        {children}
      </div>
    </div>
  );
}
