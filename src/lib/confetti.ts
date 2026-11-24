// The palette fills as hex (canvas-confetti can't read CSS variables).
// Same in both themes: the fills are bright enough for light and dark.
const PALETTE = ["#2fd8d0", "#f9d544", "#62bbf5", "#b682ed", "#5ed99e", "#f97770"];

export type ConfettiSize = "small" | "big";

/** Fires confetti in the brand palette. A no-op under reduced motion. */
export async function fireConfetti(size: ConfettiSize = "small") {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti"); // only loads on a celebration
  const base = { colors: PALETTE, disableForReducedMotion: true, ticks: 220, scalar: 0.9 };

  if (size === "small") {
    confetti({ ...base, particleCount: 70, spread: 70, startVelocity: 38, origin: { y: 0.75 } });
    return;
  }
  // big: two side cannons, then a centre pop
  confetti({ ...base, particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.8 } });
  confetti({ ...base, particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.8 } });
  setTimeout(() => confetti({ ...base, particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.6 } }), 250);
}
