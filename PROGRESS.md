# AirAware - Progress Tracker

**Current Phase**: Phase 0 (Initialization & Setup)  
**Exact Next Step**: Initialize git repository, link remote `origin`, create `.env.example`, `.dev.vars.example`, `CLAUDE.md`, and complete Phase 0 Exit Gate.

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
- [x] Create `.gitignore`
- [ ] Create `PROGRESS.md` & `CLAUDE.md`
- [ ] Create `.env.example` & `.dev.vars.example`
- [ ] Initialize git, link remote `origin`, create initial commit & push
- [ ] **Phase 0 Exit Gate**: Verify setup with user

### [ ] Phase 1: Database Schema, Supabase Auth & Cloudflare Worker Foundation
- [ ] Supabase SQL schema setup (profiles, locations, exposures, routines, recommendations, historical logs) with RLS policies
- [ ] Cloudflare Worker project initialization (`wrangler.toml`, TypeScript setup, CORS, error handling middleware)
- [ ] Supabase auth client integration & middleware
- [ ] **Phase 1 Exit Gate**: Verify auth flow and DB tables

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

### [ ] Phase 6: Polish, Sustainability Tracker & Accessibility
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
- *To be populated as phases progress (deployed URLs, table IDs, etc.).*
