// Frontend type mirror of worker/src/lib/advice.ts (Phase 5 hybrid advice
// engine). Kept in sync with the worker so the Routines page can type the
// /api/advice request/response without importing worker code.

export type AdviceTipKind =
  | "departure"
  | "transit"
  | "mask"
  | "purifier"
  | "activity"
  | "general";

export interface AdviceTip {
  kind: AdviceTipKind;
  text: string;
  /** The deterministic rule id that produced the tip ("ai" for the AI layer). */
  rule: string;
}

export interface AdviceProfileInput {
  name: string;
  age: number;
  lifestyle: string;
  health_conditions: string[];
  has_air_purifier: boolean;
  uses_n95_mask: boolean;
  ventilates_windows: boolean;
}

export interface AdviceStopInput {
  label: string;
  /** Live NAQI for this stop's own location, or null when unavailable. */
  naqi: number | null;
  usAqi?: number | null;
  categoryLabel?: string;
  hours?: number;
  environmentType?: string;
}

export interface AdviceRequest {
  profile: AdviceProfileInput | null;
  stops: AdviceStopInput[];
  /** 0–100 Personal Exposure Score from the deterministic frontend engine. */
  exposureScore: number | null;
  departureTime?: string; // "HH:MM"
  transitMode?: string;
}

export interface AdviceOutcome {
  source: "ai" | "rules-fallback";
  /** Set only when the AI path was attempted and degraded. */
  ai_error?: string;
  summary: string;
  tips: AdviceTip[];
  exposure_score: number | null;
  generated_at: string;
}
