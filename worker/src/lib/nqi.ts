/**
 * Indian National Ambient Air Quality Index (NAQI) calculator.
 *
 * Implements the CPCB "National AQI" sub-index methodology:
 *   1. Convert raw concentration -> sub-index for each pollutant (PM2.5, PM10, NO2, SO2, CO, O3).
 *   2. NAQI = max(sub-indices).
 *
 * Breakpoints sourced from CPCB (India) – the authoritative domestic standard.
 * Concentration units assumed: µg/m³ for particles/gases (except CO which is mg/m³).
 *
 * Design rule (from PRD): never substitute a missing pollutant with zero —
 * simply omit its sub-index contribution so it cannot drag the average down.
 */

/**
 * Extra metadata carried alongside concentrations to distinguish sources.
 * CPCB reports CO as a pre-computed 0–500 NAQI sub-index (not raw mg/m³);
 * this flag lets toNAQI skip the breakpoint lookup for such values.
 */
export interface ConcentrationMetadata {
  /** true when CO was provided by CPCB as an already-broken-down 0–500 sub-index */
  coIsSubIndex?: boolean;
}

export interface PollutantConcentration {
  pm25?: number; // µg/m³
  pm10?: number; // µg/m³
  no2?: number; // µg/m³
  so2?: number; // µg/m³
  co?: number; // mg/m³ (NOT µg) — unless coIsSubIndex=true, then 0–500 NAQI sub-index
  o3?: number; // µg/m³
}

interface Breakpoint {
  cLo: number;
  cHi: number;
  iLow: number;
  iHigh: number;
}

const SUB_INDEX_BP: Record<string, Breakpoint[]> = {
  // PM2.5 — µg/m³
  pm25: [
    { cLo: 0, cHi: 30, iLow: 0, iHigh: 50 },
    { cLo: 30, cHi: 60, iLow: 51, iHigh: 100 },
    { cLo: 60, cHi: 90, iLow: 101, iHigh: 200 },
    { cLo: 90, cHi: 120, iLow: 201, iHigh: 300 },
    { cLo: 120, cHi: 250, iLow: 301, iHigh: 400 },
    { cLo: 250, cHi: 500, iLow: 401, iHigh: 500 },
  ],
  // PM10 — µg/m³
  pm10: [
    { cLo: 0, cHi: 50, iLow: 0, iHigh: 50 },
    { cLo: 50, cHi: 100, iLow: 51, iHigh: 100 },
    { cLo: 100, cHi: 250, iLow: 101, iHigh: 200 },
    { cLo: 250, cHi: 350, iLow: 201, iHigh: 300 },
    { cLo: 350, cHi: 430, iLow: 301, iHigh: 400 },
    { cLo: 430, cHi: 600, iLow: 401, iHigh: 500 },
  ],
  // NO2 — µg/m³
  no2: [
    { cLo: 0, cHi: 40, iLow: 0, iHigh: 50 },
    { cLo: 40, cHi: 80, iLow: 51, iHigh: 100 },
    { cLo: 80, cHi: 180, iLow: 101, iHigh: 200 },
    { cLo: 180, cHi: 480, iLow: 201, iHigh: 300 },
    { cLo: 480, cHi: 780, iLow: 301, iHigh: 400 },
    { cLo: 780, cHi: 1100, iLow: 401, iHigh: 500 },
  ],
  // SO2 — µg/m³
  so2: [
    { cLo: 0, cHi: 40, iLow: 0, iHigh: 50 },
    { cLo: 40, cHi: 80, iLow: 51, iHigh: 100 },
    { cLo: 80, cHi: 380, iLow: 101, iHigh: 200 },
    { cLo: 380, cHi: 800, iLow: 201, iHigh: 300 },
    { cLo: 800, cHi: 1600, iLow: 301, iHigh: 400 },
    { cLo: 1600, cHi: 2100, iLow: 401, iHigh: 500 },
  ],
  // CO — mg/m³
  co: [
    { cLo: 0, cHi: 1, iLow: 0, iHigh: 50 },
    { cLo: 1, cHi: 2, iLow: 51, iHigh: 100 },
    { cLo: 2, cHi: 4, iLow: 101, iHigh: 200 },
    { cLo: 4, cHi: 8, iLow: 201, iHigh: 300 },
    { cLo: 8, cHi: 17, iLow: 301, iHigh: 400 },
    { cLo: 17, cHi: 34, iLow: 401, iHigh: 500 },
  ],
  // O3 — µg/m³
  o3: [
    { cLo: 0, cHi: 50, iLow: 0, iHigh: 50 },
    { cLo: 50, cHi: 100, iLow: 51, iHigh: 100 },
    { cLo: 100, cHi: 168, iLow: 101, iHigh: 200 },
    { cLo: 168, cHi: 208, iLow: 201, iHigh: 300 },
    { cLo: 208, cHi: 748, iLow: 301, iHigh: 400 },
    { cLo: 748, cHi: 1248, iLow: 401, iHigh: 500 },
  ],
};

