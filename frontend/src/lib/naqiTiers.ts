/**
 * Single source of truth for the 6-tier Indian CPCB NAQI color mapping.
 *
 * Every NAQI value-keyed UI element (per-stop pills in Routines, exposure
 * share bars, the Dashboard primary-station badge, the Awareness tier-table
 * swatches) renders from this module so Satisfactory and Moderate never
 * wash out into the same amber family, and tier boundaries stay discrete:
 *
 *   0–50   Good          emerald
 *   51–100 Satisfactory  amber
 *   101–200 Moderate    orange
 *   201–300 Poor        red
 *   301–400 Very Poor   rose
 *   401–500 Severe      maroon
 *
 * Values are keyed off the NAQI *number*, not the worker's hex palette, so a
 * value of 101 always lands in Moderate (orange) and 74 stays Satisfactory
 * (amber) regardless of what `category().color` reports.
 *
 * The literal Tailwind class strings must appear verbatim here for the JIT
 * compiler to emit them.
 */

export interface NaqiTier {
  label: string;
  /** Range shown in copy, e.g. "51–100". */
  range: string;
  /** Badge/pill: background + text + border, all literal Tailwind classes. */
  badge: string;
  /** Solid fill for thin share bars / swatches (tailwind bg utility value). */
  fillClass: string;
  /** Hex equivalent of the fill, for inline styles that need a raw color. */
  fillHex: string;
}

export const NAQI_TIERS: NaqiTier[] = [
  {
    label: "Good",
    range: "0–50",
    badge: "bg-emerald-100 text-emerald-950 border-emerald-300",
    fillClass: "bg-emerald-500",
    fillHex: "#10b981",
  },
  {
    label: "Satisfactory",
    range: "51–100",
    badge: "bg-amber-200 text-amber-950 border-amber-400",
    fillClass: "bg-amber-400",
    fillHex: "#fbbf24",
  },
  {
    label: "Moderate",
    range: "101–200",
    badge: "bg-orange-200 text-orange-950 border-orange-400",
    fillClass: "bg-orange-500",
    fillHex: "#f97316",
  },
  {
    label: "Poor",
    range: "201–300",
    badge: "bg-red-200 text-red-950 border-red-400",
    fillClass: "bg-red-500",
    fillHex: "#ef4444",
  },
  {
    label: "Very Poor",
    range: "301–400",
    badge: "bg-rose-300 text-rose-950 border-rose-500",
    fillClass: "bg-rose-600",
    fillHex: "#e11d48",
  },
  {
    label: "Severe",
    range: "401–500",
    badge: "bg-red-900 text-white border-red-950",
    fillClass: "bg-red-900",
    fillHex: "#7f1d1d",
  },
];

const NEUTIER: NaqiTier = {
  label: "Unknown",
  range: "—",
  badge: "bg-slate-100 text-slate-600 border-slate-300",
  fillClass: "bg-slate-400",
  fillHex: "#94a3b8",
};

/**
 * Value-keyed NAQI tier lookup. Discrete CPCB boundaries: 101 → Moderate,
 * 74 → Satisfactory. Non-finite / negative values fall back to the neutral
 * "Unknown" tier.
 */
export function naqiTier(naqi: number | null | undefined): NaqiTier {
  if (typeof naqi !== "number" || !Number.isFinite(naqi) || naqi < 0) {
    return NEUTIER;
  }
  if (naqi <= 50) return NAQI_TIERS[0];
  if (naqi <= 100) return NAQI_TIERS[1];
  if (naqi <= 200) return NAQI_TIERS[2];
  if (naqi <= 300) return NAQI_TIERS[3];
  if (naqi <= 400) return NAQI_TIERS[4];
  return NAQI_TIERS[5];
}
