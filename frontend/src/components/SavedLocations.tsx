import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { SavedLocationRow, LocationType } from "../lib/supabase";
import { Plus, Trash2, MapPin, Edit2, Save, Wind, Navigation, ChevronDown } from "lucide-react";
import type { AQResponse } from "../types/aq";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// India bounding box for validation
const INDIA_LAT_MIN = 8, INDIA_LAT_MAX = 35, INDIA_LNG_MIN = 68, INDIA_LNG_MAX = 97;

interface SavedLocationsProps {
  userId: string;
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  fetchAQI?: (lat: number, lng: number) => Promise<AQResponse | null>;
  defaultLat?: number;
  defaultLng?: number;
}

interface LocationBadge {
  naqi: number;
  usAqi?: number;
  categoryLabel: string;
  color: string;
}

/** NAQI colour helpers — must mirror worker/src/lib/nqi.ts */
function naqiCategory(naqi: number): { label: string; color: string } {
  if (naqi <= 50) return { label: "Good", color: "#16a34a" };
  if (naqi <= 100) return { label: "Satisfactory", color: "#ca8a04" };
  if (naqi <= 200) return { label: "Moderate", color: "#ea580c" };
  if (naqi <= 300) return { label: "Poor", color: "#dc2626" };
  if (naqi <= 400) return { label: "Very Poor", color: "#7c3aed" };
  return { label: "Severe", color: "#7f1d1d" };
}

function getNAQIBadge(aqiData: AQResponse | null): LocationBadge | null {
  const meta = aqiData?._meta;
  if (!meta?.naqi || meta.naqi < 0) return null;
  const cat = naqiCategory(meta.naqi);
  return { naqi: meta.naqi, usAqi: meta.usAqi, categoryLabel: cat.label, color: cat.color };
}

