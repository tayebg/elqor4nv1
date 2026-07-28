// Neutral runtime error logger. Kept as a named export for backward compatibility.
export function reportAppError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (typeof console !== "undefined") {
    // eslint-disable-next-line no-console
    console.error("[app-error]", error, context);
  }
}

export default reportAppError;
