import { useState, useEffect, useMemo } from "react";
import { MapView } from "../components/MapView";
import { SearchBar } from "../components/SearchBar";
import { AlertCircle, LocateFixed, Wind } from "lucide-react";
import { supabase, LOCATION_TYPES } from "../lib/supabase";
import { useAuth } from "../App";
import { useProfiles } from "../lib/profileContext";
import { computeExposure, toExposureStop } from "../lib/exposure";
import type { AQResponse, StationObservation } from "../types/aq";

interface DashboardProps {}

const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;

// Nominatim reverse-geocode helper
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lng=${lng}&format=json&addressdetails=1&accept-language=en&user-agent=AirAware/1.0`);
  if (!res.ok) return "Unknown location";
  const data = await res.json();
  if (data?.address?.city) return data.address.city;
  if (data?.address?.town) return data.address.town;
  if (data?.address?.village) return data.address.village;
  if (data?.address?.road) return data.address.road;
  if (data?.address?.suburb) return data.address.suburb;
  return "Unknown location";
}

export function Dashboard({ }: DashboardProps) {
  const { user } = useAuth();
  const { activeProfile } = useProfiles();
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [locationName, setLocationName] = useState("Bengaluru");
  const [data, setData] = useState<AQResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveLocationOpen, setSaveLocationOpen] = useState(false);
  const [saveLocationType, setSaveLocationType] = useState<"Home" | "Work" | "College" | "Gym" | "Other">("Home");
  const [saveLocationName, setSaveLocationName] = useState("");
  const [locating, setLocating] = useState(false);

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
        {children}
      </label>
    );
  }

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

  // Personal Exposure Score (Phase 4.3) — deterministic single-stop model for
  // the currently viewed location. One hour of outdoor presence at this
  // place's live NAQI, weighted by the active profile's sensitivity + habits.
  const exposure = useMemo(() => {
    if (!activeProfile || !data) return null;
    const stop = toExposureStop(locationName, 1, "Outdoor", data);
    return computeExposure([stop], activeProfile, null, null);
  }, [activeProfile, data, locationName]);

  // Cap the "Nearby Stations" list to the 10 closest alternatives so far
  // stations (hundreds, 100s of km away) never clutter the Dashboard.
  const nearbyStations = useMemo(
    () =>
      [...(data?.alternatives ?? [])]
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, 10),
    [data]
  );

  function handleSearchSelect(queryLat: number, queryLng: number, name: string) {
    void fetchAQI(queryLat, queryLng, name);
  }

  function handleMarkerClick(_queryLat: number, _queryLng: number) {
    // Clicking elsewhere on the map would re-query; kept simple for Phase 3
  }

  async function handleMapClick(queryLat: number, queryLng: number) {
    // Client-side India bounds check (per spec: lat 6.5–37.5, lng 68–97.5)
    if (queryLat < 6.5 || queryLat > 37.5 || queryLng < 68 || queryLng > 97.5) return;
    // Move pin + reverse-geocode + fetch AQI
    const name = await reverseGeocode(queryLat, queryLng);
    setLat(queryLat);
    setLng(queryLng);
    setLocationName(name);
    void fetchAQI(queryLat, queryLng, name);
  }

  // Auto-fetch live AQI for the default pin on initial load
  useEffect(() => {
    void fetchAQI(DEFAULT_LAT, DEFAULT_LNG, "Bengaluru");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUseMyLocation() {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const gpsLat = pos.coords.latitude;
        const gpsLng = pos.coords.longitude;
        // India bounds check — stay within the supported region
        if (gpsLat < 6.5 || gpsLat > 37.5 || gpsLng < 68 || gpsLng > 97.5) {
          setLocating(false);
          setError("Location is outside India — AirAware currently supports Pan-India AQI only.");
          return;
        }
        const name = await reverseGeocode(gpsLat, gpsLng);
        setLat(gpsLat);
        setLng(gpsLng);
        setLocationName(name);
        setLocating(false);
        void fetchAQI(gpsLat, gpsLng, name);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow location access to use this feature."
            : "Could not get your location. Try again or search for a city."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Air Quality Dashboard</h1>

      {/* Search Bar + Use My Location */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar onSelect={handleSearchSelect} placeholder="Search city or area…" />
        </div>
        <button
          onClick={handleUseMyLocation}
          disabled={locating}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <LocateFixed className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} />
          <span>{locating ? "Locating…" : "Use My Location"}</span>
        </button>
      </div>

      {/* Current Location Badge */}
      <div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
        <Wind className="h-4 w-4 shrink-0 text-sky-500" />
        <span className="truncate font-medium" title={locationName}>{locationName}</span>
        <span className="shrink-0 text-slate-400">·</span>
        <span className="shrink-0 font-mono text-xs" title={`${lat.toFixed(4)}, ${lng.toFixed(4)}`}>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
      </div>

      {/* Map */}
      <MapView
        centerLat={lat}
        centerLng={lng}
        stations={[]}
        onClick={handleMarkerClick}
        onMapClick={handleMapClick}
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

      {/* Personal Exposure Score Card */}
      {exposure && data && !loading && !error && (
        <div className="rounded-xl border border-[var(--color-sage-border)] bg-[var(--color-sage-border)]/60 p-4 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Personal Exposure Score
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: exposure.scoreColor }}>
              {exposure.score}
            </span>
            <span className="text-sm font-medium" style={{ color: exposure.scoreColor }}>
              {exposure.scoreLabel}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${exposure.score}%`, background: exposure.scoreColor }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {activeProfile?.name} · sensitivity ×{exposure.sensitivity} ·{" "}
            {data._meta?.naqi ?? "–"} NAQI for 1h outdoor
          </p>
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">Primary Station</p>
                  <h2 className="mt-1 truncate text-lg font-semibold text-slate-900" title={data.primary.station_name}>{data.primary.station_name}</h2>
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
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
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

              {/* Save Location Quick Action */}
              <button
                onClick={() => setSaveLocationOpen(true)}
                className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Save Location
              </button>

              {/* Save Location Modal */}
              {saveLocationOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="rounded-xl border border-slate-300 bg-white p-6 max-w-sm w-full shadow-2xl">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Save Location</h3>
                    <div className="mt-4 space-y-3">
                      <Field label="Location Name">
                        <input
                          value={saveLocationName}
                          onChange={(e) => setSaveLocationName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        />
                      </Field>
                      <Field label="Type">
                        <select
                          value={saveLocationType}
                          onChange={(e) => setSaveLocationType(e.target.value as "Home" | "Work" | "College" | "Gym" | "Other")}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        >
                          {LOCATION_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => setSaveLocationOpen(false)}
                        className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!saveLocationName.trim()) return;
                          const { error } = await supabase.from("saved_locations").insert({
                            user_id: user!.id,
                            location_name: saveLocationName.trim(),
                            latitude: lat,
                            longitude: lng,
                            location_type: saveLocationType,
                          });
                          if (error) alert(`Save failed: ${error.message}`);
                          else {
                            setSaveLocationOpen(false);
                            setSaveLocationName("");
                            setSaveLocationType("Home");
                          }
                        }}
                        className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Alternative Stations — capped to the 10 nearest */}
          {nearbyStations.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium text-slate-700">
                Nearby Stations ({nearbyStations.length}
                {data.alternatives.length > nearbyStations.length && (
                  <span className="text-slate-400"> of {data.alternatives.length}</span>
                )}
                )</h3>
              <div className="mt-3 space-y-2">
                {nearbyStations.map((alt: StationObservation) => (
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