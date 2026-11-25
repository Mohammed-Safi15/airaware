

PRODUCT REQUIREMENTS DOCUMENT 
AirAware: Personalised Air-Quality & Exposure Assistant
Connecting live Indian air-quality observations with individual locations, commutes, and daily routines.



Attribute

Specification

Working Product Name

AirAware

Product Type & Platform

Responsive Web Application (Desktop & Mobile Web)

Initial Target Market

Bengaluru, India (Indian National AQI Standard)



Primary Objective

Help individuals understand how current air pollution affects their daily lives and make informed, routine-specific decisions to reduce personal exposure.

1. THE PROBLEM & PRODUCT PHILOSOPHY
Conventional air pollution apps display city-wide or single-station AQI numbers. While those figures describe ambient outdoor conditions, they fail to explain how pollution impacts an individual's specific daily routine. Two residents living in Bengaluru can experience drastically different pollution exposure on the exact same day:


User Archetype

Daily Environment Pattern

Gap in Conventional AQI Apps

Working Professional

Commutes via metro, bus, or private vehicle; spends time near congested junctions and transit stations; transitions across multiple micro-environments.

Receives generic city alerts that ignore commute segments, station proximity, and office vs. home differences.

Student

Travels between home, college campus, and outdoor sports/study venues on variable schedules.

Lacks campus-specific air readings and actionable timing advice for outdoor sports or walks.

Home-Stayer

Spends most of the day indoors; exposed to cooking emissions, indoor dust, poor ventilation, and outdoor pollution infiltration.

Outdoor station AQI is wrongly treated as indoor air quality without practical indoor mitigation steps.

Outdoor Worker

Works outdoors for extended hours; faces prolonged exposure to traffic exhaust, construction dust, and particulate matter.

Gets one-size-fits-all advice rather than sustained-exposure precautions and break-timing guidance.

The Core Problem & Proposed Solution
Core Problem: People lack an accessible, trustworthy application that connects live local air-quality measurements with their personal locations, daily commutes, and encountered environments.
Proposed Solution: AirAware acts as a personalised air-quality assistant that:
Retrieves live air-quality observations from official and supplementary monitoring stations.
Captures the user's lifestyle, saved locations (via autocomplete, map pin-drop, or GPS), and daily routine.
Maps the distinct environments encountered across the user's day and classifies data reliability.
Applies deterministic public-health rules enhanced by a generative AI contextualisation layer to deliver tailored precautions.
Encourages sustainable everyday choices and tracks estimated environmental benefits.


CORE PRODUCT PHILOSOPHY
"Don't just tell people how polluted their city is. Help them understand what that pollution means for their everyday lives."

2. MUST-HAVE FEATURES (MVP V1 SCOPE)
The following eight feature modules define the V1 release. Features outside this list are deferred until core reliability is proven.
2.1 Live Air Quality Monitoring
Displays current air-quality readings for the user's active location and all saved locations.
Metrics Displayed: Current AQI value & Indian National AQI category, PM2.5, PM10, and NO2, SO2, CO, O3 concentrations (where available).
Attribution & Provenance: Nearest monitoring station name, straight-line distance (km) from the selected location, actual measurement timestamp, and data source.
Data Sources: Prioritise official Indian monitoring data from CPCB / data.gov.in; use OpenAQ as a supplementary source for coverage gaps.
Data Integrity Rules: Retrieve current observations rather than historical averages. Explicitly distinguish data retrieval/refresh time from the station's actual measurement timestamp. Flag stale, missing, or unavailable readings—never substitute missing values with zero or fabricated numbers.
2.2 Personal User Profiles
Users create accounts and maintain editable lifestyle and routine profiles:
Lifestyle Categories: Student, Working Professional, Home-Stayer, Outdoor Worker, or Other.
Profile Fields: Display name, lifestyle category, saved locations, preferred transport mode, typical commute duration, work/study schedule, and optional household considerations (children, elderly members, indoor pets).
2.3 Location Management (Onboarding & Dedicated 'My Locations')
Users configure initial locations during onboarding and manage them anytime through a dedicated My Locations screen in the dashboard:
Autocomplete Search: Search addresses/places using live autocomplete.
Interactive Map & Pin-Drop: Browse an interactive map (Leaflet + OpenStreetMap) and drop/drag a pin to specify exact coordinates.
Current GPS Location: Capture current GPS coordinates on explicit user permission (no background tracking).
Multi-Location CRUD: Save multiple locations under one account with labels such as Home, Office, College, and Other; edit or delete any saved location whenever routines change.
Per-Location Station Binding: Automatically resolve the nearest available monitoring station for each saved location and display station distance, data source, and measurement timestamp.
2.4 My Daily Exposure
AirAware's central differentiating module evaluates the sequence of micro-environments encountered across a user's day rather than relying on a single static coordinate:


Daily Segment

Typical Duration

Environment Type

Data Classification Rule

Home

8 hours

Indoor

Estimated / Indoor guidance (Outdoor AQI not treated as indoor AQI)

Walking to Metro

15 minutes

Outdoor

Nearest station measurement + distance disclosure

Metro Platform

10 minutes

Transport

Nearest station / Estimated ambient context

Metro Journey

35 minutes

Transport

Unavailable (No direct train interior sensor data)

Office / College

8 hours

Indoor

Estimated / Indoor guidance (Outdoor station tagged separately)

Lunch / Outdoor Break

30 minutes

Outdoor / Indoor

Nearest station measurement for workplace/campus location

Transparency Badges: Every segment must display a clear reliability badge: Directly Measured, Estimated Exposure, or Unavailable.
Calculation Discipline: Never present outdoor station readings as direct metro interior or indoor readings. Never simply average AQI index values across locations; perform exposure calculations using underlying pollutant concentrations (e.g., PM2.5/PM10 µg/m³) with disclosed assumptions.
2.5 Personalised Recommendations (Hybrid AI-Powered Personalisation Engine)
AirAware uses a hybrid architecture where deterministic public-health rules serve as the safety and decision authority, and generative AI serves strictly as the contextualisation and communication layer.
Step 1 — Retrieve: Retrieve current air-quality measurements for the user's saved and active locations.
Step 2 — Validate: Validate data completeness, units, and measurement timestamps (flagging stale/missing parameters).
Step 3 — Evaluate Deterministic Rules: Apply predefined, deterministic environmental and public-health rules (Indian NAQI thresholds and pollutant triggers).
Step 4 — Match Routine Context: Identify applicable precautions based on the user's lifestyle, commute mode, routine segments, and household preferences.
Step 5 — Pass to Generative AI: Pass the validated environmental readings and triggered rule-based precautions to a generative AI model.
Step 6 — Generate Contextual Guidance: Generate clear, empathetic, routine-specific explanations and practical action steps.
Step 7 — Guardrail Verification: Verify that the AI output does not contradict predefined health rules, invent station readings, or omit disclaimers.
Step 8 — Transparent Display: Render each recommendation with transparent provenance: (1) What action is suggested, (2) Why it is suggested, and (3) Which specific measurement or profile preference triggered it.
Mandatory Fallback Rule: If the generative AI API is unavailable, times out, hits rate limits, or fails guardrail validation, the system must immediately display the deterministic rule-based recommendations without error screens.
2.6 Indoor Air Assistant
Actionable Guidance: Provides practical household actions: smart ventilation timing (opening windows only when outdoor air improves), wet mopping and dust control, avoiding indoor smoking/incense/open burning, using kitchen exhausts while cooking, and understanding HEPA air purifier operation and filter maintenance.
Indoor Sensor Disclosure: Explicitly informs users that outdoor monitoring stations do not measure actual indoor air quality. True indoor AQI is displayed only if a compatible indoor air sensor is connected.
2.7 Sustainable Daily Choices
Encourages low-emission habits (public transit, trip chaining, avoiding private car trips, preventing open waste burning, household energy conservation) while explicitly distinguishing between reducing personal exposure and reducing environmental emissions (e.g., taking a bus/metro lowers per-capita emissions even if roadside walking segments still involve ambient pollution exposure).
2.8 Environmental Impact Calculator
Tracks user-logged sustainable actions and estimates CO2 emissions avoided (kg), fuel saved (litres), private vehicle trips avoided, and energy savings using documented emission factors. Includes a clear disclaimer that individual actions contribute to collective sustainability but do not measurably alter city-wide AQI readings.
3. TARGET USERS
Primary Users: Working Professionals (commute exposure & multi-location tracking), Students (home-to-campus routines & outdoor sports timing), Home-Stayers (indoor air quality & ventilation windows), and Outdoor Workers (prolonged outdoor exposure awareness & practical protection).
Secondary Users: Families and households tracking conditions for sensitive groups (children, elderly family members, indoor pets) via optional profile preferences.
4. SCREENS & USER FLOWS


Screen