function linearSubIndex(concentration: number, bp: Breakpoint[]): number {
  if (concentration < bp[0].cLo) return 0;
  const bracket = bp.find((b) => b.cLo <= concentration && concentration <= b.cHi);
  if (!bracket) return bp[bp.length - 1].iHigh; // beyond range cap to top bucket
  return Math.round(((bracket.iHigh - bracket.iLow) / (bracket.cHi - bracket.cLo)) * (concentration - bracket.cLo) + bracket.iLow);
}

export function toNAQI(c: PollutantConcentration, meta?: ConcentrationMetadata): { naqi: number; subIndices: Record<string, number> } {
  const subIndices: Record<string, number> = {};
  const coPreSubIndexed = meta?.coIsSubIndex === true;

  const entries: Array<[string, number | undefined]> = [
    ["pm25", c.pm25],
    ["pm10", c.pm10],
    ["no2", c.no2],
    ["so2", c.so2],
    ["co", c.co],
    ["o3", c.o3],
  ];

  for (const [key, raw] of entries) {
    if (raw == null || !Number.isFinite(raw) || raw < 0) continue;
    // CPCB reports CO as a pre-broken-down 0–500 NAQI sub-index, not mg/m³.
    // Skip breakpoint lookup and use the raw value directly as the sub-index.
    if (key === "co" && coPreSubIndexed) {
      subIndices[key] = Math.min(500, Math.max(0, Math.round(raw)));
      continue;
    }
    const bp = SUB_INDEX_BP[key];
    if (!bp) continue;
    subIndices[key] = linearSubIndex(raw, bp);
  }

  const values = Object.values(subIndices);
  const naqi = values.length === 0 ? -1 : Math.max(...values);
  return { naqi, subIndices };
}

/**
 * US EPA AQI breakpoints — per standard 42 USC §7408 & 40 CFR Part 50 appendix D.
 * Units match those used by OpenAQ/Open-Meteo (µg/m³ for particles/gases, mg/m³ for CO).
 */
