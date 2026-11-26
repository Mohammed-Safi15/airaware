# AirAware - Progress Tracker

**Current Phase**: Phase 5 In Progress — Hybrid Rule + Workers AI Advice Engine, AQI Awareness Guide, History & My Impact
**Exact Next Step**: `POST /api/advice` Worker endpoint built (deterministic rules + `env.AI` llama-3.1-8b-instruct hybrid with fallback, `npx tsc --noEmit` clean in `worker/`, frontend build clean). Remaining Phase 5: (1) advice card in Routines.tsx calling `/api/advice` + auto-save check snapshots; (2) `Awareness.tsx` editorial guide page; (3) `HistoryImpact.tsx` + new Supabase tables for exposure check logs & protective actions. Then stop at the Phase 5 Exit Gate.

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
- [x] Create `.gitignore` ✅
- [x] Create `PROGRESS.md` & `CLAUDE.md` ✅
- [x] Create `.env.example` & `.dev.vars.example` ✅
- [x] Initialize git, link remote `origin`, create initial commit & push ✅
- [x] Scaffold frontend with Vite + React + TS + Tailwind CSS + lucide-react ✅
- [x] Health-check Cloudflare Worker `/api/ping` ✅
- [x] **Phase 0 Exit Gate**: Verified with user ✅

### [x] Phase 1: Authentication & Secure Database Foundation
- [x] Write Supabase SQL migration script (`supabase_schema.sql`) ✅
- [x] Apply schema to Supabase project database (manual step — load SQL in Supabase SQL Editor) ✅
- [x] Scaffold Cloudflare Worker project skeleton (`wrangler.toml`, `src/index.ts`) ✅
- [x] Implement `/api/health` endpoint with CORS middleware ✅
- [x] Frontend env files (`frontend/.env`, `frontend/.env.example`) ✅
- [x] **Phase 1 Exit Gate**: Verify Supabase tables with RLS and test user auth flow ✅ — User A vs User B RLS isolation panel wired, Vite build passes (`npm run build`), tsc --noEmit clean, dev server serves UI; two-account test harness (AuthPanel + RlsTestPanel) committed and push to origin/master

### [x] Phase 2: Air Quality API Integration, Caching & Graphify Setup
- [x] CPCB (`data.gov.in`) & OpenAQ API adapter implementation in Worker ✅
- [x] Cloudflare Workers Cache API implementation (`caches.default`) ✅
- [x] Station matching logic (nearest station calculation using Haversine formula) ✅
- [x] Indian National AQI calculator per CPCB breakpoints (never averages across stations; never substitutes zero) ✅
- [x] Three-state reliability model (Measured / Estimated / Unavailable) ✅
- [x] Stale-data detection (>2h since measurement_timestamp → Estimated) ✅
- [x] `tsc --noEmit` clean; frontend build passes ✅
- [ ] Graphify setup — blocked by missing `anthropic` Python package; retry after install
- [x] **Phase 2 Exit Gate**: Verify live AQI endpoint against deployed Worker ✅

