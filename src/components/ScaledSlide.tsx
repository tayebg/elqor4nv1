import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Renders a fixed 1080×1080 slide scaled to fit its parent container width. */
export function ScaledSlide({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / 1080);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="w-full bg-card rounded-md shadow-lg overflow-hidden relative"
      style={{ aspectRatio: "1 / 1" }}
    >
      {scale > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: 1080,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

