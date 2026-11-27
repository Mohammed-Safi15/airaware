# AirAware Design System

## Foggy Nature & Frosted Glass Palette

### Colors

| Name | Value | Usage |
|------|-------|-------|
| **Deep Pine** | `#1E2E24` | Primary pill buttons, active sidebar items, headings |
| **Deep Pine Soft** | `#2D3E33` | Elevated deep-pine surfaces (active sidebar pill) |
| **Misty Alabaster** | `#F4F6F3` | Page canvas |
| **Sage Border** | `#E6ECE7` | Subtle borders / dividers on light surfaces |
| **Warm Dawn** | `#C89666` | Accent — brand italic, focus rings, small highlights |
| **Sky Soft** | `#D9EEF8` | Atmospheric sky wash, top of the workspace gradient |
| **Sky Accent** | `#0EA5E9` | Interactive sky accent (focus rings, hover glows, wind-stream traces) |
| **Canopy Mist** | `#E6F2EC` | Forest canopy mist, gradient base over alabaster |
| **Pine Mist** | `#9FB4A8` | Muted pine-grey for secondary text on deep-pine surfaces |

### NAQI Semantic Colors (reserved for AQI status pills and station indicators only)

| Category | AQI Range | Hex | Usage |
|----------|-----------|-----|-------|
| Good | ≤50 | `#16a34a` | Status pill background |
| Satisfactory | ≤100 | `#ca8a04` | Status pill background |
| Moderate | ≤200 | `#ea580c` | Status pill background |
| Poor | ≤300 | `#dc2626` | Status pill background |
| Very Poor | ≤400 | `#7c3aed` | Status pill background |
| Severe | — | `#7f1d1d` | Status pill background |

### Typography

| Token | Value |
|-------|-------|
| **Display Font** | `Playfair Display`, Georgia, "Times New Roman", serif |
| **Sans Font** | `Plus Jakarta Sans`, system-ui, -apple-system, sans-serif |
| **Display Style** | italic accent spans on headings |
| **AQI Figures** | `Plus Jakarta Sans` with `tabular-nums` |

### Frosted Glass Card

```css
bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl
shadow-[0_8px_30px_rgb(30,46,36,0.06)]
```

### Foggy Backdrop

Used on public landing page and split-card Login/Signup:

- `pointer-events-none` to keep interactivity on content underneath
- `prefers-reduced-motion` guard to disable fog/canopy animations when reduced motion is preferred
- Mountain/canopy silhouette with soft drifting cloud/fog overlay
- Deep Pine `#1E2E24` base, Misty Alabaster `#F4F6F3` highlights

### Google Fonts Links (add to `frontend/index.html`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

### Scientific Atmospheric Backdrop (`AtmosphericBackdrop.tsx`)

Fixed, strictly non-interactive layer behind the main workspace (Phase 6 prep):

- Entire subtree is `pointer-events-none` + `aria-hidden` — it never intercepts clicks
- Sky → alabaster → canopy-mist vertical gradient (`--color-sky-soft` → `--color-misty-alabaster` → `--color-canopy-mist`)
- SVG topographic contour lines (Sage Border) + dashed wind-stream traces (Sky Accent `#0EA5E9`, opacity ≤ 0.15)
- Particulate / altitude-scale tick column on the right edge (hidden on phones, `--color-pine-mist`)
- Two slow-drifting mist layers (`.mist-layer`, GPU transform-only, 46s+ alternate loops)
- `prefers-reduced-motion` disables drift + entrance animations; the backdrop stays visible but still

### Motion & Interaction Tokens (emil-design-eng)

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | Shared ease-out settle curve for entrances / unfolds |
| `.animate-card-rise` | `card-rise 0.45s var(--ease-soft) both` | GPU-composited (transform+opacity) staggered card entrances; per-item `animation-delay` 30–80ms steps |
| `.mist-layer` | `mist-drift 46s linear infinite alternate` | Slow drifting mist, transform-only |
| `.press-soft` | 240ms settle on transform/box-shadow/colors | Tactile press feedback; pair with `active:scale-[0.98]` |
| `.acc-drawer` | `grid-template-rows 0.32s var(--ease-soft)` | Accordion drawer unfold — `grid-rows-[0fr] ↔ grid-rows-[1fr]` so content glides without layout jumps; rotate the chevron 180° on the same settle curve |

All four are disabled or pinned-visible under `@media (prefers-reduced-motion: reduce)`.

### CSS Class References (for `index.css` Tokens)

- `.font-display` — `font-family: var(--font-display)`
- `.font-sans` — `font-family: var(--font-sans)`
- Card styles apply the frosted glass pattern above
- `.pin-ring` — subtle pulse ring (`.pin-ring` from index.css) — static when `prefers-reduced-motion`
- `animate-fade-in` — used for entry animations (disabled under `prefers-reduced-motion`)
- `.animate-card-rise`, `.mist-layer`, `.press-soft`, `.acc-drawer` — see Motion & Interaction Tokens above