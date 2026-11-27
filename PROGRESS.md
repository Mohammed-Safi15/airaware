# AirAware - Progress Tracker

- [x] **Save Location modal focus fix** (`frontend/src/pages/Dashboard.tsx`): hoisted the `Field` form-label helper from inside the `Dashboard` component body to module scope — the nested definition gave it a new identity on every re-render, so each keystroke in the Location Name input remounted the modal subtree and dropped focus. Verified: `npm run build` zero errors; committed at `9e03390`

### Phase 5 Completed – Hybrid Rule + Workers AI Advice Engine, AQI Awareness Guide

**Current Phase**: Ask AirAware chat feature complete – `POST /api/chat` Worker endpoint (deterministic-first + Workers AI overlay with scope guardrails), new `AskAirAware.tsx` page as 7th `/ask` sidebar route (glass-panel, Playfair heading, 4 starter cards, session-only bubbles, loading dots, clear chat, responsive input), "Have a question? Ask AirAware →" CTA in Routines advice card; `npx tsc --noEmit` (worker) + `npm run build` (frontend) zero errors; committed
**Historic Note**: Phase 5A/B (advice endpoint + Awareness page) verified at commit `4a05ce8`. Phase 5C adds the History & My Impact Calculator page (exposure check history + protective-action impact log). The frosted-glass + botanical upgrade pass (`.glass-panel`, split-hero Home, paper-cut Login) was committed at `c5130e2`.

---

## Botanical Foliage + One-Screen Home Pass (complete)

- [x] **FoggyBackdrop filled foliage** (`frontend/src/components/FoggyBackdrop.tsx`): replaced all blunt round-stroked fronds with closed filled lens-leaf silhouettes — `TaperedLeaf` primitive (two quadratic curves tapering to fine points), `PalmFrond` (filled rachis + 9 shrinking leaflet pairs), `Fern` (Bézier-seated pinnae via `qPoint` on an arched stem), `CanopyBranch` (filled limb + 7 tapered blades); sky glows, sculpted paper-cut wave layers and mist preserved
- [x] **Tip visibility**: ferns re-seated so full tapered tips sit inside the `viewBox` (previously their tips fell below the canvas at `xMidYMax slice`); top-corner canopy branches nudged down into frame so blades stay visible at 1280×720
- [x] **Home one-screen fit** (`frontend/src/pages/Home.tsx`): root `lg:h-dvh lg:min-h-dvh lg:flex lg:flex-col lg:justify-between lg:overflow-hidden` — brand bar + split hero + 3 compact feature cards + footer fit a single desktop viewport (1280×720–1440×900) with no scroll, still stacks at 360px; tightened header/hero/section/footer spacing
- [x] **`.card-lift` hover animation** (`frontend/src/index.css`): GPU-composited lift (independent `translate`/`scale` properties + shadow, 0.3s `--ease-soft`) applied to the 3 hero preview cards and the 3 "Why AirAware" cards; fine-pointer hover gate (`hover:hover` + `pointer:fine`), strictly off under `prefers-reduced-motion`; unlayered after `.glass-panel` so the hover shadow wins
- [x] **Home footer pill**: bottom "Data: CPCB · OpenAQ · Open-Meteo — built for India's air, for everyone's lungs." line wrapped in a frosted pill (`bg-white/75 backdrop-blur-md px-4 py-1.5 rounded-full text-[#1E2E24] font-medium shadow-sm`) so it never blends into the dark green waves; redundant © line dropped
- [x] **Login cleanup** (`frontend/src/pages/Login.tsx`): removed the faint `FrondSilhouette` overlay (full botanical backdrop already lives in FoggyBackdrop behind the card); feature bullets now `text-[14.5px] leading-relaxed text-[#F2F7F4]` with clean spacing; bottom caption became a crisp frosted pill, redundant low-contrast page footer removed
- [x] `npm run build` in `frontend/` passes with zero TypeScript errors (1656 modules, ~3.7s; only the pre-existing >500kB chunk-size warning)
- [x] Committed (was left uncommitted in the tree; the "Home Polish Pass" commit below folds in these FoggyBackdrop/Home/Login/index.css changes)

---

## Home Polish Pass – 5 Task Fixes (complete)

