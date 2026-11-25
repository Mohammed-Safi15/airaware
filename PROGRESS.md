# AirAware - Progress Tracker

**Current Phase**: Phase 2 (Air Quality API Integration, Caching & Graphify Setup)
**Exact Next Step**: Verify live Worker endpoints (/api/health, /api/aqi?lat=&lng=). Then proceed to Phase 3.

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
- **UI & Icons**: Tailwind CSS + `lucide-react`
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

### [ ] Phase 3: Frontend Scaffolding, Tailwind & Routing

### [ ] Phase 3: Frontend Scaffolding, Tailwind & Routing
- [ ] Auth pages (Login, Signup, Onboarding flow) — [x] — Completed in Phase 0
- [ ] Routing & layout components (Navbar, Bottom Nav, Protected Routes)
- [ ] **Phase 3 Exit Gate**: Verify UI shell and auth routing

### [ ] Phase 4: Core Feature Modules (Dashboard, Locations, Exposure, Recommendations)
- [ ] Dashboard & Live AQI Monitoring widget with provenance badges
- [ ] Location Management (Autocomplete search, Leaflet + OSM pin-drop map, GPS, CRUD)
- [ ] My Daily Exposure calculator (micro-environments & time-weighted exposure)
- [ ] Routine & Lifestyle Profile settings screen
- [ ] **Phase 4 Exit Gate**: Verify core screens and location binding

### [ ] Phase 5: Hybrid AI Contextualisation Engine & Precautions
- [ ] Deterministic Indian National AQI health rule engine in Cloudflare Worker
- [ ] Cloudflare Workers AI integration (`env.AI`) for contextual explanation
- [ ] Fallback mechanism (deterministic rules if AI fails/times out)
- [ ] AI Health Assistant & Recommendations UI widget
- [ ] **Phase 5 Exit Gate**: Verify hybrid AI precautions and fallback robustness

### [ ] Phase 6: Sustainability Tracker & Accessibility
- [ ] Sustainability & Exposure Reduction Tracker (tracking green commute choices & estimated health benefits)
- [ ] Offline resilience, loading skeletons, error boundaries, stale-data warnings
- [ ] Accessibility (ARIA labels, keyboard navigation, contrast audit)
- [ ] **Phase 6 Exit Gate**: Verify polish and accessibility

### [ ] Phase 7: Deployment, Verification & Final Handover
- [ ] Deploy Cloudflare Worker (`npx wrangler deploy`)
- [ ] Build & deploy frontend to Cloudflare Pages (`npx wrangler pages deploy`)
- [ ] End-to-end smoke test on live production URLs
- [ ] Final `PROGRESS.md` & `CLAUDE.md` update
- [ ] **Phase 7 Exit Gate**: Final verification and user sign-off

---

## Architectural & Deployment Notes
- **Supabase Database**: Schema defined in [supabase_schema.sql](worker/supabase_schema.sql) covering all 6 personal tables with Row Level Security (`auth.uid() = user_id`) and auto-updating `updated_at` triggers. Database: `https://ryzztiyjunbgwwkryovi.supabase.co`
- **Cloudflare Worker**: Configured in [wrangler.toml](worker/wrangler.toml) with AI binding (`[ai] binding = "AI"`). Health endpoint at `http://localhost:8787/api/health`. Worker deployed locally for dev.
- **Frontend**: Vite + React + TypeScript + Tailwind CSS + `lucide-react`. Dev server at `http://localhost:5173`.

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