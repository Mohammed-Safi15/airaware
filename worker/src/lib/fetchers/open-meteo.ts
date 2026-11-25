import type { StationObservation } from "../../types/aq.js";
import type { PollutantConcentration } from "../nqi.js";

export interface OpenMeteoRecord {
  time: string;
  pm2_5?: number;
  pm10?: number;
  no2?: number;
  so2?: number;
  o3?: number;
  co?: number;
}

export interface OpenMeteoResponse {
  current: OpenMeteoRecord & { time: string[]; pm2_5?: (number | null)[]; pm10?: (number | null)[]; no2?: (number | null)[]; so2?: (number | null)[]; o3?: (number | null)[]; co?: (number | null)[] };
}

/**
 * Fetch air quality data from Open-Meteo Air Quality API.
 * Zero-key API suitable as neighborhood reference when CPCB is unavailable.
 */
export async function fetchOpenMeteo(lat: number, lng: number): Promise<OpenMeteoRecord[]> {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("current", "pm2_5,pm10,no2,so2,o3,co");
  // Open-Meteo provides a 1-hour average; we use this directly as neighborhood proxy.
  url.searchParams.set("forecast_days", "0");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn("[open-meteo] HTTP", res.status);
      return [];
    }
    const data = await res.json() as OpenMeteoResponse;
    // Open-Meteo response: { current: { time, pm2_5, pm10, no2, so2, o3, co } }
    if (!data.current || !Array.isArray(data.current.time)) {
      console.warn("[open-meteo] unexpected response format");
      return [];
    }
    const records: OpenMeteoRecord[] = [];
    // Open-Meteo provides latest reading at index 0.
    for (let i = 0; i < data.current.time.length; i++) {
      records.push({
        time: data.current.time[i],
        pm2_5: data.current.pm2_5?.[i] ?? undefined,
        pm10: data.current.pm10?.[i] ?? undefined,
        no2: data.current.no2?.[i] ?? undefined,
        so2: data.current.so2?.[i] ?? undefined,
        o3: data.current.o3?.[i] ?? undefined,
        co: data.current.co?.[i] ?? undefined,
      });
    }
    return records;
  } catch (err) {
    console.warn("[open-meteo] fetch failed:", err);
    return [];
  }
}

/**
 * Build a StationObservation from Open-Meteo air quality records.
 * Serves as neighborhood-level proxy with "Estimated" reliability.
 */
export function buildOpenMeteoStation(lat: number, lng: number, records: OpenMeteoRecord[]): StationObservation | null {
  if (records.length === 0 || !records[0]) return null;

  const latest = records[0];
  const concentrations: PollutantConcentration = {};

  if (latest.pm2_5 !== undefined) concentrations.pm25 = latest.pm2_5;
  if (latest.pm10 !== undefined) concentrations.pm10 = latest.pm10;
  if (latest.no2 !== undefined) concentrations.no2 = latest.no2;
  if (latest.so2 !== undefined) concentrations.so2 = latest.so2;
  if (latest.o3 !== undefined) concentrations.o3 = latest.o3;
  if (latest.co !== undefined) concentrations.co = latest.co;

  if (!Object.keys(concentrations).length) return null; // no pollutants returned

  // Open-Meteo data is not station-specific; distance is approximate (0km for query point).
  return {
    station_id: "open-meteo:neighborhood",
    station_name: "Neighborhood Reference",
    source: "open-meteo",
    attribution: "Open-Meteo (Zero-key air quality API)",
    concentrations,
    measurement_timestamp: new Date(latest.time).toISOString(),
    reliability: "Estimated",
    distance_km: 0,
  };
}