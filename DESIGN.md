# Design — "Evening Logbook"

A committed dark theme for lamp-lit review sessions. Calm, disciplined,
data-forward: a well-kept training logbook, not a productivity toy.
Register: product. Color strategy: restrained (olive accent ≤10% of surface).

## Theme

Dark only. `color-scheme: dark`. Near-black neutral base; surfaces step up
through faintly olive-tinted layers. The mood lives in the accent and the
typography, not in tinted backgrounds.

## Color (OKLCH, tokens in `src/app/globals.css` `@theme`)

| Token | Value | Role |
|---|---|---|
| `base` | `oklch(0.125 0 0)` | page background (pure neutral) |
| `surface` | `oklch(0.17 0.005 110)` | cards, inputs, emphasized containers |
| `raised` | `oklch(0.21 0.007 110)` | hover fills, empty heatmap cells, second layer |
| `line` / `line-strong` | `oklch(0.28/0.36 …)` | borders, dividers |
| `ink` | `oklch(0.93 0.012 110)` | primary text (≈14:1 on base) |
| `muted` | `oklch(0.68 0.018 110)` | secondary text, placeholders (≥4.5:1) |
| `faint` | `oklch(0.58 0.014 110)` | tertiary/data labels (≥4.5:1, use sparingly) |
| `olive` | `oklch(0.74 0.13 115)` | THE accent: primary buttons, progress, due-now, success |
| `on-olive` | `oklch(0.15 0.02 115)` | text on olive fills (Spotify-style dark-on-bright) |
| `terra` | `oklch(0.68 0.12 50)` | warm counterpoint: Medium difficulty, "struggled" |
| `danger` | `oklch(0.64 0.16 27)` | overdue, Hard difficulty, "failed" |
| `heat1–4` | olive ramp `L 0.32→0.74` | heatmap intensity (0 = `raised`) |

Semantic rule: outcome/difficulty color always accompanies a written word —
never color alone.

## Typography

- **Geist Sans** for everything; **Geist Mono** (`.data` class) for every
  number, date, and count that should align — tabular-nums, zero tracking.
- Fixed rem scale: `xs 0.75 / sm 0.875 / base 1 / 2xl 1.5` (titles
  `text-2xl font-semibold tracking-tight`). Body 1rem, line-height 1.6,
  letter-spacing 0.01em (light-on-dark compensation).

## Shape & depth

- Radius: `rounded-xl` (12px) containers, `rounded-lg` (8px) controls,
  `rounded-full` rail segments and markers.
- Depth via borders and surface steps, not shadows. No glassmorphism.

## Signature motif — the Today queue

The dashboard leads with a bounded queue (`TodayQueue.tsx`): new-problem
slot(s) first, then at most 2 review cards (plus a "Try the next one" button once they are done) on a `border-line-strong` surface,
then a quiet mono "+N more due". Grades always pair color with a word
(Clean olive, Shaky terra, Failed danger — `gradeClass` in `ui.ts`). The nav
wordmark keeps three pips (two filled olive, one hollow) as the brand mark.

## Component vocabulary (in `globals.css @layer components`)

`.btn-primary` (olive fill), `.btn-secondary` (bordered surface),
`.btn-ghost` (text), `.field` (inputs/selects/textareas), `.data`
(mono/tabular). Focus: global 2px olive `:focus-visible` outline.

## Motion

State-conveying only, 150–250ms ease-out (`transition-colors duration-150`).
Inline forms (log attempt) enter with a 200ms fade + 4px rise via
`starting:`. `prefers-reduced-motion`: all transitions collapse to instant.

## Charts

Plain HTML/CSS marks, no chart library. Difficulty uses dedicated **mark
tokens** (`easy-mark`/`medium-mark`/`hard-mark` — deeper steps of the text
hues, validated for the dark surface: lightness band, monotonic-L CVD
separation, ≥3:1 contrast). Identity is never color-alone: fixed
Easy→Medium→Hard order, 2px surface gaps between segments, dot+ink-text
legends with mono counts. Magnitude charts (week load, topic bars) are
single-hue (`heat3`), with today's bar in `olive`. Values/labels always wear
text tokens, never series colors. Tooltips via `title`.

## Voice

Terse, factual, evening-toned: "3 reviews due", "due tonight", "All clear
tonight", "Add to logbook". No exclamation marks, no gamified nagging.
