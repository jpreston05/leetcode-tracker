# Product

## Register

product

## Users

One user: a software engineering student working through the NeetCode/LeetCode 150 for big-tech/quant interviews. Contexts: **evening desk sessions** (focused review blocks) and **quick phone check-ins** during the day. The job: "tell me what to do today, let me log it in seconds, and make me *want* to come back tomorrow."

## Product Purpose

A private spaced-repetition tracker for solved LeetCode problems. Each problem gets an adaptive review interval: clean timed re-solves stretch it (×3 the actual gap), shaky ones repeat it, failures reset it, and a clean re-solve after 3+ weeks retires the problem. The app answers one question instantly — *what do I do today?* — with a small, bounded queue (1–2 new problems, 2 reviews, more on request), and makes progress visible and rewarding (day plan, X/150, streaks, celebrations). It is also a portfolio piece: the craft of the UI is part of the point.

## Brand Personality

**Fresh, playful, encouraging.** Something the owner *wants* to look at every day. Colour does real work — each hue has one job (sun = new, sky = review, grape = retired, lagoon = act) — and finishing things is rewarded. Friendly rounded shapes and type; still a precise tool underneath (numbers line up, states are clear).

## Anti-references

- **LeetCode itself** — busy, orange, ad-adjacent density. This is the antidote, not a companion skin.
- **Generic dev-tool dark mode** — near-black + one neon accent. Both themes here are colourful and warm-hearted.
- **Guilt mechanics** — celebrations reward, they never punish. A broken streak just says "start a new one"; overdue work rolls forward quietly.
- **GitHub clone** — the heatmap is contribution-graph-shaped, but it wears our palette.

## Design Principles

1. **Colour with a job.** Every hue means one thing everywhere: sun = new, sky = review, grape = retired, mint/amber/coral = Clean/Shaky/Failed, lagoon = primary action. Never colour alone — a word always rides along.
2. **Celebrate finishing.** Day plan done, a problem retired, a milestone reached: each gets a moment (confetti, toast, milestone card). Small wins are visible (✓ fills, sparkle on Clean).
3. **One glance, one answer.** Every screen leads with "what should I do right now?" The Today queue comes first, everything else second.
4. **Light or dark, both first-class.** Follows the OS until toggled; neither theme is an afterthought.
5. **Earned familiarity.** Standard affordances, one component vocabulary, no invented controls. Playful in colour and moments, not in mechanics.

## Accessibility & Inclusion

WCAG AA in both themes: text ≥ 4.5:1, chart/progress marks ≥ 3:1 (validated per theme). States never rely on colour alone. Visible focus rings on every control. `prefers-reduced-motion`: confetti is skipped and all motion collapses to instant; celebrations still show as plain toasts. Touch targets ≥ 44px on the phone path.
