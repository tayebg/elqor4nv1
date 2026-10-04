import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MOVE_THRESHOLD_PX = 10;

/**
 * Button wrapper for mobile action bars: a scroll gesture that passes over the
 * button must not synthesize a click. Keyboard and mouse clicks still work.
 */
export const SafeTapButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      onClick,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const startRef = React.useRef<{
      id: number;
      x: number;
      y: number;
      moved: boolean;
    } | null>(null);
    const suppressNextClick = React.useRef(false);

    const markMovement = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        const start = startRef.current;
        if (!start || start.id !== event.pointerId) return;
        const dx = Math.abs(event.clientX - start.x);
        const dy = Math.abs(event.clientY - start.y);
        if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
          start.moved = true;
          suppressNextClick.current = true;
        }
      },
      [],
    );

    return (
      <Button
        ref={ref}
        type={type}
        className={cn("[touch-action:manipulation]", className)}
        onPointerDown={(event) => {
          startRef.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            moved: false,
          };
          suppressNextClick.current = false;
          onPointerDown?.(event);
        }}
        onPointerMove={(event) => {
          markMovement(event);
          onPointerMove?.(event);
        }}
        onPointerUp={(event) => {
          markMovement(event);
          onPointerUp?.(event);
        }}
        onPointerCancel={(event) => {
          suppressNextClick.current = true;
          startRef.current = null;
          onPointerCancel?.(event);
        }}
        onClick={(event) => {
          const moved = Boolean(
            startRef.current?.moved || suppressNextClick.current,
          );
          startRef.current = null;
          suppressNextClick.current = false;
          if (moved) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClick?.(event);
        }}
        {...props}
      />
    );
  },
);

SafeTapButton.displayName = "SafeTapButton";