### [x] Phase 3: Interactive Map, Pinpoint Marker & Multi-Location Management
- [x] Install Leaflet + `@types/leaflet` (already present in devDependencies) ✅
- [x] App shell with React Router — Dashboard, Locations, Settings pages with bottom nav ✅
- [x] Debounced Photon/Nominatim geocoding search component (400ms default) ✅
- [x] Interactive Leaflet map with OSM tiles and `/api/aqi` station markers (NAQI color-coded) ✅
- [x] Supabase CRUD for `saved_locations` table (create, read, update, delete) ✅
- [x] Location picker integrated with saved locations list ✅
- [x] User geolocation ("Use My Location" button) ✅
- [x] **Red pinpoint marker** (`#DC2626`) replacing blue user query dot in MapView.tsx ✅
- [x] Single red pinpoint tracked in dedicated ref, cleared on every new pick ✅
- [x] Top-right "Use My Location" button removed from Dashboard header ✅
- [x] Redundant top bar "Locations / Use My Location / Search" removed from Locations.tsx ✅
- [x] Locations.tsx opens directly with Saved Locations + Add Location panel ✅
- [x] Sidebar red pinpoint consistency in SavedLocations picker ✅
- [x] `tsc --noEmit` clean; `npx vite build` passes ✅
- [x] **Phase 3 Exit Gate**: Verified — red click-anywhere IDW pinpoint, pinpoint-first Saved Locations with all-in-one panel + ▼ live AQI drawer, two-section left sidebar shell ✅
- [x] India-only bounding box enforcement on worker `/api/aqi` (lat 8–35, lng 68–97, 400 for out-of-bounds) ✅
- [x] Paginated CPCB fetch (offset loop) to bypass 1000-record cap ✅
- [x] Open-Meteo zero-key fallback integrated as neighborhood-level proxy ✅
- [x] City/state fields propagated from CPCB data to AQResponse and rendered in frontend badges ✅
- [x] Frontend geocoding restricted to India only (countrycode=in, viewbox + bounded for Nominatim, post-filter with India list) ✅
- [x] Micro-landmark retry logic in SearchBar when initial query lacks precise locality ✅
- [x] NAQI badge color-coding on SavedLocations cards mirroring nqi.ts categories (Good ≤50 … Severe >400) ✅
- [x] Auto-fetch AQI on saved-location load and explicit click ✅
- [x] Final `tsc --noEmit` clean on both worker and frontend; `npm run build` passes ✅
- [x] Saved Locations: duplicate location name input removed — only one text box + one type dropdown remain ✅
- [x] Saved Locations: embedded Leaflet pinpoint picker map in Add/Edit form — click to drop/move pin with India-only reverse geocode via Photon ✅
- [x] Saved Locations: "Use My Location" GPS button with `navigator.geolocation` ✅
- [x] Saved Locations: Save button disabled until a valid pin is placed/selected/detected ✅
- [x] Saved Locations: live NAQI/AQI preview badge shown before saving based on current lat/lng ✅
- [x] Saved Locations: expandable ▼ Chevron accordion drawer per card showing full AQI details panel on demand ✅
- [x] Saved Locations: Quick filter/search bar above saved list to filter by name or type ✅
- [x] Saved Locations: source badge ("CPCB Station" / "Open-Meteo Model") rendered per-card and inside drawer ✅
- [x] Saved Locations: pollutant grid (PM2.5, PM10, NO2, CO, SO2, O3) inside drawer ✅
- [x] Saved Locations: Action buttons (Refresh AQI / View on Map) inside drawer ✅
- [x] Built-in CPCB station coordinate dictionary for 30+ major Indian stations across Bengaluru/Delhi/Mumbai/Chennai/Hyderabad/Kolkata (worker/src/lib/fetchers/cpcb.ts STATION_COORDINATE_DICT) ✅
- [x] Dual NAQI + US EPA AQI returned from /api/aqi and displayed everywhere (Dashboard card + Saved Locations cards/drawers) ✅
- [x] All changes committed locally (`a9cef79`); Phase 3 verified by user ✅

### [x] Phase 4: Multi-Profile, Routines & Exposure Score (Verified & Committed)
Phase 4 spec (user-confirmed 2026-11-26), following the foggy nature & frosted glass design system in `DESIGN.md`:

- [x] **4.1 — Multi-Profile Lifestyle Support (`lifestyle_profiles`)**
  - [x] SQL migration in `worker/supabase_schema.sql` section 6: `lifestyle_profiles` table (RLS `auth.uid() = user_id`) with `id`, `user_id`, `name`, `age`, `lifestyle`, `health_conditions` (text[]), `home_location_id` (nullable FK → `saved_locations`), `has_air_purifier`, `uses_n95_mask`, `ventilates_windows`, `is_active`
  - [x] TS row types in `frontend/src/lib/supabase.ts` (`LifestyleProfileRow`, `LIFESTYLES`, `LOCATION_TYPES`)
  - [x] `frontend/src/pages/LifestyleProfiles.tsx` — multi-profile CRUD (Self / Child / Senior Parent examples), set-active action
  - [x] Quick active-profile switcher pill in the top bar (AppShell `ProfileSwitcherBar`, sticky under sidebar, Warm Dawn active state)
