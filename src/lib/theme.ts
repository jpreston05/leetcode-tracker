export type Theme = "light" | "dark";

export const THEME_KEY = "theme";

/**
 * Runs inline in <head> before first paint: an explicit choice in
 * localStorage wins, otherwise follow the OS. Keep it tiny and ES5.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // private mode: the toggle still works for this visit
  }
}