Purpose

Core UI Components & Flow

1. Landing Page

Introduce AirAware & authenticate users

Logo, value proposition ('Understand how air pollution affects your daily life'), Sign Up & Login CTAs → Auth / Onboarding.

2. Registration & Onboarding

Account creation & baseline profile + location setup

Supabase Auth (Email/Password + Google OAuth) → Step 1: Lifestyle → Step 2: Initial Locations (Autocomplete, Map Pin-Drop, GPS) → Step 3: Routine & Commute → Step 4: Optional Household Preferences → Dashboard.

3. Home Dashboard

At-a-glance live conditions & daily precautions

Active location AQI/category, PM2.5/PM10/gases, station name/distance/freshness, Hybrid AI personalised summary, Quick Nav cards.

4. My Locations

Dedicated multi-location & station manager

Interactive Leaflet + OSM map with pin-drop, autocomplete search bar, GPS button, saved location cards (Home/Office/College/Other) with edit/delete, nearest station & live reading per location.

5. My Daily Exposure

Visualise exposure across daily environments

Ordered routine timeline (Home → Roadside → Metro → Office → Home), segment durations, Measured/Estimated/Unavailable badges, routine editor.

6. Recommendations & Indoor Air

Actionable hybrid AI advice & indoor practices

Triggered action cards (What / Why / Triggering Data) + Indoor Air Assistant (ventilation, cooking exhaust, dust, HEPA filter guide).

7. My Impact

Log sustainable habits & view avoided emissions

Quick action logger, cumulative CO2 avoided (kg), fuel saved, trips avoided, and action history log.

5. TECH STACK & SYSTEM ARCHITECTURE


Layer

Technology Choice

Role & Architectural Responsibility

Frontend Framework

React.js + Vite

Fast, modular single-page responsive web application

UI Styling

Tailwind CSS

Mobile-first responsive layout, badges, and accessible dashboards

Backend / API Proxy

Cloudflare Workers

API orchestration, response caching, deterministic rule engine, and AI prompt/guardrail execution

Frontend Hosting

Cloudflare Pages

Zero-cost static asset hosting with global CDN and GitHub CI/CD

Authentication

Supabase Auth

Email/password and Google OAuth user authentication

Database & Security

Supabase PostgreSQL + RLS

Relational storage for user profiles, locations, routines, and actions with Row Level Security

Primary AQ Data

CPCB / data.gov.in

Official Indian monitoring station pollutant observations

Supplementary AQ Data

OpenAQ API

Fallback and supplementary station coverage

Maps & Geocoding

Leaflet + OpenStreetMap + Geocoder

Interactive map, draggable pin-drop, and place autocomplete search

Geolocation

Browser Geolocation API

Permission-gated current coordinates capture

Hybrid Recommendation

Deterministic Rules + Generative AI API

Rule-based health engine paired with free-tier/low-cost LLM contextualisation and fallback



SYSTEM ARCHITECTURE DATA FLOW
React Frontend (Cloudflare Pages)
 ├──► Supabase Auth & Supabase PostgreSQL (RLS-Protected Personal User Data)
 └──► Cloudflare Workers (Serverless Backend Orchestrator)
       ├──► Air Quality Providers (CPCB / data.gov.in, OpenAQ) + Edge Cache
       ├──► Deterministic Rule Engine (Indian NAQI & Public-Health Thresholds)
       └──► Generative AI Layer (Contextual Personalisation + Output Guardrail + Rule Fallback)

Security & Caching Mandate: All API keys (data.gov.in, OpenAQ, Generative AI provider, and Supabase service-role keys) must reside exclusively in Cloudflare Worker environment secrets—never in frontend bundles.
6. DATABASE DESIGN (SUPABASE POSTGRESQL)
All six personal tables enforce Row Level Security (RLS) so authenticated users can only select, insert, update, and delete rows where user_id = auth.uid() (or id = auth.uid() on profiles).


Table Name

Key Columns & Types

Purpose

profiles

id (UUID PK -> auth.users.id), display_name (TEXT), lifestyle (TEXT), created_at, updated_at

Stores user identity and selected lifestyle archetype.

saved_locations

id (UUID PK), user_id (UUID FK), location_name (TEXT), latitude (DOUBLE PRECISION), longitude (DOUBLE PRECISION), location_type (TEXT), created_at

Stores multiple user-labeled coordinates (Home, Office, College, Other) from autocomplete, pin-drop, or GPS.

commute_routines

