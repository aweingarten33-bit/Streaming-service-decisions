# Design — Marquee

A locked design system for this app. Every screen redesign reads this file
before emitting code. Do not regenerate per screen — extend or amend this
file when the system needs to grow.

## Genre
playful (consumer, personal-use, casual — closest of the four to this app's actual voice)

## Macrostructure family
This is an app, not a marketing site — there is no page-level macrostructure
per screen. Every screen shares one component vocabulary instead:
- Cards: `rounded-2xl`/`rounded-3xl`, `border-rule`, `bg-ink/5` (or `bg-paper-2/80` for elevated/media cards)
- Primary action: flat `bg-gold text-gold-ink`, never a gradient
- Secondary actions: `border-rule bg-ink/5 text-ink-2`
- The one recurring structural signature: `.stencil-rule` (a dashed gold
  "cut here" line) marking a moment of commitment or transition — used
  once per screen, never decoratively repeated
- The one recurring atmosphere signature: `.spotlight-glow` (a soft radial
  gold bloom from above) behind the screen's single most important surface

## Theme
- `--paper` #040200 (near-black, warm-tinted stage)
- `--paper-2` #0b0602 (elevated surface)
- `--paper-3` #140e06 (highest elevation)
- `--ink` #f6f1eb (primary text, warm off-white)
- `--ink-2` #a9a49c (secondary text)
- `--rule` #2a2319 (dividers/borders)
- `--muted` #6e6860
- `--gold` #d19936 (the one accent — Oscar-statuette gold doing double duty as Banksy's single-color accent)
- `--gold-ink` #171008 (text on gold fill)
- `--focus-ring` #eba000

Design intent is OKLCH (paper `oklch(9% 0.015 75)`, gold `oklch(72% 0.13 78)`,
etc — full values in globals.css's stamp comment) but shipped as hex: this
app's existing film-grain overlay uses `mix-blend-mode: multiply`, which
renders oklch()-declared colors as solid black in real Chromium. Confirmed
by testing. Never revert to oklch() literals without re-testing against
the Grain overlay.

## Typography
- Display: Playfair Display, upright/roman only (never italic — gate 38a),
  weights 700/900 for real headline drama
- Body: Archivo, weights 400/500/600/700
- Mono: JetBrains Mono — small caps metadata rows, kickers, nav labels
- Display tracking: tight (`tracking-tight`)

## Spacing
Tailwind's default scale, used consistently: `px-5`/`px-6` screen gutters,
`gap-2`/`gap-3` for tight clusters, `mt-6`/`mt-8` for section breaks.

## Motion
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (already `--ease-out` equivalent, named `envelope-reveal`'s easing)
- Reveal: `.envelope-reveal` — opacity + translateY(16px), 0.7s, once per real reveal moment (a result, an import summary), never on every element
- Micro-interaction: `active:scale-[0.97]` press feedback on every primary/secondary button — the one Apple-precision tactile signature
- Reduced-motion: opacity-only fallback via `@media (prefers-reduced-motion: reduce)`

## Microinteractions stance
- Silent success over celebratory toasts (existing pattern: state changes, no toasts)
- Focus rings show instantly, never animated in
- Press feedback (`active:scale-[0.97]`) on every tappable primary/secondary button

## CTA voice
- Primary: flat `bg-gold text-gold-ink`, `rounded-xl`, `font-semibold`, always preceded by a `.stencil-rule` when it represents a commitment moment (the reveal's watch action, the emptyWatchlist/noMatch recovery actions)
- Secondary: `border-rule bg-ink/5 text-ink-2`, same `rounded-xl`

## What screens MUST share
- Every color as a named token (`bg-paper`, `text-ink`, `bg-gold`, etc.) — never inline hex/oklch in a component
- Playfair Display for every screen headline (`font-display`)
- The `.stencil-rule` motif used exactly once per screen, at its single most decisive moment
- `active:scale-[0.97]` on every primary/secondary button
- The bottom nav's active-tab color is always `text-gold`

## What screens MAY differ on
- Whether `.spotlight-glow` is used at all (only screens with a single hero
  reveal moment: Home's result, Onboarding's import summary)
- Card elevation tier (`bg-ink/5` vs `bg-paper-2/80`) based on whether the
  card carries media (posters/backdrops) or just text

## Exports

### tokens.css
```css
:root {
  --paper: #040200;
  --paper-2: #0b0602;
  --paper-3: #140e06;
  --ink: #f6f1eb;
  --ink-2: #a9a49c;
  --rule: #2a2319;
  --muted: #6e6860;
  --gold: #d19936;
  --gold-ink: #171008;
  --focus-ring: #eba000;

  --font-display: "Playfair Display", Georgia, serif;
  --font-sans: "Archivo", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-reveal: 700ms;
}
```