- [x] **Task 1 – Un-clip frond tips** (`frontend/src/components/FoggyBackdrop.tsx`): botanical `<svg>` viewBox widened to `-160 0 1760 560` + `overflow="visible"` so left palm-frond blades complete to pointed tips instead of hitting the viewBox edge; far/mid canopy + near wave silhouette paths and the ground-mist rect extended across the widened span (`-160 → 1600`) so no edge gaps; left `FrondCluster` nudged inward (`x -40 → -24`); outer wrapper `overflow-hidden` kept
- [ ] **Task 2 – Stop clipping bottom cards/footer** (`frontend/src/pages/Home.tsx`): root is now `flex min-h-dvh flex-col justify-between` — dropped `lg:overflow-hidden` and the rigid `lg:h-dvh lg:min-h-dvh` height lock; all 3 "Why AirAware" cards (full size/padding kept) + footer now render 100% visible
- [x] **Task 3 – "Why AirAware" contrast** (`frontend/src/pages/Home.tsx`): heading restyled as a high-contrast frosted pill — `inline-flex items-center px-3.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-white/90 text-[#1E2E24] font-semibold shadow-sm`
- [x] **Task 4 – `float-slow` ambient levitation** (`frontend/src/index.css` + `Home.tsx`): `@keyframes float-slow` (translate3d-only drift: `(0,0,0) → (4px,-7px,0) → (-3px,-3px,0)`, 7s ease-in-out infinite alternate) defined strictly inside `@media (prefers-reduced-motion: no-preference)`; applied to the 3 hero `<article>` cards with staggered `animation-delay` 0s / 1.2s / 2.4s; composes cleanly with `.card-lift` (independent `translate`/`scale` hover properties) and `.animate-card-rise` (wrapper div)
- [x] **Task 5 – Verify & commit**: `npm run build` in `frontend/` passes with zero TypeScript errors (1656 modules; only the pre-existing >500kB chunk warning)
- [x] Committed

---

## Phase 5 Exit Gate – Verification

