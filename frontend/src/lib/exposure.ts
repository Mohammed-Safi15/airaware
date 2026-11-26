import type { AQResponse } from "../types/aq";
import type { LifestyleProfileRow, TransitMode } from "./supabase";

/**
 * Phase 4.3 — Deterministic Personal Exposure Score engine.
 *
 * A transparent 0–100 daily Personal Exposure Score plus an inhaled-dose
 * breakdown. Every number is a fixed, documented constant — no model calls,
 * no averaging across stations (per PRD guardrail: each stop's score comes
 * from the live NAQI computed by the worker for that stop's own location).
 *
 * dose(stop)  = NAQI(stop) × hours(stop) × attenuation(stop) × mitigation(stop)
 * totalDose   = Σ dose(stop) × sensitivity(profile)
 * score       = clamp(100 × totalDose / DAILY_DOSE_BUDGET, 0, 100)
 *
 * DAILY_DOSE_BUDGET = 800 → a routine of 8 h in NAQI 100 air with unit
 * attenuation and sensitivity maps to a score of 100 (baseline "Moderate").
 */

export const DAILY_DOSE_BUDGET = 800;

/**
 * Attenuation = fraction of outdoor NAQI that actually inhaled for a given
 * micro-environment / transit mode. Deterministic engineering estimates:
 * sealed transport and purifier-filtered indoor air breathe far less of the
 * outdoor plume; roadside & two-wheeler stay near 1.0.
 */
export const ATTENUATION_FACTORS: Record<string, number> = {
  walk: 1.0,
  Outdoor: 1.0,
  two_wheeler: 0.95,
  Roadside: 0.95,
  auto_non_ac: 0.8,
  Other: 0.8,
  indoor_natural: 0.6,
  Indoor: 0.6,
  car_ac: 0.45,
  Vehicle: 0.45,
  metro_bus: 0.4,
  Metro: 0.4,
  indoor_purifier: 0.3,
};

export function attenuationFor(environmentType: string, transitMode: TransitMode | null): number {
  if (ATTENUATION_FACTORS[environmentType] !== undefined) return ATTENUATION_FACTORS[environmentType];
  if (transitMode && ATTENUATION_FACTORS[transitMode] !== undefined) return ATTENUATION_FACTORS[transitMode];
  return 0.8; // conservative default for unknown segments
}

/**
 * Age + health-condition sensitivity. Children and seniors inhale more per
 * body mass and have less respiratory reserve; flagged conditions add a
 * fixed surcharge. Capped at 1.6 so the score stays interpretable.
 */
export function sensitivityMultiplier(
  age: number,
  healthConditions: string[],
): { mult: number; reasons: string[] } {
  const reasons: string[] = [];
  let s: number;
  if (age <= 12) {
    s = 1.25;
    reasons.push("Child (≤12) — higher intake per kg: ×1.25");
  } else if (age >= 65) {
    s = 1.3;
    reasons.push("Senior (≥65) — reduced respiratory reserve: ×1.30");
  } else {
    s = 1.0;
    reasons.push("Adult baseline: ×1.00");
  }
  const lowered = healthConditions.map((c) => c.toLowerCase());
  if (lowered.some((c) => /asthma|copd|respir|lung|bronch/.test(c))) {
    s += 0.15;
    reasons.push("Respiratory condition — +0.15");
  }
  if (lowered.some((c) => /heart|cardio|hypertension|diabetes|coronary/.test(c))) {
    s += 0.1;
    reasons.push("Cardiovascular/metabolic condition — +0.10");
  }
  s = Math.min(1.6, s);
  return { mult: Math.round(s * 100) / 100, reasons };
}

/** Fixed mitigation multipliers derived from the active profile's habits. */
export function mitigationFactors(
  profile: LifestyleProfileRow | null,
  environmentType: string,
): { factor: number; notes: string[] } {
  const notes: string[] = [];
  const indoor = /indoor|purifier|natural/i.test(environmentType);
  let factor = 1;
  if (indoor) {
    if (profile?.has_air_purifier) {
      factor *= 0.75;
      notes.push("Air purifier cuts indoor dose ~25%");
    }
    if (profile?.ventilates_windows) {
      factor *= 0.9;
      notes.push("Cross-ventilation dilution");
    }
  } else if (profile?.uses_n95_mask) {
    factor = 0.75;
    notes.push("N95 habit — ~25% of outdoor particles blocked");
  }
  return { factor: Math.round(factor * 100) / 100, notes };
}

export interface ExposureStopInput {
  label: string;
  /** Live NAQI for this stop's own location, or null when unavailable. */
  naqi: number | null;
  usAqi: number | null;
  naqiCategory?: { label: string; color: string };
  usAqiCategory?: { label: string; color: string };
  reliability?: string;
  /** Time spent in this segment, hours. */
  hours: number;
  environmentType: string;
}

/** Convert a live /api/aqi response into an exposure-stop input. */
export function toExposureStop(
  label: string,
  hours: number,
  environmentType: string,
  aqi: AQResponse | null,
): ExposureStopInput {
  const meta = aqi?._meta;
  return {
    label,
    naqi: meta?.naqi ?? null,
    usAqi: meta?.usAqi ?? null,
    naqiCategory: meta?.category ? { label: meta.category.label, color: meta.category.color } : undefined,
    usAqiCategory: meta?.usAqiCategory ? { label: meta.usAqiCategory.label, color: meta.usAqiCategory.color } : undefined,
    reliability: aqi?.primary?.reliability,
    hours,
    environmentType,
  };
}