const USAQI_BP: Record<string, Breakpoint[]> = {
  pm25: [
    { cLo: 0, cHi: 12, iLow: 0, iHigh: 50 },
    { cLo: 12.1, cHi: 35.4, iLow: 51, iHigh: 100 },
    { cLo: 35.5, cHi: 55.4, iLow: 101, iHigh: 150 },
    { cLo: 55.5, cHi: 150.4, iLow: 151, iHigh: 200 },
    { cLo: 150.5, cHi: 250.4, iLow: 201, iHigh: 300 },
    { cLo: 250.5, cHi: 500.4, iLow: 301, iHigh: 500 },
  ],
  pm10: [
    { cLo: 0, cHi: 54, iLow: 0, iHigh: 50 },
    { cLo: 55, cHi: 154, iLow: 51, iHigh: 100 },
    { cLo: 155, cHi: 254, iLow: 101, iHigh: 150 },
    { cLo: 255, cHi: 354, iLow: 151, iHigh: 200 },
    { cLo: 355, cHi: 424, iLow: 201, iHigh: 300 },
    { cLo: 425, cHi: 604, iLow: 301, iHigh: 500 },
  ],
  no2: [
    { cLo: 0, cHi: 53, iLow: 0, iHigh: 50 },
    { cLo: 54, cHi: 100, iLow: 51, iHigh: 100 },
    { cLo: 101, cHi: 360, iLow: 101, iHigh: 150 },
    { cLo: 361, cHi: 649, iLow: 151, iHigh: 200 },
    { cLo: 650, cHi: 1249, iLow: 201, iHigh: 300 },
    { cLo: 1250, cHi: 2049, iLow: 301, iHigh: 500 },
  ],
  so2: [
    { cLo: 0, cHi: 35, iLow: 0, iHigh: 50 },
    { cLo: 36, cHi: 75, iLow: 51, iHigh: 100 },
    { cLo: 76, cHi: 185, iLow: 101, iHigh: 150 },
    { cLo: 186, cHi: 304, iLow: 151, iHigh: 200 },
    { cLo: 305, cHi: 604, iLow: 201, iHigh: 300 },
    { cLo: 605, cHi: 800, iLow: 301, iHigh: 500 },
  ],
  co: [
    { cLo: 0, cHi: 4.4, iLow: 0, iHigh: 50 },
    { cLo: 4.5, cHi: 9.4, iLow: 51, iHigh: 100 },
    { cLo: 9.5, cHi: 12.4, iLow: 101, iHigh: 150 },
    { cLo: 12.5, cHi: 15.4, iLow: 151, iHigh: 200 },
    { cLo: 15.5, cHi: 30.4, iLow: 201, iHigh: 300 },
    { cLo: 30.5, cHi: 50.4, iLow: 301, iHigh: 500 },
  ],
  o3: [
    { cLo: 0, cHi: 54, iLow: 0, iHigh: 50 },
    { cLo: 55, cHi: 70, iLow: 51, iHigh: 100 },
    { cLo: 71, cHi: 85, iLow: 101, iHigh: 150 },
    { cLo: 86, cHi: 105, iLow: 151, iHigh: 200 },
    { cLo: 106, cHi: 200, iLow: 201, iHigh: 300 },
    { cLo: 201, cHi: 500, iLow: 301, iHigh: 500 },
  ],
};

export function toUSAQI(c: PollutantConcentration, meta?: ConcentrationMetadata): { usAqi: number; subIndices: Record<string, number> } {
  const subIndices: Record<string, number> = {};
  const coPreSubIndexed = meta?.coIsSubIndex === true;

  const entries: Array<[string, number | undefined]> = [
    ["pm25", c.pm25],
    ["pm10", c.pm10],
    ["no2", c.no2],
    ["so2", c.so2],
    ["co", c.co],
    ["o3", c.o3],
  ];

  for (const [key, raw] of entries) {
    if (raw == null || !Number.isFinite(raw) || raw < 0) continue;
    // CPCB reports CO as a pre-broken-down 0–500 NAQI sub-index; also skip for US EPA.
    if (key === "co" && coPreSubIndexed) {
      subIndices[key] = Math.min(500, Math.max(0, Math.round(raw)));
      continue;
    }
    const bp = USAQI_BP[key];
    if (!bp) continue;
    subIndices[key] = linearSubIndex(raw, bp);
  }

  const values = Object.values(subIndices);
  const usAqi = values.length === 0 ? -1 : Math.max(...values);
  return { usAqi, subIndices };
}

export function usaCategory(usAqi: number): { label: string; color: string } {
  if (usAqi < 0) return { label: "Unknown", color: "#808080" };
  if (usAqi <= 50) return { label: "Good", color: "#00E400" };
  if (usAqi <= 100) return { label: "Moderate", color: "#FFFF00" };
  if (usAqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "#FF9900" };
  if (usAqi <= 200) return { label: "Unhealthy", color: "#FF0000" };
  if (usAqi <= 300) return { label: "Very Unhealthy", color: "#99004C" };
  return { label: "Hazardous", color: "#660099" };
}

export function category(naqi: number): { label: string; color: string } {
  if (naqi < 0) return { label: "Unknown", color: "#808080" };
  if (naqi <= 50) return { label: "Good", color: "#00E400" };
  if (naqi <= 100) return { label: "Satisfactory", color: "#FFFF00" };
  if (naqi <= 200) return { label: "Moderate", color: "#FF9900" };
  if (naqi <= 300) return { label: "Poor", color: "#FF0000" };
  if (naqi <= 400) return { label: "Very Poor", color: "#99004C" };
  return { label: "Severe", color: "#660099" };
}