All checklist items verified:
- [x] `POST /api/advice` Worker endpoint with deterministic CPCB rules + Workers AI hybrid
- [x] Advice card in Routines.tsx calling `/api/advice` with full spec (display recommendations with icons/badges by tip kind, source "AI + Rules" or "Rules Fallback", loading skeleton, error handling)
- [x] Awareness.tsx finalized (one import fix – removed invalid `Child` lucide export)
- [x] `npm run build` passes zero TS errors across all modules
- [x] Git commit Phase 5B applied
- [x] Routines advice card contrast fix (dark-pine pills use light alabaster text) and raw `ai_error`/deprecation debug text removed from UI — clean "AI + Rules" / "Rules-Based" status pill only
- [x] Deprecated Workers AI model replaced: primary `@cf/meta/llama-3.1-8b-instruct-fast`, secondary fallback `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; `ai_error` kept strictly in server-side `console.warn` logs
- [x] Phone (360–412px) & laptop (1280–1440px) responsiveness pass across AppShell, Dashboard, SavedLocations, LifestyleProfiles, Routines, Awareness, HistoryImpact (mobile drawer `h-[100dvh]` + auto-close, sticky desktop sidebar, `overflow-x-auto` profile pill bar, stacked mobile control rows, collapsing grids, wide-table overflow wrap, `break` edge-case checks: zero-data / offline-fallback / long-name truncation)
- [x] Re-verified: `npx tsc --noEmit` in `worker/` and `npm run build` in `frontend/` pass with zero errors

---

## Phase 5C: UI Polish & Motion polish (complete)

- [x] Task 1: Dashboard "Nearby Stations" capped to 10 closest alternatives, sorted ascending on `distance_km` and sliced with `.slice(0, 10)` — `frontend/src/pages/Dashboard.tsx`
- [x] Task 2: Sky-blue (#D9EEF8, #0EA5E9) blended with forest/mist sage palette (Deep Pine #1E2E24, Misty Alabaster #F4F6F3, Sage #E6ECE7, Warm Dawn #C89666) across frosted-glass cards; fixed non-interactive `pointer-events-none` scientific atmospheric background with contour lines, particulate ticks, drifting mist in `AtmosphericBackdrop.tsx`; SavedLocations primary action buttons rethemed in Deep Pine / Sky-Nature palette with `press-soft` + `active:scale-[0.98]`
- [x] Task 3: Smooth accordion drawer unfolds (0fr ↔ 1fr transition with rotating chevron) in `SavedLocations.tsx`; staggered GPU-composited card entrances (`animate-card-rise`) with 30–80ms delays; smooth advice reveals in `Routines.tsx`; tactile active-press feedback (`press-soft`, `active:scale-[0.98]`)
- [x] `npm run build` passes in `frontend/` (7.27s, 1653 modules transformed, zero TypeScript errors)
- [x] DESIGN.md updated with four new atmospheric color tokens (Sky Soft, Sky Accent, Canopy Mist, Pine Mist) and motion/interaction token documentation

---

## Phase 6A: Public Landing Homepage + Login/Sign Up Design Alignment (complete)

- [x] **Task 1 – Public Landing Homepage** (`frontend/src/pages/Home.tsx` + `frontend/src/components/FoggyBackdrop.tsx`):
  - [x] Route `/` renders `Home.tsx` for unauthenticated visitors; signed-in users auto-redirect to `/dashboard` (App.tsx)
  - [x] Foggy nature hero — `FoggyBackdrop` (fixed, `pointer-events-none`/`aria-hidden`, sky-soft → alabaster → canopy-mist gradient, layered Deep Pine mountain/canopy silhouettes, two `.mist-layer` drifting fog blobs, `prefers-reduced-motion`-guarded)
  - [x] Editorial `Playfair Display` headline with Warm Dawn italic accent ("Know the air you *actually* breathe."), plain-English AirAware intro (hyperlocal NAQI + US AQI station mapping, multi-profile exposure scoring, hybrid AI routine tips)
  - [x] Prominent **Get Started (Sign Up)** (Deep Pine pill) + **Log In** (frosted pill) CTAs with `press-soft` / `active:scale-[0.98]`
  - [x] Three frosted-glass feature cards below the fold (`animate-card-rise` staggered 0/60/120ms): Hyperlocal India AQI · Family & Lifestyle Profiles · Routine Exposure & AI Tips
  - [x] Clean footer (brand + data-source line + CTA link)
  - [x] Responsive: stacked hero/CTAs/cards on phone (360–412px), 3-up card grid + split-card auth on laptop (1280–1440px)
- [x] **Task 2 – Login / Sign Up Alignment** (`frontend/src/pages/Login.tsx` + `frontend/src/components/AuthPanel.tsx`):
  - [x] Frosted-glass split card over the sky-to-canopy `FoggyBackdrop`: left Deep Pine brand pane (headline + 3 feature bullets, hidden on phones → compact header), right pane with Log In / Sign Up mode tabs
  - [x] Sign-in + sign-up modes with `?mode=signup` deep-link from the homepage CTA; error/notice states; "Back to home" pill linking to `/`
  - [x] Auth transitions cleanly: `onAuthStateChange` flips user state → route guard bounces to `/dashboard`
  - [x] All styling migrated from slate defaults to the sky-blue & pine token set (Deep Pine buttons, sage borders, sky-soft focus rings, Warm Dawn accents)
- [x] `npm run build` in `frontend/` passes with zero TypeScript errors (1655 modules, 2.75s)
- [x] Committed

---

## Phase 6B: Profile Builder Wizard Redesign (complete)

- [x] **Task 1 – Frosted-glass wizard card** (`frontend/src/pages/LifestyleProfiles.tsx`): zero-profiles intro now lives inside a frosted card (`bg-white/80 backdrop-blur-md border-white/60 rounded-2xl`) with Sky-Soft → Canopy-Mist gradient washes + soft blur orbs; Playfair Display step headings with Warm Dawn `<em>` accents; animated 3-step progress rail (numbered dots + `.wiz-progress-fill` width transition on `--ease-soft`)
- [x] **Task 2 – Directional step transitions**: `.wiz-in-f`/`.wiz-in-b` incoming + `.wiz-out-f`/`.wiz-out-b` outgoing layers (translateX ±28px + opacity, 0.28s, GPU-composited) driven by `prevStep`/`direction` state with a 300ms settle timeout; `prefers-reduced-motion` pins the incoming step and hides the outgoing layer; `press-soft` + `active:scale-[0.98]` on all wizard buttons
- [x] **Task 3 – Step 2 toggle chips**: both `<select multiple>` replaced by `type="button"` + `aria-pressed` chip grids for Health Conditions (None mutually exclusive) and Protective Habits; +Other inline inputs (Add button + Enter-to-add) append trimmed custom values; live "Selected" badge strips with removable tags
- [x] **Task 4 – Step 3 home base**: "Use My Current Location" GPS button porting the `SavedLocations.tsx` pattern (`inIndia` bounds, Nominatim reverse geocode with `user-agent=AirAware/1.0`, monotonic `pickSeq` counter); Manual Entry (name/lat/lng/type) with insert-if-new `saved_locations` "Home" row capturing the new id; saved-location select; Skip option; confirm inserts `lifestyle_profiles` with `home_location_id` + `is_active: true` and refreshes the profiles context; compact Profile Summary Card above "Confirm & Create Profile"
- [x] `FormState`/`emptyForm` reconciled with `profileToForm`/`saveProfile`/add-edit panel (string `healthConditionsText` + 3 habit booleans); wizard keeps independent `WizardState` string arrays; unused imports removed
- [x] `npm run build` in `frontend/` passes with zero TypeScript errors (1655 modules, 3.22s)
- [x] Committed

---

## UI Declutter Pass: NAQI-Only Routines Display + Personal Exposure Explainer (complete)

- [x] **Dashboard location badge** (`frontend/src/pages/Dashboard.tsx`): removed the raw latitude/longitude readout above the map — badge now shows the clean city/place name only (e.g., `Bengaluru`)
- [x] **Routines NAQI-only display** (`frontend/src/pages/Routines.tsx`): removed the `US xxx` pill entirely; each stop shows only its Indian NAQI (`NAQI 101`, `NAQI 74`); panel header relabeled "Per-stop NAQI"
- [x] **High-contrast amber AQI badge** (new shared helper `frontend/src/lib/aqiPill.ts`): Satisfactory/Moderate amber-family colors (`#FFFF00`/`#FF9900` + DESIGN.md palette equivalents) now render as deep amber text `#713F12` (amber-950) on rich gold `#FDE047` (amber-200) with a crisp amber-400 border; other tiers keep the tinted category color; `aqiBarColor` keeps thin share-bar fills readable
- [x] **Routines declutter** (`frontend/src/pages/Routines.tsx`): stripped raw `(lat, lng)` from map-pinpoint stop labels (now `Map Pinpoint`, both in routine segments and new pins); removed "Sensitivity ×…" multiplier from the score panel; replaced "Inhaled dose breakdown" with a clean **Exposure Share** section (stop name, duration, % share only, bar keeps NAQI-tier color); replaced "Why this score" with a plain-English summary (top contributing stop by share + tier, age/health sensitivity flag, mask/indoor/vehicle-cabin softening notes); dropped raw `Adult baseline: ×1.00` reason lines and the "Total inhaled dose X / budget 800" line; **Suggested Actions** kept unchanged
- [x] **Awareness explainer** (`frontend/src/pages/Awareness.tsx`): new "How AirAware Calculates Your Personal Exposure" section — five-step plain-English breakdown (live NAQI → stop duration → indoor/outdoor setting → protective gear → personal sensitivity weighting) plus a short NAQI vs US EPA AQI note, styled in the existing frosted-card / Deep Pine pattern; engine math in `exposure.ts` untouched (PRD guardrails preserved)
- [x] `npm run build` in `frontend/` passes with zero TypeScript errors (1656 modules, 3.27s)
- [x] Committed

