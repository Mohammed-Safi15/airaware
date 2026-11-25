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

export const LOCATION_TYPES = ["Home", "Office", "College", "Other"] as const;

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