export interface ExposureBreakdownRow {
  label: string;
  naqi: number;
  usAqi: number | null;
  naqiCategory?: { label: string; color: string };
  usAqiCategory?: { label: string; color: string };
  reliability?: string;
  hours: number;
  environmentType: string;
  attenuation: number;
  mitigation: number;
  dose: number;
  share: number; // 0..1 of total
}

export interface ExposureResult {
  score: number; // 0..100
  scoreLabel: string;
  scoreColor: string;
  totalDose: number;
  sensitivity: number;
  sensitivityReasons: string[];
  breakdown: ExposureBreakdownRow[];
  unavailableStops: string[];
  tips: string[];
}

export function scoreCategory(score: number): { label: string; color: string } {
  if (score <= 25) return { label: "Low", color: "#15803d" };
  if (score <= 50) return { label: "Moderate", color: "#a16207" };
  if (score <= 75) return { label: "High", color: "#c2410c" };
  return { label: "Very High", color: "#dc2626" };
}

export function computeExposure(
  stops: ExposureStopInput[],
  profile: LifestyleProfileRow | null,
  transitMode?: TransitMode | null,
  departureTime?: string | null,
): ExposureResult {
  const { mult: sensitivity, reasons: sensitivityReasons } = sensitivityMultiplier(
    profile?.age ?? 35,
    profile?.health_conditions ?? [],
  );

  const rows: ExposureBreakdownRow[] = [];
  const unavailableStops: string[] = [];
  let totalDose = 0;

  for (const stop of stops) {
    if (stop.naqi === null) {
      unavailableStops.push(stop.label);
      continue;
    }
    const attenuation = attenuationFor(stop.environmentType, transitMode ?? null);
    const { factor: mitigation } = mitigationFactors(profile, stop.environmentType);
    const dose = stop.naqi * Math.max(0, stop.hours) * attenuation * mitigation;
    totalDose += dose;
    rows.push({
      label: stop.label,
      naqi: stop.naqi,
      usAqi: stop.usAqi,
      naqiCategory: stop.naqiCategory,
      usAqiCategory: stop.usAqiCategory,
      reliability: stop.reliability,
      hours: stop.hours,
      environmentType: stop.environmentType,
      attenuation,
      mitigation,
      dose,
      share: 0,
    });
  }

  const weighted = totalDose * sensitivity;
  const score = Math.max(0, Math.min(100, Math.round((100 * weighted) / DAILY_DOSE_BUDGET)));
  rows.forEach((r) => (r.share = totalDose > 0 ? r.dose / totalDose : 0));

  const tips = generateTips(rows, unavailableStops, score, profile, transitMode ?? null, departureTime ?? null);
  const cat = scoreCategory(score);
  return {
    score,
    scoreLabel: cat.label,
    scoreColor: cat.color,
    totalDose: Math.round(weighted),
    sensitivity,
    sensitivityReasons,
    breakdown: rows,
    unavailableStops,
    tips,
  };
}

/** Deterministic, data-driven actionable tips (Phase 4.2 spec). */
export function generateTips(
  rows: ExposureBreakdownRow[],
  unavailableStops: string[],
  score: number,
  profile: LifestyleProfileRow | null,
  transitMode: TransitMode | null,
  departureTime: string | null,
): string[] {
  const tips: string[] = [];
  const withData = rows.length > 0;

  if (!withData && unavailableStops.length > 0) {
    tips.push("No live AQI data for this route yet — retry in a few minutes.");
    return tips;
  }

  const worst = rows.reduce<(typeof rows)[number] | null>(
    (acc, r) => (acc === null || r.naqi > acc.naqi ? r : acc),
    null,
  );

  if (worst) {
    if (worst.naqi >= 300) {
      tips.push(`Critical air at ${worst.label} (NAQI ${worst.naqi}) — carry an N95 and keep outdoor time short.`);
    } else if (worst.naqi >= 200) {
      tips.push(`${worst.label} is unhealthy for sensitive groups (NAQI ${worst.naqi}) — limit prolonged outdoor activity.`);
    }
  }

  if (withData && (transitMode === "two_wheeler" || transitMode === "auto_non_ac" || transitMode === "walk")) {
    const first = rows[0];
    if (first && first.naqi >= 100) {
      tips.push("Sealed transit (Metro/Bus or Car with AC) cuts roadside inhaled dose by ~50–60% on this route.");
    }
  }

  if (score >= 60 && !profile?.uses_n95_mask) {
    tips.push("Consider wearing an N95 on this route — it blocks ~25% of inhaled fine particles.");
  }

  if (
    !profile?.has_air_purifier &&
    rows.some((r) => /indoor/i.test(r.environmentType) && r.naqi >= 100)
  ) {
    tips.push("An air purifier would cut the indoor segment dose by ~25%.");
  }

  if (withData) {
    const depHour = departureTime ? parseInt(departureTime.slice(0, 2), 10) : null;
    const inPeak = depHour !== null && ((depHour >= 8 && depHour <= 10) || (depHour >= 17 && depHour <= 20));
    const outdoorSeg = rows.some((r) => /walk|two_wheeler|roadside|outdoor/i.test(r.environmentType));
    if (inPeak && outdoorSeg) {
      tips.push("Peak-traffic departure (8–10 am / 5–8 pm) worsens roadside air — shift the trip if you can.");
    }
  }

  if (withData && rows.every((r) => r.naqi < 50)) {
    tips.push("Air across this route is Good — an ideal window to be outdoors.");
  }

  return tips.slice(0, 4);
}

/** Central live-AQI fetch used by the Routines page and the Dashboard card. */
export async function fetchStopAqi(lat: number, lng: number): Promise<AQResponse | null> {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787/api";
    const res = await fetch(`${apiUrl}/aqi?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`);
    if (!res.ok) return null;
    return (await res.json()) as AQResponse;
  } catch {
    return null;
  }
}