---

## Frosted-Glass & Botanical UI Upgrade Pass (complete)

- [x] **Task 1 – Signature frosted-glass material** (`frontend/src/index.css`): new house card-surface classes `.glass-panel` (translucent white/60 tint, `blur(24px) saturate(1.5)`, white/80 border, deep soft shadow + inset top glass-rim highlight) and `.glass-panel-solid` (white/72 tint for data-dense cards); two new botanical tokens `--color-forest: #2D4739` / `--color-sage-leaf: #52796F`; GPU-composited `.leaf-sway` / `.leaf-sway-b` keyframes (transform-only, `will-change: transform`) with `prefers-reduced-motion` guards
- [x] **Task 2 – Botanical & paper-cut backdrops** (`frontend/src/components/FoggyBackdrop.tsx` + `frontend/src/components/AtmosphericBackdrop.tsx`):
  - FoggyBackdrop (public Home + Login): sky-blue radial glow washes (`#BAE6FD` / `#38BDF8`), multi-layered SVG botanical silhouettes (palm fronds, ferns, canopy branches in Deep Pine `#1E2E24` / Forest `#2D4739` / Sage `#52796F`) and three sculpted paper-cut wave contours with soft drop-shadow filters, positioned directly behind the hero/auth cards so the frosted glass visibly blurs leaf shapes + sky gradients; drifting mist + gentle leaf-sway motion, all `pointer-events-none` / `aria-hidden` / `prefers-reduced-motion`-guarded
  - AtmosphericBackdrop (logged-in app): added soft sky-blue atmospheric altitude bands, two extra dashed wind-stream traces, and very low-opacity (≤0.10) corner botanical silhouettes so AQI badges on frosted panels keep full contrast
- [x] **Task 3 – Home split-hero redesign** (`frontend/src/pages/Home.tsx`): duplicate CTAs removed (top-right "Log In" header link and footer "Create your account →" deleted; the two hero buttons now appear exactly once); instant-clarity split hero — left: eyebrow pill (`Hyperlocal Indian AQI · Personal Exposure`), Playfair headline, 2-line explanation, `Get Started (Sign Up)` + `Log In` pill buttons (`active:scale-[0.98]`); right: three staggered `.glass-panel` preview cards (Neighbourhood Station `Indiranagar, Bengaluru · 74 Satisfactory` warm-gold badge + `1.4 km away` pill; Personal Sensitivity `Aarav, 21 · N95 Mask + HEPA Filter → Low Exposure`; 3-stop `Home → Metro → Campus` route bar + `31 · Low` exposure score) with hover-lift micro-interactions; below-the-fold: three compact `.glass-panel` feature cards (`Exact Neighbourhood Stations` / `Household Health Profiles` / `Multi-Stop Routine & AI Tips`) with hover-lift; clean minimal footer; responsive 360px → 1440px
- [x] **Task 4 – Login paper-cut wave split card** (`frontend/src/pages/Login.tsx`): card migrated to `.glass-panel`; desktop brand pane now layers a sculpted paper-cut wave edge (glass sheet with soft drop shadow falling onto the Deep Pine pane) over rich shadowed botanical frond silhouettes + a sky-blue corner glow; mobile (360–640px) centers the `.glass-panel` auth card directly over the lush `FoggyBackdrop` foliage so the glass blurs the leaves behind it
- [x] `npm run build` in `frontend/` passes with zero TypeScript errors (1656 modules, 4.20s)
- [x] Committed

