import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Copy frontend/.env.example to frontend/.env and fill in your Supabase project values."
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const LIFESTYLES = [
  "Student",
  "Working Professional",
  "Home-Stayer",
  "Outdoor Worker",
  "Other",
] as const;

export const LOCATION_TYPES = ["Home", "Work", "College", "Gym", "Other"] as const;

export type Lifestyle = (typeof LIFESTYLES)[number];
export type LocationType = (typeof LOCATION_TYPES)[number];

export interface ProfileRow {
  id: string;
  display_name: string;
  lifestyle: Lifestyle;
  created_at: string;
  updated_at: string;
}

export interface SavedLocationRow {
  id: string;
  user_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  location_type: LocationType;
  created_at: string;
}

export interface LifestyleProfileRow {
  id: string;
  user_id: string;
  name: string;
  age: number;
  lifestyle: Lifestyle;
  health_conditions: string[];
  home_location_id: string | null;
  has_air_purifier: boolean;
  uses_n95_mask: boolean;
  ventilates_windows: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Phase 4.2 — Routines & multi-stop segments ────────────────────────────

export const TRANSIT_MODES = [
  "walk",
  "two_wheeler",
  "auto_non_ac",
  "car_ac",
  "metro_bus",
  "indoor_purifier",
  "indoor_natural",
] as const;
export type TransitMode = (typeof TRANSIT_MODES)[number];

export const ROUTINE_ENVIRONMENT_TYPES = [
  "Indoor",
  "Outdoor",
  "Roadside",
  "Metro",
  "Vehicle",
  "Other",
] as const;

export const ACTIVE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const TRANSIT_MODE_LABELS: Record<TransitMode, string> = {
  walk: "Walk",
  two_wheeler: "Two-Wheeler",
  auto_non_ac: "Auto / Taxi (no AC)",
  car_ac: "Car (AC)",
  metro_bus: "Metro / Bus",
  indoor_purifier: "Indoor + Purifier",
  indoor_natural: "Indoor (Natural)",
};

/** A routine stop as edited in the UI — either a saved location or a free map pinpoint. */
export interface RoutineStop {
  location_id: string | null;
  label: string;
  latitude: number | null;
  longitude: number | null;
  environment_type: (typeof ROUTINE_ENVIRONMENT_TYPES)[number];
  duration_minutes: number;
}

export interface RoutineRow {
  id: string;
  user_id: string;
  name: string;
  origin_location_id: string | null;
  destination_location_id: string | null;
  transport_mode: string | null;
  commute_duration_minutes: number | null;
  commute_frequency: string | null;
  transit_mode: TransitMode | null;
  departure_time: string | null;
  return_time: string | null;
  active_days: string[];
  created_at?: string;
  updated_at?: string;
}

export interface RoutineSegmentRow {
  id: string;
  user_id: string;
  routine_id: string;
  location_id: string | null;
  environment_type: string;
  duration_minutes: number;
  sequence_order: number;
  latitude: number | null;
  longitude: number | null;
}

// ── Phase 5C — exposure check snapshots & protective actions ──────────────

/** One stop's live NAQI/US AQI snapshot, persisted inside exposure_check_snapshots.stop_naqi_summary. */
export interface StopNaqiSummary {
  label: string;
  naqi: number | null;
  usAqi: number | null;
  reliability: string | null;
  hours: number;
  environment_type: string;
}

/** A saved "Check Routine AQI" run (exposure_check_snapshots table). */
export interface ExposureCheckSnapshotRow {
  id: string;
  user_id: string;
  profile_id: string | null;
  routine_id: string | null;
  routine_name: string;
  exposure_score: number;
  total_dose: number;
  stop_naqi_summary: StopNaqiSummary[];
  created_at: string;
}

/** An environmental / protective action log entry (environmental_actions table). */
export interface EnvironmentalActionRow {
  id: string;
  user_id: string;
  profile_id: string | null;
  action_type: string;
  quantity: number;
  estimated_co2_saved: number;
  duration_hours: number | null;
  frequency_days: number | null;
  pm25_dose_avoided: number | null;
  created_at: string;
}

/** Protective actions logged by the My Impact Calculator (Phase 5C). */
export const PROTECTIVE_ACTIONS = [
  "N95 Mask",
  "HEPA Purifier",
  "Rescheduled Outdoor Activity",
  "Sealed Transit (Metro/AC)",
] as const;
export type ProtectiveAction = (typeof PROTECTIVE_ACTIONS)[number];

/**
 * Deterministic mitigation factors per protective action — the "post" state
 * of the exposure engine's attenuation. N95 blocks ~25% of inhaled
 * particles; a HEPA purifier cuts the indoor dose ~25%; rescheduling moves
 * the day to zero exposure at that location; sealed Metro/AC transit halves
 * the roadside plume compared with walking or a two-wheeler.
 */
export const PROTECTIVE_MITIGATION: Record<ProtectiveAction, number> = {
  "N95 Mask": 0.25,
  "HEPA Purifier": 0.25,
  "Rescheduled Outdoor Activity": 1.0,
  "Sealed Transit (Metro/AC)": 0.5,
};

/** Baseline (unmitigated) attenuation of the outdoor exposure being mitigated. */
export const BASELINE_ATTENUATION = 0.95;

/**
 * Small reference footprints used for the "emissions saved" metric.
 * HEPA: 50 W × grid intensity ~0.8 kg CO₂/kWh per hour of runtime.
 * Sealed transit: ~0.2 kg CO₂ avoided per km vs. an equivalent car trip.
 * N95: ~0.06 kg CO₂-eq manufacturing footprint per day of use.
 */
export const CO2_HOURLY: Partial<Record<ProtectiveAction, number>> = {
  "HEPA Purifier": 0.04,
  "Sealed Transit (Metro/AC)": 0.2,
};
export const CO2_PER_DAY: Partial<Record<ProtectiveAction, number>> = {
  "N95 Mask": 0.06,
};

/** Persist a "Check Routine AQI" run as an exposure_check_snapshots row. */
export async function saveExposureSnapshot(
  user: { id: string },
  input: {
    profile_id: string | null;
    routine_id: string;
    routine_name: string;
    exposure_score: number;
    total_dose: number;
    stop_naqi_summary: StopNaqiSummary[];
  },
): Promise<string | null> {
  const { error } = await supabase.from("exposure_check_snapshots").insert({
    user_id: user.id,
    ...input,
  });
  return error ? error.message : null;
}
