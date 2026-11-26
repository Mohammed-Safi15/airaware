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
