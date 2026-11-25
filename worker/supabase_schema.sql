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
    location_type TEXT NOT NULL CHECK (location_type IN ('Home', 'Office', 'College', 'Other')),
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


-- 6. ENVIRONMENTAL ACTIONS TABLE
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