export function SavedLocations({ userId, onLocationSelect, fetchAQI, defaultLat, defaultLng }: SavedLocationsProps) {
  const [locations, setLocations] = useState<SavedLocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [aqis, setAqis] = useState<Map<string, AQResponse | null>>(new Map());
  const [fetchingIds, setFetchingIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    location_name: string;
    location_type: "Other" | "Home" | "Office" | "College";
    latitude: string;
    longitude: string;
  }>({ location_name: "", location_type: "Other", latitude: "", longitude: "" });
  const [previewAQI, setPreviewAQI] = useState<AQResponse | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  // Pre-populate form when parent supplies default coords (e.g. from Photon search)
  useEffect(() => {
    if (defaultLat !== undefined && defaultLng !== undefined) {
      setFormData({ location_name: "", location_type: "Other", latitude: String(defaultLat), longitude: String(defaultLng) });
    }
  }, [defaultLat, defaultLng]);

  // Live AQI preview when the user drops/moves a pin in the form
  useEffect(() => {
    if (!showForm || !formData.latitude || !formData.longitude) {
      setPreviewAQI(null);
      return;
    }
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (fetchAQI) {
      fetchAQI(lat, lng).then(setPreviewAQI).catch(() => setPreviewAQI(null));
    }
  }, [formData.latitude, formData.longitude, showForm, fetchAQI]);

  // Initialize Leaflet map once when the form opens
  useEffect(() => {
    if (!showForm || leafletMap.current) return;
    const container = mapRef.current;
    if (!container) return;

    leafletMap.current = L.map(container, { zoomControl: true, attributionControl: true, preferCanvas: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(leafletMap.current);

    leafletMap.current.on("click", (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (lat < 8 || lat > 35 || lng < 68 || lng > 97) return;

      setFormData((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng), location_name: "" }));

      fetch(`/api/photon?lat=${lat}&lng=${lng}&limit=5`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.features?.[0]?.properties?.name) {
            setFormData((prev) => ({ ...prev, location_name: data.features[0].properties.name }));
          }
        })
        .catch(() => { /* Pin stays even if reverse-geocode fails */ });
    });
  }, [showForm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Load saved locations + pre-fetch AQI
  useEffect(() => {
    loadLocations();
  }, [userId]);

  async function loadLocations() {
    try {
      const { data, error } = await supabase
        .from("saved_locations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLocations(data ?? []);

      if (fetchAQI) {
        const ids = new Set<string>();
        const pending = (data ?? []).map(async (loc) => {
          const lat = loc.latitude, lng = loc.longitude;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          if (lat < INDIA_LAT_MIN || lat > INDIA_LAT_MAX || lng < INDIA_LNG_MIN || lng > INDIA_LNG_MAX) return;
          ids.add(loc.id);
          setFetchingIds(new Set(ids));
          try {
            const result = await fetchAQI(lat, lng);
            setAqis((prev) => { const n = new Map(prev); n.set(loc.id, result); return n; });
          } catch { /* no badge for this one */ } finally {
            setFetchingIds((prev) => { const n = new Set(prev); n.delete(loc.id); return n; });
          }
        });
        await Promise.all(pending);
      }
    } catch (err) {
      console.error("Failed to load locations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const latInput = target.querySelector('input[name="latitude"]') as HTMLInputElement;
    const lngInput = target.querySelector('input[name="longitude"]') as HTMLInputElement;
    const lat = parseFloat(latInput?.value ?? "");
    const lng = parseFloat(lngInput?.value ?? "");

    if (!formData.location_name.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (editingId) {
      const { error } = await supabase
        .from("saved_locations")
        .update({ location_name: formData.location_name.trim(), latitude: lat, longitude: lng, location_type: formData.location_type })
        .eq("id", editingId).eq("user_id", userId);
      if (error) { console.error("Update failed:", error); return; }
      setEditingId(null);
    } else {
      const { error } = await supabase.from("saved_locations").insert({
        user_id: userId, location_name: formData.location_name.trim(), latitude: lat, longitude: lng, location_type: formData.location_type,
      });
      if (error) { console.error("Insert failed:", error); return; }
    }

    setFormData({ location_name: "", location_type: "Other", latitude: "", longitude: "" });
    setShowForm(false);
    await loadLocations();
  }

  function startEdit(loc: SavedLocationRow) {
    setEditingId(loc.id);
    setFormData({ location_name: loc.location_name, location_type: loc.location_type, latitude: String(loc.latitude), longitude: String(loc.longitude) });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("saved_locations").delete().eq("id", id).eq("user_id", userId);
    if (error) { console.error("Delete failed:", error); return; }
    await loadLocations();
  }

  async function handleClick(loc: SavedLocationRow) {
    onLocationSelect(loc.latitude, loc.longitude, loc.location_name);
    if (fetchAQI && Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude)) {
      try {
        const result = await fetchAQI(loc.latitude, loc.longitude);
        setAqis((prev) => { const n = new Map(prev); n.set(loc.id, result); return n; });
      } catch { /* ignore */ }
    }
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ location_name: "", location_type: "Other", latitude: "", longitude: "" });
    setPreviewAQI(null);
  }

  function getMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (lat < 8 || lat > 35 || lng < 68 || lng > 97) return;
        setFormData((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng), location_name: "" }));
      },
      () => { /* silently fall back */ },
      { timeout: 10000 }
    );
  }

  const filtered = filterText
    ? locations.filter((loc) =>
        loc.location_name.toLowerCase().includes(filterText.toLowerCase()) ||
        loc.location_type.toLowerCase().includes(filterText.toLowerCase()))
    : locations;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Loading locations…</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Saved Locations</h2>
        <button
          type="button"
          onClick={() => showForm ? cancelForm() : setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Location"}
        </button>
      </div>

      {/* Quick filter / search bar */}
      {locations.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by name or type…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
          <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}

      {/* Add / Edit form with embedded Leaflet pinpoint picker */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          {/* Single Location Name input — no duplicate */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Location Name</label>
            <input
              type="text"
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              placeholder="e.g., Home, Office, College, 123 Main St"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Location Type</label>
            <select
              value={formData.location_type}
              onChange={(e) => setFormData({ ...formData, location_type: e.target.value as LocationType })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="College">College</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Mobile hint */}
          <div className="sm:hidden text-xs text-slate-500">📍 Tap the map below to place your pin (India only)</div>

          {/* Embedded Leaflet map */}
          <div className="hidden sm:block">
            <div ref={mapRef} className="rounded-xl border border-slate-200 bg-white shadow-sm" style={{ height: "300px" }} />
          </div>

          <input type="hidden" name="latitude" value={formData.latitude} />
          <input type="hidden" name="longitude" value={formData.longitude} />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={getMyLocation}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              disabled={!navigator.geolocation}
              title="Use my current GPS location"
            >
              <Navigation className="h-4 w-4" /> Use My Location
            </button>

            <div className="flex items-center gap-3">
              {/* Live AQI preview */}
              {(() => {
                const m = previewAQI?._meta;
                if (!m || m.naqi < 0) return null;
                const cat = naqiCategory(m.naqi);
                return (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: cat.color }} />
                    <span className="font-medium" style={{ color: cat.color }}>
                      NAQI {m.naqi} · {cat.label}
                    </span>
                    {m.usAqi != null && <span className="text-slate-500">US AQI {m.usAqi}</span>}
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={!formData.latitude || !formData.longitude || !formData.location_name.trim()}
                className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {editingId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Location list */}
      {locations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <MapPin className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No saved locations yet</p>
          <p className="text-xs text-slate-400">Add your home, office, or frequently visited places</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">No locations match &ldquo;{filterText}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((loc) => {
            const aqiData = aqis.get(loc.id) ?? null;
            const badge = getNAQIBadge(aqiData);
            const fetching = fetchingIds.has(loc.id);
            const isExpanded = expandedId === loc.id;

            return (
              <div key={loc.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-shadow hover:shadow-sm">
                {/* Card row */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ background: badge ? `${badge.color}20` : "#f0f9ff" }}
                    >
                      {fetching ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600 inline-block" />
                      ) : badge ? (
                        <span className="text-xs font-bold" style={{ color: badge.color }}>{badge.naqi}</span>
                      ) : (
                        <Wind className="h-4 w-4 text-sky-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{loc.location_name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} · {loc.location_type}
                      </p>
                      {badge && (
                        <p className="mt-0.5 text-xs font-medium" style={{ color: badge.color }}>
                          {badge.categoryLabel} · NAQI {badge.naqi}
                          {badge.usAqi != null && <span className="text-slate-500 ml-1">US AQI {badge.usAqi}</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button type="button" onClick={() => handleClick(loc)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-sky-600 transition-colors" title="Select"><MapPin className="h-4 w-4" /></button>
                    <button type="button" onClick={() => startEdit(loc)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors" title="Edit"><Edit2 className="h-4 w-4" /></button>
                    <button type="button" onClick={() => handleDelete(loc.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : loc.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors"
                      title="Toggle AQI details"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Expandable AQI drawer */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 px-3 py-3 space-y-3">
                    {(() => {
                      const ad = aqiData;
                      if (!ad) {
                        return <div className="text-xs text-slate-400 text-center py-2">AQI data unavailable — try again later.</div>;
                      }
                      const m = ad._meta!;
                      const primary = ad.primary;
                      const pollutants = ["pm25", "pm10", "no2", "co", "so2", "o3"] as const;
                      const pollLabels: Record<string, string> = { pm25: "PM2.5", pm10: "PM10", no2: "NO2", co: "CO", so2: "SO2", o3: "O3" };
                      return (
                        <div className="space-y-2">
                          {/* Badges + station info row */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {(() => {
                              const cat = naqiCategory(m.naqi);
                              return (
                                <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                                  style={{ backgroundColor: `${cat.color}18`, borderColor: cat.color, color: cat.color }}>
                                  <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />
                                  NAQI {m.naqi} — {m.category.label}
                                </span>
                              );
                            })()}
                            {m.usAqi != null && m.usAqiCategory && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                                style={{ backgroundColor: `${m.usAqiCategory.color}18`, borderColor: m.usAqiCategory.color, color: m.usAqiCategory.color }}>
                                <span className="h-2 w-2 rounded-full" style={{ background: m.usAqiCategory.color }} />
                                US AQI {m.usAqi} — {m.usAqiCategory.label}
                              </span>
                            )}
                            {primary && (
                              <>
                                <span className="text-xs text-slate-600 truncate">{primary.station_name}</span>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs text-slate-500">{[primary.city, primary.state].filter(Boolean).join(", ")}</span>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs text-slate-500">{primary.distance_km.toFixed(1)} km</span>
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium border ${
                                  primary.source === "cpcb"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}>
                                  {primary.source === "cpcb" ? "CPCB Station" : "Open-Meteo Model"}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Pollutant grid */}
                          {primary && Object.keys(primary.concentrations).length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {pollutants.map((p) => {
                                const val = primary.concentrations[p];
                                const sub = m.subIndices[p];
                                return (
                                  <div key={p} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center">
                                    <div className="text-xs font-semibold text-slate-700">{pollLabels[p]}</div>
                                    <div className="text-sm font-bold text-slate-900">{val != null ? val : "—"}</div>
                                    {sub != null && <div className="text-xs text-slate-500">Sub: {sub}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude) || !fetchAQI) return;
                                const r = await fetchAQI(loc.latitude, loc.longitude);
                                setAqis((prev) => { const n = new Map(prev); n.set(loc.id, r); return n; });
                              }}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:border-sky-400 hover:text-sky-600 transition-colors"
                            >
                              ↻ Refresh AQI
                            </button>
                            <a
                              href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:border-sky-400 hover:text-sky-600 transition-colors"
                            >
                              🗺 View on Map
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
