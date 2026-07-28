import type { ReactNode, CSSProperties } from "react";

interface Props {
  children: ReactNode;
  id?: string;
  style?: CSSProperties;
}

/** A 1080x1080 Instagram slide canvas. */
export function SlideFrame({ children, id, style }: Props) {
  return (
    <div id={id} className="slide-canvas" style={style}>
      {/* gold corner ornaments */}
      <div className="absolute inset-6 border border-[color:var(--gold)]/40 rounded-md pointer-events-none" />
      <div className="absolute inset-10 border border-[color:var(--emerald)]/15 rounded-sm pointer-events-none" />
      {children}
    </div>
  );
}
