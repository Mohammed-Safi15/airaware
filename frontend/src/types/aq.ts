/** Response shape from /api/aqi — mirrors worker/src/types/aq.ts */
export type Reliability = "Measured" | "Estimated" | "Unavailable";

export interface PollutantConcentration {
  [key: string]: number;
}

export interface StationObservation {
  station_id: string;
  station_name: string;
  source: string;
  attribution?: string;
  concentrations: PollutantConcentration;
  measurement_timestamp: string;
  reliability: Reliability;
  distance_km: number;
}

export interface AQResponse {
  latitude: number;
  longitude: number;
  fetched_at: string;
  primary: StationObservation | null;
  alternatives: StationObservation[];
  _meta?: {
    naqi: number;
    subIndices: Record<string, number>;
    category: { label: string; color: string };
  };
}
