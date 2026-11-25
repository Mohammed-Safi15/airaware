# AirAware - Progress Tracker

**Current Phase**: Phase 1 (Authentication & Secure Database Foundation)  
**Exact Next Step**: Supabase tables & RLS verification via SQL. Then test Phase 1 Exit Gate with two test user accounts.

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

### [ ] Phase 2: Air Quality API Integration, Caching & Graphify Setup
- [ ] CPCB (`data.gov.in`) & OpenAQ API adapter implementation in Worker
- [ ] Cloudflare Workers Cache API implementation (`caches.default`)
- [ ] Station matching logic (nearest station calculation using Haversine formula)
- [ ] Enable Graphify (`graphifyy`) for codebase mapping (`graphify-out/`)
- [ ] **Phase 2 Exit Gate**: Verify live AQI data retrieval and caching

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