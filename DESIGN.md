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

### CSS Class References (for `index.css` Tokens)

- `.font-display` — `font-family: var(--font-display)`
- `.font-sans` — `font-family: var(--font-sans)`
- Card styles apply the frosted glass pattern above
- `.pin-ring` — subtle pulse ring (`.pin-ring` from index.css) — static when `prefers-reduced-motion`
- `animate-fade-in` — used for entry animations (disabled under `prefers-reduced-motion`)