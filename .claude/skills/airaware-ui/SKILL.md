# AirAware UI Design System Skill

## Purpose

This skill provides the Foggy Nature & Frosted Glass design system specifications for building AirAware UI components, pages, and interactions. It is invoked via `/graphify` or when the design system context is referenced.

## Color Tokens

| CSS Variable | Hex | Purpose |
|--------------|-----|---------|
| `--color-deep-pine` | `#1E2E24` | Primary pill buttons, active sidebar items, headings |
| `--color-deep-pine-soft` | `#2D3E33` | Elevated deep-pine surfaces |
| `--color-misty-alabaster` | `#F4F6F3` | Page canvas background |
| `--color-sage-border` | `#E6ECE7` | Subtle borders / dividers |
| `--color-warm-dawn` | `#C89666` | Accent — italic, focus rings |

## Typography

- **`--font-display`**: `Playfair Display, Georgia, "Times New Roman", serif` — used for headings and italic accent spans
- **`--font-sans`**: `Plus Jakarta Sans, system-ui, -apple-system, sans-serif` — body text, AQI figures (tabular-nums enabled)

Apply via:
```css
font-family: var(--font-display);   /* headings, italic accents */
font-family: var(--font-sans);     /* body, AQI numbers */
```

## Frosted Glass Card Class

```css
bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl
shadow-[0_8px_30px_rgb(30,46,36,0.06)]
```

Use: `className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-[0_8px_30px_rgb(30,46,36,0.06)]"`

## NAQI Semantic Colors (for AQI status pills and station indicators only)

| Hex | Category | AQI ≤ |
|-----|----------|-------|
| `#16a34a` | Good | 50 |
| `#ca8a04` | Satisfactory | 100 |
| `#ea580c` | Moderate | 200 |
| `#dc2626` | Poor | 300 |
| `#7c3aed` | Very Poor | 400 |
| `#7f1d1d` | Severe | — |

## Foggy Backdrop (public landing + Login/Signup split card)

- Apply `pointer-events-none` to fog/canopy overlays
- Guard animations with `prefers-reduced-motion: reduce { ... }`
- Mountain/canopy silhouette: Deep Pine base `#1E2E24` with Misty Alabaster `#F4F6F3` highlights
- Soft drifting cloud/fog overlay animations
- Keep overlay opacity below 0.4 for visual comfort

## Google Fonts Links (insert in `frontend/index.html` `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

## Key Design Rules

1. **Never mix** CPCB NAQI colors outside AQI status pills/station indicators
2. **Frosted glass** uses `bg-white/80 backdrop-blur-md` with `border-white/60` — test in both light and dark modes
3. **Red pinpoint** (`#DC2626`) is the sole marker color — no other marker colors appear
4. **Playfair Display** italic spans are the only display-typeface usage
5. **prefers-reduced-motion** disables all fog, pulse, and cloud animations