- [x] **4.2 — Routines & One-Click Multi-Location AQI Check**
  - [x] Schema extension in `worker/supabase_schema.sql` section 8 (`PHASE 4 EXTENSIONS`): `commute_routines` gains `name`, `transit_mode`, `departure_time`, `return_time`, `active_days`, `updated_at` (+ new CHECKs); `daily_routine_segments` gains `routine_id` FK + `latitude`/`longitude` + expanded env CHECK (`walk, two_wheeler, auto_non_ac, car_ac, metro_bus, indoor_purifier, indoor_natural`)
  - [x] `frontend/src/pages/Routines.tsx` — create/edit recurring routines linking multiple stops from saved_locations or map pinpoints, with departure/return time windows, active days, transit/micro-environment modes
  - [x] "Check Routine AQI" button per routine card → concurrent live `/api/aqi` fetches across all stops (`Promise.all` + `fetchStopAqi`)
  - [x] Side-by-side NAQI & US AQI comparison per stop + deterministic actionable tips (safer departure timing, N95/purifier reminders, cleaner transit alternatives)
- [x] **4.3 — Deterministic Personal Exposure Score Engine**
  - [x] `frontend/src/lib/exposure.ts` — transparent 0–100 daily Personal Exposure Score + inhaled dose breakdown (live per-stop NAQI × duration in hours × transit/indoor attenuation × active profile's age + health sensitivity weights; null-NAQI stops excluded, NO station index averaging per PRD guardrail)
  - [x] Score card + segment breakdown displayed on Dashboard (single-stop model for viewed location) and Routines (full routine) pages
- [x] Replace `/lifestyle` & `/routines` self-Navigate placeholder routes in `App.tsx` with the real pages (awareness/history nav links now fall through to the catch-all redirect; `ProfilesProvider` wired around all protected routes)
- [x] `npm run build` in `frontend/` passes with zero TypeScript errors (`tsc -b` clean)
- [x] **⚠️ Manual DB step before verification**: Run the one-shot sections 6 & 8 of `worker/supabase_schema.sql` in the Supabase SQL editor (`lifestyle_profiles` table + RLS, plus the `commute_routines`/`daily_routine_segments` Phase 4 column extensions incl. `created_at`). These are `IF NOT EXISTS`/`ADD COLUMN IF NOT EXISTS` one-shot migrations, not part of the initial schema.
- [x] Routines load-error safeguard: failed Supabase fetches surface a visible red alert with `error.message` instead of silently showing "No routines yet"
- [x] All Phase 4 changes committed (`6a518c4`); Phase 4 verified by user ✅
- [x] **Phase 4 Exit Gate**: Multi-profile CRUD, routine AQI comparison, and Exposure Score calculation verified in browser ✅

Superseded checklist items (kept for traceability):
- [ ] multi-profile `lifestyle_profiles` — multiple household/family profiles per login with age, lifestyle, health conditions, home base (rolled up into 4.1)
- [ ] Routine AQI comparison UI (side-by-side pollutant grid) (rolled up into 4.2)
- [ ] Personal Exposure Score 0–100 (rolled up into 4.3)

### Phase 5: Hybrid Rule + Workers AI Routine Tips Engine
- [x] **5.1 — `POST /api/advice` Worker endpoint** (`worker/src/lib/advice.ts` + route in `worker/src/index.ts`)
  - [x] Deterministic CPCB NAQI + profile-sensitivity rule engine (rules R1–R8: data-availability, category actions, rush-hour departure, transit swaps, N95, HEPA purifier, sensitive-group flags, exposure-band framing)
  - [x] Cloudflare Workers AI layer (`env.AI`, `@cf/meta/llama-3.1-8b-instruct`, raw mode, 30s `Promise.race` timeout) that rephrases/contextualises the deterministic result; output schema-validated (strict JSON, kind whitelist, ≤4 tips) — any unbound/timeout/unparsable failure degrades to `source: "rules-fallback"` with `ai_error` set
  - [x] CORS extended to `GET, POST`; `wrangler.toml` already had `[ai] binding = "AI"`
  - [x] `npx tsc --noEmit` in `worker/` zero errors; `npm run build` in `frontend/` clean ✅
- [ ] Advice card in Routines.tsx calling `/api/advice` + auto-save check snapshots
- [ ] AQI Awareness & Health Guide page
- [ ] History & My Impact Calculator page
- [ ] **Phase 5 Exit Gate**: Verify hybrid AI precautions and fallback robustness

### Phase 6: Public Homepage + Profile Builder + Motion Polish
- [ ] **Public Homepage** (foggy nature hero, title, short intro, Log In / Sign Up): Deep Pine `#1E2E24`, Misty Alabaster `#F4F6F3`, Sage `#E6ECE7`, Warm Dawn `#C89666`
- [ ] **Initial Profile Builder Wizard** post-signup: age, lifestyle, health conditions, home base selection
- [ ] **`emil-design-eng` motion polish**: component press/hover states, popover origins, tooltip timing, transitions vs keyframes
- [ ] State-machine / break edge-case checks (reduced motion, screen-size, auth state)
- [ ] **Phase 6 Exit Gate**: Verify polish, motion, and edge-case robustness

### Phase 7: Production Security Audit + Cloudflare Workers + Pages Deployment
- [ ] **Production security audit**: RLS policies, auth token validation, secrets handling (never hardcode API keys, never commit `.env` or `.dev.vars`)
- [ ] Deploy Cloudflare Worker (`npx wrangler deploy`)
- [ ] Build & deploy frontend to Cloudflare Pages (`npx wrangler pages deploy`)
- [ ] End-to-end smoke test on live production URLs
- [ ] Final `PROGRESS.md` & `CLAUDE.md` update
- [ ] **Phase 7 Exit Gate**: Final verification and user sign-off

---

## Architectural & Deployment Notes
- **Supabase Database**: Schema defined in [`supabase_schema.sql`](worker/supabase_schema.sql) covering all 6 personal tables with Row Level Security (`auth.uid() = user_id`) and auto-updating `updated_at` triggers. Database: `https://ryzztiyjunbgwwkryovi.supabase.co`
- **Cloudflare Worker**: Configured in [`wrangler.toml`](worker/wrangler.toml) with AI binding (`[ai] binding = "AI"`). Health endpoint at `http://localhost:8787/api/health`. Worker deployed locally for dev.
- **Frontend**: Vite + React + TypeScript + Tailwind CSS v4 + `lucide-react`. Dev server at `http://localhost:5173`.
- **Design System**: Foggy Nature & Frosted Glass palette — Deep Pine `#1E2E24`/`#2D3E33`, Misty Alabaster `#F4F6F3`, Sage `#E6ECE7`, Warm Dawn `#C89666`; CPCB NAQI semantic colors strictly for AQI pills/station indicators; frosted glass cards `bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-[0_8px_30px_rgb(30,46,36,0.06)]`; Playfair Display italic accents + Plus Jakarta Sans (tabular-nums for AQI figures); misty mountain/canopy backdrop with soft drifting cloud/fog overlays `pointer-events-none` + `prefers-reduced-motion` guard for public landing + split-card Login/Signup.
- **Google Fonts**: `Playfair Display` + `Plus Jakarta Sans` linked in `frontend/index.html`.

---

## Phase 1 Exit Gate — Action Items
To pass Phase 1, please:
1. In your Supabase dashboard SQL Editor, run the `supabase_schema.sql` content to create all 6 tables with RLS policies.
2. Create two test user accounts (Email/Password) and verify they can each log in/log out.
3. Confirm User A cannot read User B's rows in any of the 6 tables (test RLS by querying as different auth users).
4. Update `PROGRESS.md` before finishing this response so a new session can resume immediately.

---

## Phase 2 Exit Gate — Verification Checklist
The following have been implemented and committed (86cbec5):

1. **Endpoints**: `/api/health` and `/api/aqi?lat=&lng=` with CORS headers.
2. **Adapters**: CPCB (data.gov.in) + OpenAQ fallback with graceful error handling.
3. **NAQI calculator**: Indian National AQI per CPCB breakpoints — no averaging across stations, no zero-substitution.
4. **Reliability model**: Measured / Estimated / Unavailable with >2h staleness detection.
5. **Caching**: Cloudflare edge cache with 30 min TTL via `caches.default`.
6. **Type safety**: `tsc --noEmit` clean; frontend build passes.
7. **Graphify**: Pending (blocked by missing `anthropic` Python package — install via `pip install anthropic` or `uv tool install "graphifyy[anthropic]"`).

To verify:
```bash
# Local dev
npx wrangler dev   # http://localhost:8787/api/health

# Test AQI endpoint
curl "http://localhost:8787/api/aqi?lat=12.9716&lng=77.5946"
```

After passing Phase 2, update PROGRESS.md and proceed to Phase 3.