---

## User Preferences & Config Choices (from Section A & B)
- **GitHub Repository**: `https://github.com/Mohammed-Safi15/airaware.git`
- **Supabase**: Active project, Email/Password auth first.
- **Cloudflare**: Account active, Wrangler CLI authenticated (`npx wrangler whoami` verified).
- **Air Quality APIs**: OpenAQ API key + data.gov.in (CPCB) API key with auto-fallback.
- **Geocoding**: Zero-key OpenStreetMap Nominatim/Photon with debouncing.
- **Generative AI**: Cloudflare Workers AI via `env.AI` binding (`[ai] binding = "AI"`).
- **Language**: TypeScript (`.ts`/`.tsx`)
- **Structure**: Monorepo (`frontend/` + `worker/`)
- **Caching**: Cloudflare Workers Cache API (`caches.default`)
- **UI & Icons**: Tailwind CSS v4 + `lucide-react`
- **Graphify**: Enabled (Phase 2+)
- **Cadence**: Strict phase-by-phase with Phase Exit Gates

---

## Phase-by-Phase Execution Checklist

### [x] Phase 0: Initialization, Repository Setup & Memory Files
- [x] Create `.gitignore` …
- [x] Create `PROGRESS.md` & `CLAUDE.md` …
- [x] Create `.env.example` & `.dev.vars.example` …
- [x] Initialize git, link remote `origin`, create initial commit & push …
- [x] Scaffold frontend with Vite + React + TS + Tailwind CSS + lucide-react …
- [x] Health-check Cloudflare Worker `/api/ping` …
- [x] **Phase 0 Exit Gate**: Verified with user …

### [x] Phase 1: Authentication & Secure Database Foundation
- [x] Write Supabase SQL migration script (`supabase_schema.sql`) …
- [x] Apply schema to Supabase project database (manual step – load SQL in Supabase SQL Editor) …
- [x] Scaffold Cloudflare Worker project skeleton (`wrangler.toml`, `src/index.ts`) …
- [x] Implement `/api/health` endpoint with CORS middleware …
- [x] Frontend env files (`frontend/.env`, `frontend/.env.example`) …
- [x] **Phase 1 Exit Gate**: Verify Supabase tables with RLS and test user auth flow … – User A vs User B RLS isolation panel wired, Vite build passes (`npm run build`), tsc --noEmit clean, dev server serves UI; two-account test harness (AuthPanel + RlsTestPanel) committed and push to origin/master

### [x] Phase 2: Air Quality API Integration, Caching & Graphify Setup
- [x] CPCB (`data.gov.in`) & OpenAQ API adapter implementation in Worker …
- [x] Cloudflare Workers Cache API implementation (`caches.default`) …
- [x] Station matching logic (nearest station calculation using Haversine formula) …
- [x] Indian National AQI calculator per CPCB breakpoints (never averages across stations; never substitutes zero) …
- [x] Three-state reliability model (Measured / Estimated / Unavailable) …
- [x] Stale-data detection (>2h since measurement_timestamp –> Estimated) …
- [x] `tsc --noEmit` clean; frontend build passes …
- [ ] Graphify setup – blocked by missing `anthropic` Python package; retry after install
- [x] **Phase 2 Exit Gate**: Verify live AQI endpoint against deployed Worker …

