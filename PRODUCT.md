# Product

## Register

product

## Users

One user: a software engineering student grinding LeetCode for big-tech/quant interviews. Primary context is **evening desk sessions** — post-uni, lamp light, deep-focus review blocks. Secondary: quick phone check-ins. The job: "tell me what to re-solve tonight, let me log it in seconds, show me my consistency."

## Product Purpose

A private spaced-repetition tracker for solved LeetCode problems. Each problem gets an adaptive review interval: clean timed re-solves stretch it (×3 the actual gap), shaky ones repeat it, failures reset it, and a clean re-solve after 3+ weeks retires the problem. The app's whole value is answering one question instantly — *what do I do today?* — with a small, bounded queue (1–2 new problems, 2 reviews, more on request), and making long-term consistency visible (queue, progress, activity heatmap). It is also a portfolio piece: the craft of the UI is part of the point.

## Brand Personality

**Calm, disciplined, data-forward.** A well-kept training logbook, not a productivity toy. Things 3's serenity (generous space, rounded edges, one confident accent) crossed with a runner's log (tabular numbers, dates that line up, the data *is* the interface). Quietly athletic; never loud.

## Anti-references

- **LeetCode itself** — busy, orange, ad-adjacent density. This is the antidote, not a companion skin.
- **GitHub clone** — the heatmap is contribution-graph-shaped by spec, but it takes our palette and voice; the rest of the app must not read as a GitHub skin.
- Gamified streak apps — no mascots, confetti, badges, or guilt mechanics. The streak is a fact, not a nag.

## Design Principles

1. **The data is the interface.** Numbers, dates, and progress carry the screens; chrome recedes. Tabular figures everywhere data aligns.
2. **Evening-calm.** A committed dark theme built for lamp-lit rooms — low-glare surfaces, soft contrast steps, nothing fluorescent.
3. **One glance, one answer.** Every screen leads with "what should I do right now?" Due-work first, everything else second.
4. **Progress you can feel.** The Today queue, X/150 progress, and heatmap make consistency tangible — earned, factual, never gamified.
5. **Earned familiarity.** Standard affordances, consistent component vocabulary, no invented controls. The tool disappears into the task.

## Accessibility & Inclusion

WCAG AA: body text ≥ 4.5:1 on the dark surfaces, interactive states distinguishable without color alone (icons/labels accompany outcome colors). Visible focus rings on every control. `prefers-reduced-motion` honored on all animation. Touch targets ≥ 44px for the phone check-in path.
