import { useState } from "react";
import { MapView } from "../components/MapView";
import { SearchBar } from "../components/SearchBar";
import { AlertCircle, Wind } from "lucide-react";
import type { AQResponse, StationObservation } from "../types/aq";

interface DashboardProps {
  userId: string;
}

const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;

export function Dashboard({ userId: _userId }: DashboardProps) {
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [locationName, setLocationName] = useState("Bengaluru");
  const [data, setData] = useState<AQResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAQI(queryLat: number, queryLng: number, name: string) {
    setLoading(true);
    setError(null);
    setLat(queryLat);
    setLng(queryLng);
    setLocationName(name);

    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787/api";

    try {
      const res = await fetch(`${apiUrl}/aqi?lat=${queryLat}&lng=${queryLng}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json() as AQResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch AQI data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSelect(queryLat: number, queryLng: number, name: string) {
    void fetchAQI(queryLat, queryLng, name);
  }

  function handleMarkerClick(_queryLat: number, _queryLng: number) {
    // Clicking elsewhere on the map would re-query; kept simple for Phase 3
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Air Quality Dashboard</h1>
        {data && (
          <span className="text-xs text-slate-500">
            Last updated: {new Date(data.fetched_at).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Search Bar */}
      <SearchBar onSelect={handleSearchSelect} placeholder="Search city or area…" />

      {/* Current Location Badge */}
      <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
        <Wind className="h-4 w-4 text-sky-500" />
        <span className="font-medium">{locationName}</span>
        <span className="text-slate-400">·</span>
        <span className="font-mono text-xs">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
      </div>

      {/* Map */}
      <MapView
        centerLat={lat}
        centerLng={lng}
        stations={[]}
        onClick={handleMarkerClick}
        height="400px"
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600"></div>
            <p className="mt-3 text-sm text-slate-500">Fetching air quality data…</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Failed to load AQI data</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <p className="mt-2 text-xs text-red-600">
                Make sure the Worker is running: <code className="font-mono">npx wrangler dev</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AQI Display */}
      {data && !loading && !error && (
        <div className="space-y-4">
          {/* Primary Station Card */}
          {data.primary && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Primary Station</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{data.primary.station_name}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {data.primary.attribution} · {data.primary.reliability}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className="text-4xl font-bold"
                    style={{ color: data._meta?.category?.color || "#64748b" }}
                  >
                    {data._meta?.naqi ?? "-"}
                  </div>
                  <p className="text-sm font-medium" style={{ color: data._meta?.category?.color }}>
                    {data._meta?.category?.label ?? "Unknown"}
                  </p>
                </div>
              </div>

              {/* Pollutant Breakdown */}
              {Object.keys(data.primary.concentrations).length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {(Object.entries(data.primary.concentrations) as [string, number][]).map(([pollutant, value]) => (
                    <div key={pollutant} className="rounded-lg bg-slate-50 p-2 text-center">
                      <p className="text-xs font-medium text-slate-500 uppercase">{pollutant}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{value.toFixed(1)}</p>
                      <p className="text-xs text-slate-400">µg/m³</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Distance: {data.primary.distance_km.toFixed(1)} km</span>
                <span>Measured: {new Date(data.primary.measurement_timestamp).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Alternative Stations */}
          {data.alternatives.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium text-slate-700">Nearby Stations ({data.alternatives.length})</h3>
              <div className="mt-3 space-y-2">
                {data.alternatives.map((alt: StationObservation) => (
                  <div key={alt.station_id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{alt.station_name}</p>
                      <p className="text-xs text-slate-500">{alt.attribution}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{alt.distance_km.toFixed(1)} km</p>
                      <p className={`text-xs font-medium ${
                        alt.reliability === "Measured" ? "text-emerald-600" :
                        alt.reliability === "Estimated" ? "text-amber-600" : "text-slate-400"
                      }`}>
                        {alt.reliability}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!data.primary && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">No monitoring stations found nearby</p>
              <p className="mt-1 text-xs text-slate-400">Try searching for a larger city</p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!data && !loading && !error && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <Wind className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">Search for a location to view air quality</p>
          <p className="mt-1 text-xs text-slate-400">Data sourced from CPCB and OpenAQ monitoring stations</p>
        </div>
      )}
    </div>
  );
}
