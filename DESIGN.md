# Design — "Bright Logbook"

Fresh, playful, encouraging: a tracker you want to open. Register: product.
Color strategy: **full palette** — seven named roles, each with one job.
Light and dark themes, both first-class.

## Theme

`.dark` class on `<html>`, set before first paint by `THEME_SCRIPT`
(`src/lib/theme.ts`, inlined in `layout.tsx`): an explicit choice in
`localStorage.theme` wins, otherwise the OS preference. `ThemeToggle` (nav)
flips and persists it, and follows live OS changes until the user chooses.
Tailwind's `dark:` variant is wired to the class (`@custom-variant dark`).

- **Light:** near-white canvas with a breath of teal (`oklch(0.982 0.006 200)`),
  white cards with a soft coloured shadow. Never cream/beige.
- **Dark:** deep ink-navy (`oklch(0.2 0.03 250)`), so the colours glow rather
  than sit on a void. Never near-black.

## Color (OKLCH, `src/app/globals.css`)

Raw values live in `:root` / `:root.dark` as plain CSS variables; `@theme
inline` maps them to Tailwind colours, so `bg-sky-soft`, `text-grape-ink`,
`bg-coral/10` etc. all switch with the theme.

Neutrals: `canvas` (page), `surface` (cards, inputs), `raised` (hover,
empty tracks), `line` / `line-strong`, `ink` / `muted` / `faint` (text),
`on-fill` (dark text on any bright fill). Don't name a token `base`: it
collides with Tailwind's `text-base` size.

| Role | Hue | Job |
|---|---|---|
| `brand` (lagoon) | 190 | primary buttons, links, focus, active nav |
| `sun` | 95 | new problems |
| `sky` | 240 | reviews, due badges |
| `grape` | 305 | retired, milestones |
| `mint` | 160 | Clean grade, Easy, success |
| `amber` | 62 | Shaky grade, Medium, streak chip |
| `coral` | 25 | Failed grade, Hard, overdue, errors (`danger`) |

Each role has four steps:

- `<role>` — **fill**: solid chips/buttons/dots, always with `text-on-fill`.
- `<role>-ink` — **text** on canvas/surface/raised/its soft (≥4.5:1, both themes).
- `<role>-soft` — **tint** for chips and tinted cards.
- `<role>-mark` — **chart/progress marks** (≥3:1 vs surface). In light theme
  these are deeper than the fills (pastel fills fail 3:1 on white); in dark
  they equal the fills. Difficulty marks alias: `easy/medium/hard-mark`.

`heat1–4`: lagoon ramp for the heatmap and topic bars.
Rule: colour never stands alone — a word, ✓ or label always accompanies it.
Re-verify contrast after any token change (both themes).

## Typography

- **Figtree** (`--font-figtree`) for all UI: friendly rounded terminals.
  Headings `font-extrabold tracking-tight` (page h1 `text-3xl`, dashboard
  greeting up to `text-4xl`); section titles `font-bold`; labels
  `font-semibold`.
- **Geist Mono** (`.data`) for every number, date and count that should
  align — tabular-nums.

## Shape & depth

- Radius: `rounded-3xl` hero/quote panels, `rounded-2xl` cards (`.card`),
  `rounded-xl` inputs, `rounded-full` buttons, chips, bars.
- Depth: `shadow-soft` on cards and buttons, `shadow-lift` on hover and
  toasts (shadow colour is tinted per theme). No glassmorphism, except the
  sticky nav's light backdrop blur.
- Palette shapes (sun circle, sky pill, grape rounded square) are the
  decorative language: brand mark, quote card, portfolio hero, empty
  scenes, milestone card. Abstract shapes only — no stock illustration.

## Signature — the Today queue

Dashboard order: greeting + streak chip → quote card (brand-soft, palette
shapes) → **day plan bar** (chunky segments: sun per new slot, sky per
review, filled as done) → Today queue (sun-tinted "Solve something new"
slots, review cards with a sky "today" / coral "late" chip, "Try the next
one →" after the 2 reviews, and "+ Log a different review" — a search
picker for reviewing any problem off-list, which counts toward the day) → The 150 (stacked grape/sky bar) + this week's
load → stats → activity.

## Celebrations (`CelebrationProvider` in the root layout)

| Moment | Trigger | Reward |
|---|---|---|
| Day plan complete | `DayProgressBar`, once per day (`localStorage`) | small confetti + 🎉 toast |
| Problem retired | `LogAttemptForm` when the new attempt retires it | big confetti + 🎓 stamp toast |
| Milestone (10, 25, 50, 75, 100, 125, 150 solved) | `MilestoneWatcher`, once each | big confetti + milestone `<dialog>` |
| Clean grade | selecting Clean | sparkle ring on the button |
| Streak | dashboard header | 🔥 chip; broken = "Start a new streak today" |

Confetti (`canvas-confetti`, lazy-loaded, palette hex in `src/lib/confetti.ts`)
is skipped under `prefers-reduced-motion`; the toast/dialog still shows.

## Component vocabulary (`globals.css @layer components`)

`.btn-primary` (lagoon fill pill), `.btn-secondary` (surface pill),
`.btn-ghost`, `.field`, `.card`, `.chip` (+ `-soft` bg / `-ink` text; see
`difficultyChip`, `gradeChip`, `statusChip` in `src/lib/ui.ts`), `.data`.
Focus: global 2px `brand-ink` outline.

## Motion

150–250ms, `--ease-strong`. State changes (fills, hovers, theme toggle
sun↔moon rotate) plus the celebration set: `animate-toast-in`,
`animate-stamp`, `animate-sparkle`. Hover lift on new-problem slots
(`-translate-y-0.5` + `shadow-lift`). No page-load choreography.
`prefers-reduced-motion`: everything collapses to instant.

## Charts

Plain HTML/CSS, no chart library. Marks use `*-mark` tokens (≥3:1 per
theme). Identity never colour-alone: fixed Easy→Medium→Hard order, gaps
between segments, dot + word legends with mono counts. Week load is
single-hue sky; topic bars and heatmap use the lagoon ramp. Tooltips via
`title`.

## Voice

Warm, encouraging, short. "Good evening, Jack", "Solve something new",
"Reviews done. Lovely work.", "That's the day done!". Exclamation marks are
for celebrations only. Never guilt: overdue says "3d late", not "overdue!";
a lost streak says "Start a new streak today".
