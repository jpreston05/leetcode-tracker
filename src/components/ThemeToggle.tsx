"use client";

import { useEffect, useSyncExternalStore } from "react";
import { applyTheme, currentTheme, THEME_KEY } from "@/lib/theme";

// The <html> class is the source of truth (set before paint by THEME_SCRIPT),
// so subscribe to it rather than mirroring it in React state.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export default function ThemeToggle() {
  // null on the server: render a neutral button until we know the theme
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);

  // Follow OS changes live until the user has made an explicit choice.
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const follow = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(THEME_KEY) === null) {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  const dark = theme === "dark";
  const showSun = theme === "light";
  const showMoon = theme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      onClick={() => applyTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted transition-[background-color,color,transform] duration-150 ease-strong hover:bg-raised hover:text-ink active:scale-[0.92]"
    >
      {/* sun and moon cross-fade + rotate, so the switch itself feels good */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`absolute h-[18px] w-[18px] transition-[opacity,transform] duration-250 ease-strong ${
          showSun ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" fill="var(--sun)" stroke="var(--sun-ink)" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`absolute h-[18px] w-[18px] transition-[opacity,transform] duration-250 ease-strong ${
          showMoon ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
        }`}
        fill="var(--grape)"
        stroke="var(--grape-ink)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
    </button>
  );
}
