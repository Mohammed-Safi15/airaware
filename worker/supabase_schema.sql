-- ============================================================================
-- AirAware Supabase PostgreSQL Schema & RLS Policies (Phase 1)
-- ============================================================================
-- Enforces strict Row Level Security (RLS) across all personal tables.
-- ============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    lifestyle TEXT NOT NULL CHECK (lifestyle IN ('Student', 'Working Professional', 'Home-Stayer', 'Outdoor Worker', 'Other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);


-- 2. SAVED LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_type TEXT NOT NULL CHECK (location_type IN ('Home', 'Work', 'College', 'Gym', 'Other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved_locations" ON public.saved_locations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved_locations" ON public.saved_locations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved_locations" ON public.saved_locations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved_locations" ON public.saved_locations
    FOR DELETE USING (auth.uid() = user_id);


-- 3. COMMUTE ROUTINES TABLE
CREATE TABLE IF NOT EXISTS public.commute_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    origin_location_id UUID REFERENCES public.saved_locations(id) ON DELETE SET NULL,
    destination_location_id UUID REFERENCES public.saved_locations(id) ON DELETE SET NULL,
    transport_mode TEXT NOT NULL CHECK (transport_mode IN ('Metro', 'Bus', 'Private Vehicle', 'Walking', 'Auto / Taxi', 'Cycle')),
    commute_duration_minutes INT NOT NULL CHECK (commute_duration_minutes > 0),
    commute_frequency TEXT NOT NULL CHECK (commute_frequency IN ('Daily', 'Weekly', 'Occasional'))
);

ALTER TABLE public.commute_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commute_routines" ON public.commute_routines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commute_routines" ON public.commute_routines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commute_routines" ON public.commute_routines
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own commute_routines" ON public.commute_routines
    FOR DELETE USING (auth.uid() = user_id);


-- 4. DAILY ROUTINE SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS public.daily_routine_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.saved_locations(id) ON DELETE SET NULL,
    environment_type TEXT NOT NULL CHECK (environment_type IN ('Indoor', 'Outdoor', 'Roadside', 'Metro', 'Vehicle', 'Other')),
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    sequence_order INT NOT NULL
);

ALTER TABLE public.daily_routine_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily_routine_segments" ON public.daily_routine_segments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily_routine_segments" ON public.daily_routine_segments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_routine_segments" ON public.daily_routine_segments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_routine_segments" ON public.daily_routine_segments
    FOR DELETE USING (auth.uid() = user_id);


-- 5. HOUSEHOLD PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.household_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    children_present BOOLEAN NOT NULL DEFAULT FALSE,
    elderly_present BOOLEAN NOT NULL DEFAULT FALSE,
    indoor_pets BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.household_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own household_preferences" ON public.household_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own household_preferences" ON public.household_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own household_preferences" ON public.household_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own household_preferences" ON public.household_preferences
    FOR DELETE USING (auth.uid() = user_id);


-- 6. LIFESTYLE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.lifestyle_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INT NOT NULL,
    lifestyle TEXT NOT NULL,
    health_conditions TEXT[] NOT NULL DEFAULT '{}',
    home_location_id UUID REFERENCES public.saved_locations(id) ON DELETE SET NULL,
    has_air_purifier BOOLEAN NOT NULL DEFAULT FALSE,
    uses_n95_mask BOOLEAN NOT NULL DEFAULT FALSE,
    ventilates_windows BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lifestyle_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lifestyle_profiles" ON public.lifestyle_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lifestyle_profiles" ON public.lifestyle_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lifestyle_profiles" ON public.lifestyle_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lifestyle_profiles" ON public.lifestyle_profiles
    FOR DELETE USING (auth.uid() = user_id);


-- 7. ENVIRONMENTAL ACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.environmental_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('Public Transit', 'Car Trip Avoided', 'Energy Saving', 'No Open Burning')),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    estimated_co2_saved NUMERIC NOT NULL CHECK (estimated_co2_saved >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.environmental_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own environmental_actions" ON public.environmental_actions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own environmental_actions" ON public.environmental_actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own environmental_actions" ON public.environmental_actions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own environmental_actions" ON public.environmental_actions
    FOR DELETE USING (auth.uid() = user_id);


-- 7. AUTO-UPDATE TIMESTAMP TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to profiles
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Apply timestamp trigger to household_preferences
CREATE TRIGGER set_household_preferences_updated_at
    BEFORE UPDATE ON public.household_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Apply timestamp trigger to lifestyle_profiles
DROP TRIGGER IF EXISTS set_lifestyle_profiles_updated_at ON public.lifestyle_profiles;
CREATE TRIGGER set_lifestyle_profiles_updated_at
    BEFORE UPDATE ON public.lifestyle_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- 8. PHASE 4 EXTENSIONS — Multi-Stop Routines, Time Windows & Active Days
-- ============================================================================
-- Extends the existing commute_routines / daily_routine_segments tables so a
-- routine can be a named, recurring, multi-stop path with departure/return
-- windows, active days, and the new micro-environment/transit taxonomy.
--
-- Legacy columns (transport_mode, commute_frequency, commute_duration_minutes)
-- are relaxed to nullable and their CHECKs are dropped, so new routines are
-- not forced to pick legacy values. This block is a one-shot migration
-- (run in the Supabase SQL editor) — plain ADD CONSTRAINT / DROP NOT NULL
-- statements are not re-runnable, same as the CREATE POLICY statements above.

ALTER TABLE public.commute_routines ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.commute_routines ADD COLUMN IF NOT EXISTS transit_mode TEXT;
ALTER TABLE public.commute_routines ADD COLUMN IF NOT EXISTS departure_time TEXT;
ALTER TABLE public.commute_routines ADD COLUMN IF NOT EXISTS return_time TEXT;
ALTER TABLE public.commute_routines ADD COLUMN IF NOT EXISTS active_days TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.commute_routines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.commute_routines ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.commute_routines ALTER COLUMN transport_mode DROP NOT NULL;
ALTER TABLE public.commute_routines ALTER COLUMN commute_frequency DROP NOT NULL;
ALTER TABLE public.commute_routines ALTER COLUMN commute_duration_minutes DROP NOT NULL;

ALTER TABLE public.commute_routines DROP CONSTRAINT IF EXISTS commute_routines_transport_mode_check;
ALTER TABLE public.commute_routines DROP CONSTRAINT IF EXISTS commute_routines_commute_frequency_check;
ALTER TABLE public.commute_routines ADD CONSTRAINT commute_routines_transit_mode_check
    CHECK (transit_mode IN ('walk', 'two_wheeler', 'auto_non_ac', 'car_ac', 'metro_bus', 'indoor_purifier', 'indoor_natural'));

-- Link routine segments to their routine and allow free map pinpoints
ALTER TABLE public.daily_routine_segments ADD COLUMN IF NOT EXISTS routine_id UUID;
ALTER TABLE public.daily_routine_segments ADD CONSTRAINT daily_routine_segments_routine_id_fkey
    FOREIGN KEY (routine_id) REFERENCES public.commute_routines(id) ON DELETE CASCADE;
ALTER TABLE public.daily_routine_segments ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.daily_routine_segments ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.daily_routine_segments DROP CONSTRAINT IF EXISTS daily_routine_segments_environment_type_check;
ALTER TABLE public.daily_routine_segments ADD CONSTRAINT daily_routine_segments_environment_type_check
    CHECK (environment_type IN ('Indoor', 'Outdoor', 'Roadside', 'Metro', 'Vehicle', 'Other',
                                'walk', 'two_wheeler', 'auto_non_ac', 'car_ac', 'metro_bus', 'indoor_purifier', 'indoor_natural'));

DROP TRIGGER IF EXISTS set_commute_routines_updated_at ON public.commute_routines;
CREATE TRIGGER set_commute_routines_updated_at
    BEFORE UPDATE ON public.commute_routines
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- 9. PHASE 5C EXTENSIONS — Exposure Check Snapshots & Protective Actions
-- ============================================================================
-- One-shot migration (run in the Supabase SQL editor). Backs the Phase 5C
-- "History & My Impact" page:
--   • exposure_check_snapshots — a saved "Check Routine AQI" run (exposure
--     score, total inhaled dose, per-stop NAQI summary) attributed to the
--     active lifestyle profile
--   • environmental_actions gains profile attribution, protective-action
--     types, duration/frequency inputs, and a PM2.5 dose-avoided column so
--     the My Impact Calculator can aggregate personal impact totals.

-- 9a. Exposure check snapshots table
CREATE TABLE IF NOT EXISTS public.exposure_check_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.lifestyle_profiles(id) ON DELETE SET NULL,
    routine_id UUID REFERENCES public.commute_routines(id) ON DELETE SET NULL,
    routine_name TEXT NOT NULL DEFAULT '',
    exposure_score INT NOT NULL DEFAULT 0 CHECK (exposure_score >= 0 AND exposure_score <= 100),
    total_dose NUMERIC NOT NULL DEFAULT 0 CHECK (total_dose >= 0),
    stop_naqi_summary JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.exposure_check_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exposure_check_snapshots" ON public.exposure_check_snapshots
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exposure_check_snapshots" ON public.exposure_check_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exposure_check_snapshots" ON public.exposure_check_snapshots
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exposure_check_snapshots" ON public.exposure_check_snapshots
    FOR DELETE USING (auth.uid() = user_id);

-- 9b. environmental_actions — profile attribution & protective actions
ALTER TABLE public.environmental_actions ADD COLUMN IF NOT EXISTS profile_id UUID;
ALTER TABLE public.environmental_actions ADD CONSTRAINT environmental_actions_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES public.lifestyle_profiles(id) ON DELETE SET NULL;

-- Widen the action_type CHECK to include the protective-action logger types.
ALTER TABLE public.environmental_actions DROP CONSTRAINT IF EXISTS environmental_actions_action_type_check;
ALTER TABLE public.environmental_actions ADD CONSTRAINT environmental_actions_action_type_check
    CHECK (action_type IN ('Public Transit', 'Car Trip Avoided', 'Energy Saving', 'No Open Burning',
                           'N95 Mask', 'HEPA Purifier', 'Rescheduled Outdoor Activity',
                           'Sealed Transit (Metro/AC)'));

ALTER TABLE public.environmental_actions ADD COLUMN IF NOT EXISTS duration_hours NUMERIC CHECK (duration_hours >= 0);
ALTER TABLE public.environmental_actions ADD COLUMN IF NOT EXISTS frequency_days INT CHECK (frequency_days > 0);
ALTER TABLE public.environmental_actions ADD COLUMN IF NOT EXISTS pm25_dose_avoided NUMERIC CHECK (pm25_dose_avoided >= 0);