### [x] Phase 3: Interactive Map, Pinpoint Marker & Multi-Location Management
- [x] Install Leaflet + `@types/leaflet` (already present in devDependencies) …
- [x] App shell with React Router – Dashboard, Locations, Settings pages with bottom nav …
- [x] Debounced Photon/Nominatim geocoding search component (400ms default) …
- [x] Interactive Leaflet map with OSM tiles and `/api/aqi` station markers (NAQI color-coded) …
- [x] Supabase CRUD for `saved_locations` table (create, read, update, delete) …
- [x] Location picker integrated with saved locations list …
- [x] User geolocation ("Use My Location" button) …
- [x] Red pinpoint marker (`#DC2626`) replacing blue user query dot in MapView.tsx …
- [x] Single red pinpoint tracked in dedicated ref, cleared on every new pick …
- [x] Top-right "Use My Location" button removed from Dashboard header …
- [x] Redundant top bar "Locations / Use My Location / Search" removed from Locations.tsx …
- [x] Locations.tsx opens directly with Saved Locations + Add Location panel …
- [x] Sidebar red pinpoint consistency in SavedLocations picker …
- [x] `tsc --noEmit` clean; `npx vite build` passes …
- [x] **Phase 3 Exit Gate**: Verified – red click-anywhere IDW pinpoint, pinpoint-first Saved Locations with all-in-one panel … two-section left sidebar shell …
- [x] India-only bounding box enforcement on worker `/api/aqi` (lat 8–35, lng 68–97, 400 for out-of-bounds) …
- [x] Paginated CPCB fetch (offset loop) to bypass 1000-record cap …
- [x] Open-Meteo zero-key fallback integrated as neighborhood-level proxy …
- [x] City/state fields propagated from CPCB data to AQResponse and rendered in frontend badges …
- [x] Frontend geocoding restricted to India only (countrycode=in, viewbox + bounded for Nominatim, post-filter with India list) …
- [x] Micro-landmark retry logic in SearchBar when initial query lacks precise locality …
- [x] NAQI badge color-coding on SavedLocations cards mirroring nqi.ts categories (Good ≤50 … Severe >400) …
- [x] Auto-fetch AQI on saved-location load and explicit click …
- [x] Final `tsc --noEmit` clean on both worker and frontend; `npm run build` passes …
- [x] Saved Locations: duplicate location name input removed – only one text box + one type dropdown remain …
- [x] Saved Locations: embedded Leaflet pinpoint picker map in Add/Edit form – click to drop/move pin with India-only reverse geocode via Photon …
- [x] Saved Locations: "Use My Location" GPS button with `navigator.geolocation` …
- [x] Saved Locations: Save button disabled until a valid pin is placed/selected/detected …
- [x] Saved Locations: live NAQI/AQI preview badge shown before saving based on current lat/lng …
- [x] Saved Locations: expandable Chevron accordion drawer per card showing full AQI details panel on demand …
- [x] Saved Locations: Quick filter/search bar above saved list to filter by name or type …
- [x] Saved Locations: source badge ("CPCB Station" / "Open-Meteo Model") rendered per-card and inside drawer …
- [x] Saved Locations: pollutant grid (PM2.5, PM10, NO2, CO, SO2, O3) inside drawer …
- [x] Saved Locations: Action buttons (Refresh AQI / View on Map) inside drawer …
- [x] Built-in CPCB station coordinate dictionary for 30+ major Indian stations across Bengaluru/Delhi/Mumbai/Chennai/Hyderabad/Kolkata (worker/src/lib/fetchers/cpcb.ts STATION_COORDINATE_DICT) …
- [x] Dual NAQI + US EPA AQI returned from /api/aqi and displayed everywhere (Dashboard card + Saved Locations cards/drawers) …
- [x] All changes committed locally (`a9cef79`); Phase 3 verified by user …
- [x] **Phase 3 Exit Gate**: Verified – red click-anywhere IDW pinpoint, pinpoint-first Saved Locations with all-in-one panel – ¼ live AQI drawer, two-section left sidebar shell …

### [x] Phase 4: Multi-Profile, Routines & Exposure Score (Verified & Committed)
Phase 4 spec (user-confirmed 2026-11-26), following the foggy nature & frosted glass design system in `DESIGN.md`:

- [x] **4.1 – Multi-Profile Lifestyle Support (`lifestyle_profiles`)**
  - [x] SQL migration in `worker/supabase_schema.sql` section 6: `lifestyle_profiles` table (RLS `auth.uid() = user_id`) with `id`, `user_id`, `name`, `age`, `lifestyle`, `health_conditions` (text[]), `home_location_id` (nullable FK –> `saved_locations`), `has_air_purifier`, `uses_n95_mask`, `ventilates_windows`, `is_active`
  - [x] TS row types in `frontend/src/lib/supabase.ts` (`LifestyleProfileRow`, `LIFESTYLES`, `LOCATION_TYPES`)
  - [x] `frontend/src/pages/LifestyleProfiles.tsx` – multi-profile CRUD (Self / Child / Senior Parent examples), set-active action
  - [x] Quick active-profile switcher pill in the top bar (AppShell `ProfileSwitcherBar`, sticky under sidebar, Warm Dawn active state)
- [x] **4.2 – Routines & One-Click Multi-Location AQI Check**
  - [x] Schema extension in `worker/supabase_schema.sql` section 8 (`PHASE 4 EXTENSIONS`): `commute_routines` gains `name`, `transit_mode`, `departure_time`, `return_time`, `active_days`, `updated_at` (+ new CHECKs); `daily_routine_segments` gains `routine_id` FK + `latitude`/`longitude` + expanded env CHECK (`walk, two_wheeler, auto_non_ac, car_ac, metro_bus, indoor_purifier, indoor_natural`)
  - [x] `frontend/src/pages/Routines.tsx` – create/edit recurring routines linking multiple stops from saved_locations or map pinpoints, with departure/return time windows, active days, transit/micro-environment modes
  - [x] "Check Routine AQI" button per routine card –> concurrent live `/api/aqi` fetches across all stops (`Promise.all` + `fetchStopAqi`)
  - [x] Side-by-side NAQI & US AQI comparison per stop + deterministic actionable tips (safer departure timing, N95/purifier reminders, cleaner transit alternatives)