id (UUID PK), user_id (UUID FK), origin_location_id (FK), destination_location_id (FK), transport_mode (TEXT), commute_duration_minutes (INT), commute_frequency (TEXT)

Captures primary commute legs between saved locations.

daily_routine_segments

id (UUID PK), user_id (UUID FK), location_id (UUID FK nullable), environment_type (TEXT), duration_minutes (INT), sequence_order (INT)

Models ordered daily micro-environments (Indoor, Outdoor, Roadside, Metro, Vehicle, Other).

household_preferences

id (UUID PK), user_id (UUID FK), children_present (BOOL), elderly_present (BOOL), indoor_pets (BOOL), updated_at

Optional household sensitivity flags for tailored precautions.

environmental_actions

id (UUID PK), user_id (UUID FK), action_type (TEXT), quantity (NUMERIC), estimated_co2_saved (NUMERIC), created_at

Logs sustainable actions and calculated CO2 avoidance.

Shared Environmental Cache: Shared air-quality station readings are cached in Cloudflare Workers rather than duplicated per user row, keyed by station ID / rounded coordinate grid with a TTL (e.g., 15–30 minutes).
7. DATA RELIABILITY & SECURITY REQUIREMENTS
Three-State Reliability Model: Every reading must be tagged as Measured (valid recent station observation), Estimated (derived via documented formula with disclosed assumptions), or Unavailable (no reliable data). Never mask missing data as 0.
Freshness Validation: Compare station measurement timestamp against current UTC/IST time; flag observations older than threshold (e.g., > 2 hours) as Stale.
Privacy & Access Control: Supabase Auth session tokens, strict RLS policies, explicit browser permission prompt before GPS access, no background tracking, full location edit/delete controls, and one-click user account deletion.
8. PHASED MVP DEVELOPMENT ROADMAP
To ensure clean incremental progress and zero wasted effort, development is divided into eight structured phases (Phase 0 through Phase 7). Each phase specifies its goal, concrete deliverables, and an Exit Gate that must pass before advancing.
Phase 0: Prerequisites, Accounts & Project Scaffolding
Goal: Set up external developer accounts, API keys, local tooling, and the monorepo/project skeleton.
Prerequisites: None (Starting point).
Key Tasks & Deliverables: Initialize Git repository; scaffold React + Vite + Tailwind CSS frontend; scaffold Cloudflare Worker project (Wrangler); configure .env.example files; obtain Supabase project keys, data.gov.in / OpenAQ keys, and free-tier LLM API key.
Exit Gate (Verification): Local dev server runs cleanly on localhost; Cloudflare Worker responds to a /api/health ping; Supabase project is active.
Phase 1: Authentication & Secure Database Foundation
Goal: Implement user sign-up/login and deploy the relational PostgreSQL schema with strict Row Level Security.
Prerequisites: Phase 0 complete; Supabase project active.
Key Tasks & Deliverables: Write SQL migration scripts for all 6 tables (profiles, saved_locations, commute_routines, daily_routine_segments, household_preferences, environmental_actions); enable RLS policies on every table; implement Supabase Auth (Email/Password + Google OAuth) and protected React routes.
Exit Gate (Verification): Two test user accounts can register, log in, and log out; SQL verification confirms User A cannot read or modify User B's rows.
Phase 2: Live Air Quality Pipeline & Cloudflare Worker Proxy
Goal: Build the serverless data ingestion, nearest-station lookup, Indian NAQI calculator, and caching layer.
Prerequisites: Phase 0 complete; CPCB / OpenAQ API credentials configured as Worker secrets.
Key Tasks & Deliverables: Implement /api/aqi?lat=...&lng=... in Cloudflare Worker; fetch CPCB (data.gov.in) primary data and OpenAQ supplementary data; compute Haversine distance to find nearest station; calculate Indian NAQI sub-indices; separate measurement_time vs. fetched_at; classify Measured/Stale/Unavailable; cache responses at the edge.
Exit Gate (Verification): Querying Bengaluru coordinates (e.g., Basavanagudi, Indiranagar, Whitefield) returns verified station JSON with exact distance, freshness flag, and zero exposed API keys in browser network tab.
Phase 3: Interactive Location Management & User Onboarding
Goal: Enable users to search, pin-drop, GPS-locate, label, edit, and delete multiple locations during onboarding and in My Locations.
Prerequisites: Phases 1 & 2 complete.
Key Tasks & Deliverables: Build 4-step Onboarding Wizard (Lifestyle → Initial Locations → Routine → Household Preferences); build dedicated 'My Locations' screen with Leaflet + OpenStreetMap, draggable pin-drop, place autocomplete search, Browser Geolocation GPS button, location CRUD (Home/Office/College/Other), and per-location live station cards.
Exit Gate (Verification): A user can add 3+ Bengaluru locations via autocomplete, map pin-drop, and GPS, reload the page, edit/delete a location, and view each location's nearest station AQI.
Phase 4: Daily Exposure Timeline & Routine Engine
Goal: Build the My Daily Exposure module modeling sequential micro-environments across the user's day.
Prerequisites: Phase 3 complete.
Key Tasks & Deliverables: Build 'My Daily Exposure' timeline UI (Home → Roadside → Metro → Office → Home); wire CRUD for commute_routines and daily_routine_segments; map outdoor segments to nearest saved-location station data; tag indoor/metro segments explicitly with Estimated/Unavailable badges and assumption disclosures.
Exit Gate (Verification): Changing routine durations or saved locations dynamically updates the daily exposure timeline and displays accurate Measured/Estimated/Unavailable badges without averaging AQI across stations.
Phase 5: Hybrid AI Recommendation Engine & Indoor Air Assistant
Goal: Combine deterministic public-health rules with generative AI contextualisation and build the Indoor Air Assistant.
Prerequisites: Phases 2, 3 & 4 complete.
Key Tasks & Deliverables: Implement deterministic rule engine in Cloudflare Worker (Indian NAQI breakpoints + lifestyle/household rules); build /api/recommendations endpoint passing validated readings + triggered rules to generative AI; implement output guardrail check + automatic deterministic fallback; build Recommendations UI (What / Why / Triggering Data) and Indoor Air Assistant screen.
Exit Gate (Verification): Different lifestyles (Student vs. Outdoor Worker vs. Home-Stayer) receive tailored AI-contextualised advice tied to live station readings; disconnecting/invalidating the AI key seamlessly falls back to deterministic rules.
Phase 6: Sustainable Choices & Environmental Impact Tracker
Goal: Deliver the My Impact calculator and sustainable habit logging.
Prerequisites: Phase 1 complete.
Key Tasks & Deliverables: Build 'My Impact' screen; implement action logger (Public transport, Car trip avoided, Energy saving); compute CO2 avoided (kg), fuel saved (L), and trips avoided using documented emission factors; persist records to environmental_actions; display exposure vs. emission distinction notes.
Exit Gate (Verification): Logging a commute action updates cumulative CO2 and fuel metrics in PostgreSQL and persists across sessions.
Phase 7: End-to-End QA, Security Audit & Production Deployment
Goal: Validate edge cases, security policies, mobile responsiveness, and deploy to Cloudflare Pages & Workers.
Prerequisites: Phases 1–6 complete.
Key Tasks & Deliverables: Audit RLS policies and account deletion flow; test Bengaluru edge cases (missing pollutants, stale CPCB stations, OpenAQ fallback, GPS permission denied); verify mobile responsiveness; deploy Worker via Wrangler and Frontend via Cloudflare Pages.
Exit Gate (Verification): Production URL is live, passes all 11 V1 Success Criteria, and handles stale data and AI outages gracefully.
9. OUT OF SCOPE (V1 GUARDRAILS) & SUCCESS CRITERIA
Out of Scope for V1
Open-ended conversational AI chatbot (AI is scoped strictly to structured recommendation contextualisation), paid AI API tiers, multi-day AQI forecasting, historical AQI trend charts, metro interior sensor claims without hardware, social/community feeds, turn-by-turn pollution routing, wearables, and paid subscriptions.
V1 Success Criteria
Users can register, log in, log out, and delete their account via Supabase Auth.
Users can add, label, edit, and delete multiple locations during onboarding and in My Locations using autocomplete, interactive map pin-drop, or GPS, viewing each location's nearest station.
Users can configure their daily commute and multi-environment routine timeline.
Live air-quality readings display station distance, source, and distinct measurement vs. retrieval timestamps.
All environmental metrics clearly display Measured, Estimated, or Unavailable states.
Hybrid AI recommendations adapt to lifestyle/routine with transparent triggers and automatic rule-based fallback.
Indoor Air Assistant provides practical household guidance with clear outdoor-vs-indoor disclosures.
My Impact logs sustainable actions and calculates avoided CO2 and fuel using documented factors.
All personal data is strictly isolated via Supabase Row Level Security.
