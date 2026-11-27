import type { CSSProperties } from "react";

/**
 * Shared NAQI pill styling for exposure result badges.
 *
 * The CPCB Satisfactory tier is bright yellow (#FFFF00) and Moderate is
 * #FF9900 — both wash out when used as text on a 13%-alpha tint. Those map
 * to a high-contrast warm gold badge: deep amber text (#713F12, amber-950)
 * on rich gold (#FDE047, amber-200) with a crisp amber-400 border.
 * Other tiers keep the tinted category color.
 *
 * The set covers the worker's CPCB colors (#FFFF00/#FF9900) and the
 * DESIGN.md palette equivalents (#ca8a04/#ea580c, used by SavedLocations).
 */
const AMBER_FAMILY = new Set(["#ffff00", "#ff9900", "#ca8a04", "#ea580c"]);

const AMBER_PILL: CSSProperties = {
  backgroundColor: "#FDE047",
  color: "#713F12",
  border: "1px solid #FBBF24", // amber-400
};

/** Inline style for a NAQI category pill. `color` is the category hex. */
export function aqiPillStyle(color?: string): CSSProperties {
  const c = color?.toLowerCase();
  if (c && AMBER_FAMILY.has(c)) return AMBER_PILL;
  if (c) return { backgroundColor: `${c}22`, color: c };
  return { backgroundColor: "#F1F5F9", color: "#475569" };
}

/** Readable solid fill for thin share bars — same amber-family fix. */
export function aqiBarColor(color?: string): string {
  const c = color?.toLowerCase();
  if (c && AMBER_FAMILY.has(c)) return "#FDE047";
  return color ?? "#15803d";
}