- [x] **4.3 – Deterministic Personal Exposure Score Engine**
  - [x] `frontend/src/lib/exposure.ts` – transparent 0–100 daily Personal Exposure Score + inhaled dose breakdown (live per-stop NAQI × duration in hours × transit/indoor attenuation × active profile's age + health sensitivity weights; null-NAQI stops excluded, NO station index averaging per PRD guardrail)
  - [x] Score card + segment breakdown displayed on Dashboard (single-stop model for viewed location) and Routines (full routine) pages
- [x] Replace `/lifestyle` & `/routines` self-Navigate placeholder routes in `App.tsx` with the real pages (awareness/history nav links now fall through to the catch-all redirect; `ProfilesProvider` wired around all protected routes)
- [x] `npm run build` in `frontend/` passes with zero TypeScript errors (`tsc -b` clean)
- [x] **Manual DB step before verification**: Run the one-shot sections 6 & 8 of `worker/supabase_schema.sql` in the Supabase SQL editor (`lifestyle_profiles` table + RLS, plus the `commute_routines`/`daily_routine_segments` Phase 4 column extensions incl. `created_at`). These are `IF NOT EXISTS`/`ADD COLUMN IF NOT EXISTS` one-shot migrations, not part of the initial schema.
- [x] Routines load-error safeguard: failed Supabase fetches surface a visible red alert with `error.message` instead of silently showing "No routines yet"
- [x] All Phase 4 changes committed (`6a518c4`); Phase 4 verified by user …
- [x] **Phase 4 Exit Gate**: Multi-profile CRUD, routine AQI comparison, and Exposure Score calculation verified in browser …

Superseded checklist items (kept for traceability):
- [x] multi-profile `lifestyle_profiles` – multiple household/family profiles per login with age, lifestyle, health conditions, home base (rolled up into 4.1, delivered & verified in Phase 4)
- [x] Routine AQI comparison UI (side-by-side pollutant grid) (rolled up into 4.2, delivered & verified in Phase 4)
- [x] Personal Exposure Score 0–100 (rolled up into 4.3, delivered & verified in Phase 4)

### Phase 5: Hybrid Rule + Workers AI Routine Tips Engine
- [x] **5.1 – `POST /api/advice` Worker endpoint** (`worker/src/lib/advice.ts` + route in `worker/src/index.ts`)
  - [x] Deterministic CPCB NAQI + profile-sensitivity rule engine (rules R1–R8: data-availability, category actions, rush-hour departure, transit swaps, N95, HEPA purifier, sensitive-group flags, exposure-band framing)
  - [x] Cloudflare Workers AI layer (`env.AI`, `@cf/meta/llama-3.1-8b-instruct-fast` primary, `@cf/meta/llama-3.3-70b-instruct-fp8-fast` secondary fallback, raw mode, 30s `Promise.race` timeout) that rephrases/contextualises the deterministic result; output schema-validated (strict JSON, kind whitelist, ≤4 tips, ≤80-word summary, max_tokens 700, temperature 0.3) — any unbound/timeout/unparsable failure degrades to `source: "rules-fallback"` with `ai_error` set to server-side `console.warn` logs only
  - [x] CORS extended to `GET, POST`; `wrangler.toml` already had `[ai] binding = "AI"`
  - [x] `npx tsc --noEmit` in `worker/` zero errors; `npm run build` in `frontend/` clean …
  - [x] Advice card in Routines.tsx calling `/api/advice` + auto-save check snapshots …
  - [x] AQI Awareness & Health Guide page …
  - [x] History & My Impact Calculator page
  - [x] **Phase 5 Exit Gate**: Complete – advice-card contrast/debug-text fix, current AI models, phone & laptop responsiveness pass, and clean builds all verified; stopping at Phase 5 gate, do not proceed to Phase 6

### Phase 6A: Chat Endpoint + AskAirAware Page
- [x] **5.2 – `POST /api/chat` Worker endpoint** (`worker/src/lib/chat.ts` + new route in `worker/src/index.ts`)
  - [x] Deterministic keyword-matched fallback answering core AQI, health, lifestyle, and nature questions
  - [x] Polite off-topic refusal with 2-3 AirAware topic suggestions for unmatched queries
  - [x] Workers AI model fallback (`@cf/meta/llama-3.2-3b-instruct` primary, `@cf/meta/llama-3.3-70b-instruct-fp8-fast` secondary) per user spec overriding existing code
  - [x] Strict scope guardrails: answers only about AQI, air pollutants, health precautions, lifestyle adjustments, protective gear, nature/environmental actions
  - [x] CORS enabled; `[ai] binding = "AI"` already configured
  - [x] `npx tsc --noEmit` in `worker/` passes; `npm run build` in `frontend/` clean
- [x] **6A.2 – AskAirAware.tsx page** (`frontend/src/pages/AskAirAware.tsx`)
  - [x] 7th sidebar route `/ask` with `.glass-panel` material
  - [x] Playfair Display heading + "Tailored for [Active Profile Name]" frosted-glass pill
  - [x] 4 starter cards: AQI Scales, Health & Gear, Daily Lifestyle, Nature & Future
  - [x] Session-only conversation view with animate-card-rise bubbles
  - [x] Loading dots while awaiting /api/chat
  - [x] "Clear Chat" button functionality
  - [x] Responsive input bar with active:scale-[0.98] at 360px phone and 1440px laptop
- [x] **6A.3 – Add "Ask AirAware" NavLink** in AppShell.tsx drawer as 7th NavLink (Sparkles or MessageSquare icon)
- [x] **6A.4 – Wire /ask route** in frontend/src/App.tsx Routes
- [x] **6A.5 – Add "Have a question? Ask AirAware →" link** at bottom of advice card in Routines.tsx navigating to /ask
- [x] **6A.6 – Update PROGRESS.md** and commit cleanly
- [x] **Public Homepage** (foggy nature hero, title, short intro, Log In / Sign Up): Deep Pine `#1E2E24`, Misty Alabaster `#F4F6F3`, Sage `#E6ECE7`, Warm Dawn `#C89666`
- [x] **Initial Profile Builder Wizard** post-signup: age, lifestyle, health conditions, home base selection (redesigned in Phase 6B — frosted-glass card, directional transitions, toggle chips, GPS/manual/skip home base + summary card; see below)
- [x] **`emil-design-eng` motion polish**: component press/hover states, popover origins, tooltip timing, transitions vs keyframes
- [x] State-machine / break edge-case checks (reduced motion, screen-size, auth state)
- [x] **Title hover/tap attributes**: truncated stop-summary labels and routine names recoverable on phones/laptops
- [x] **Phase 6 Exit Gate**: Verify polish, motion, and edge-case robustness

---

## Architectural & Deployment Notes
- **Supabase Database**: Schema defined in [`supabase_schema.sql`](worker/supabase_schema.sql) covering all 6 personal tables with Row Level Security (`auth.uid() = user_id`) and auto-updating `updated_at` triggers. Database: `https://ryzztiyjunbgwwkryovi.supabase.co`
- **Cloudflare Worker**: Configured in [`wrangler.toml`](worker/wrangler.toml) with AI binding (`[ai] binding = "AI"`). Health endpoint at `http://localhost:8787/api/health`. Worker deployed locally for dev.
- **Frontend**: Vite + React + TypeScript + Tailwind CSS v4 + `lucide-react`. Dev server at `http://localhost:5173`.
- **Design System**: Foggy Nature & Frosted Glass palette – Deep Pine `#1E2E24`/`#2D3E33`, Misty Alabaster `#F4F6F3`, Sage `#E6ECE7`, Warm Dawn `#C89666`; CPCB NAQI semantic colors strictly for AQI pills/station indicators; frosted glass cards `bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-[0_8px_30px_rgb(30,46,36,0.06)]`; Playfair Display italic accents + Plus Jakarta Sans (tabular-nums for AQI figures); misty mountain/canopy backdrop with soft drifting cloud/fog overlays `pointer-events-none` + `prefers-reduced-motion` guard for public landing + split-card Login/Signup.
- **Google Fonts**: `Playfair Display` + `Plus Jakarta Sans` linked in `frontend/index.html`.

---

## Phase 1 Exit Gate – Action Items
To pass Phase 1, please:
1. In your Supabase dashboard SQL Editor, run the `supabase_schema.sql` content to create all 6 tables with RLS policies.
2. Create two test user accounts (Email/Password) and verify they can each log in/log out.
3. Confirm User A cannot read User B's rows in any of the 6 tables (test RLS by querying as different auth users).
4. Update `PROGRESS.md` before finishing this response so a new session can resume immediately.

---

## Phase 2 Exit Gate – Verification Checklist
The following have been implemented and committed (86cbec5):

1. **Endpoints**: `/api/health` and `/api/aqi?lat=&lng=` with CORS headers.
2. **Adapters**: CPCB (data.gov.in) + OpenAQ fallback with graceful error handling.
3. **NAQI calculator**: Indian National AQI per CPCB breakpoints – no averaging across stations, no zero-substitution.
4. **Reliability model**: Measured / Estimated / Unavailable with >2h staleness detection.
5. **Caching**: Cloudflare edge cache with 30 min TTL via `caches.default`.
6. **Type safety**: `tsc --noEmit` clean; frontend build passes.
7. **Graphify**: Pending (blocked by missing `anthropic` Python package – install via `pip install anthropic` or `uv tool install "graphifyy[anthropic]"`).

To verify:
```bash
# Local dev
npx wrangler dev   # http://localhost:8787/api/health

# Test AQI endpoint
curl "http://localhost:8787/api/aqi?lat=12.9716&lng=77.5946"
```

After passing Phase 2, update PROGRESS.md and proceed to Phase 3.