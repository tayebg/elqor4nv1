import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Mode = "light" | "dark";
const KEY = "elqor4n:theme";

function apply(mode: Mode) {
  const root = document.documentElement;
  const dark = mode === "dark";
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

function readStored(): Mode {
  const raw =
    (typeof localStorage !== "undefined" && localStorage.getItem(KEY)) || null;
  if (raw === "light" || raw === "dark") return raw;
  // Migrate legacy "system" (or first visit) → follow current OS preference once.
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

/** Mount once at app root — reads persisted mode. */
export function ThemeMount() {
  useEffect(() => {
    apply(readStored());
  }, []);
  return null;
}

/** Compact 2-state toggle used in the TopNav. */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("light");
  useEffect(() => setMode(readStored()), []);
  const toggle = () => {
    const next: Mode = mode === "light" ? "dark" : "light";
    localStorage.setItem(KEY, next);
    apply(next);
    setMode(next);
  };
  const Icon = mode === "light" ? Sun : Moon;
  return (
    <button
      onClick={toggle}
      aria-label={`Theme: ${mode}. Click to toggle.`}
      title={`Theme: ${mode}`}
      className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
