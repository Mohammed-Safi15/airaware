# AirAware - Progress Tracker

**Current Phase**: Phase 1 (Authentication & Secure Database Foundation)  
**Exact Next Step**: Verify Supabase schema SQL application and test worker `/api/health` endpoint.

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
- [x] **Phase 0 Exit Gate**: Verified with user ✅

### [~] Phase 1: Authentication & Secure Database Foundation
- [x] Write Supabase SQL migration script for all 6 tables (`profiles`, `saved_locations`, `commute_routines`, `daily_routine_segments`, `household_preferences`, `environmental_actions`) with strict RLS policies (`supabase_schema.sql`) ✅
- [x] Scaffold Cloudflare Worker project structure (`worker/package.json`, `wrangler.toml`, `tsconfig.json`) ✅
- [x] Implement initial Cloudflare Worker server skeleton with `/api/health` endpoint and CORS middleware (`src/index.ts`) ✅
- [ ] **Phase 1 Exit Gate**: Verify Supabase tables in Supabase dashboard and test Cloudflare Worker local development server.

### [ ] Phase 2: Air Quality API Integration, Caching & Graphify Setup
- [ ] CPCB (`data.gov.in`) & OpenAQ API adapter implementation in Worker
- [ ] Cloudflare Workers Cache API implementation (`caches.default`)
- [ ] Station matching logic (nearest station calculation using Haversine formula)
- [ ] Enable Graphify (`graphifyy`) for codebase mapping (`graphify-out/`)
- [ ] **Phase 2 Exit Gate**: Verify live AQI data retrieval and caching

### [ ] Phase 3: Frontend Scaffolding, Tailwind & Routing
- [ ] Frontend setup (Vite + React + TypeScript + Tailwind CSS + `lucide-react`)
- [ ] Routing & layout components (Navbar, Bottom Nav, Protected Routes)
- [ ] Authentication pages (Login, Signup, Onboarding flow)
- [ ] **Phase 3 Exit Gate**: Verify auth routing and UI shell

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
- **Supabase Database**: Schema defined in [supabase_schema.sql](worker/supabase_schema.sql) covering all 6 personal tables with Row Level Security (`auth.uid() = user_id`) and auto-updating `updated_at` triggers.
- **Cloudflare Worker**: Configured in [wrangler.toml](worker/wrangler.toml) with AI binding (`[ai] binding = "AI"`).
