import { useState, useEffect, useRef } from "react";
import { supabase, LOCATION_TYPES } from "../lib/supabase";
import type { SavedLocationRow, LocationType } from "../lib/supabase";
import { Plus, Trash2, MapPin, Edit2, Save, Wind, Navigation, ChevronDown } from "lucide-react";
import { SearchBar } from "./SearchBar";
import type { AQResponse } from "../types/aq";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// India bounding box (matches the worker geofence)
const INDIA_LAT_MIN = 8;
const INDIA_LAT_MAX = 35;
const INDIA_LNG_MIN = 68;
const INDIA_LNG_MAX = 97;
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

// Tile repaint fix: the embedded map is re-created every time the form opens,
// so the ResizeObserver is created per-effect, not at module scope.
const hasResizeObserver = typeof ResizeObserver !== "undefined";

function inIndia(lat: number, lng: number): boolean {
  return lat >= INDIA_LAT_MIN && lat <= INDIA_LAT_MAX && lng >= INDIA_LNG_MIN && lng <= INDIA_LNG_MAX;
}

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

/** Nominatim reverse-geocode → best available place name, or "" on failure. */
async function reverseGeocodeName(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lng=${lng}&format=json&addressdetails=1&accept-language=en&user-agent=AirAware/1.0`
    );
    if (!res.ok) return "";
    const data = (await res.json()) as { address?: Record<string, string> };
    const a = data.address ?? {};
    return a.city ?? a.town ?? a.village ?? a.suburb ?? a.county ?? "";
  } catch {
    return "";
  }
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
    location_type: LocationType;
    latitude: string;
    longitude: string;
  }>({ location_name: "", location_type: "Other", latitude: "", longitude: "" });
  const [previewAQI, setPreviewAQI] = useState<AQResponse | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const pinRef = useRef<L.Marker | null>(null);
  // Monotonic counter so a slow Nominatim reverse for an older pick can
  // never overwrite a newer one (search / GPS / a newer pin drop win).
  const pickSeq = useRef(0);

  // ================================================================
  // Live AQI preview when form coords change (never persisted)
  // ================================================================
  useEffect(() => {
    if (!showForm || !formData.latitude || !formData.longitude) {
      setPreviewAQI(null);
      return;
    }
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inIndia(lat, lng) || !fetchAQI) return;
    setPreviewAQI(null);
    let cancelled = false;
    fetchAQI(lat, lng)
      .then((r) => {
        if (!cancelled) setPreviewAQI(r);
      })
      .catch(() => {
        if (!cancelled) setPreviewAQI(null);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.latitude, formData.longitude, showForm, fetchAQI]);

  // ================================================================
  // Initialize the embedded Leaflet map + draggable pin when the form opens
  // ================================================================
  useEffect(() => {
    if (!showForm) return;
    const container = mapRef.current;
    if (!container) return;

    const dLat = defaultLat;
    const dLng = defaultLng;
    const hasDefault =
      dLat !== undefined &&
      dLng !== undefined &&
      Number.isFinite(dLat) &&
      Number.isFinite(dLng) &&
      inIndia(dLat, dLng);
    const center: [number, number] = hasDefault ? [dLat, dLng] : INDIA_CENTER;

    const map = L.map(container, { zoomControl: true, attributionControl: true, preferCanvas: false });
    leafletMap.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    map.setView(center, 13, { animate: false });

    // Draggable pin: click-anywhere on the map moves it; dragging it also picks.
    const pinIcon = L.divIcon({
      html: `<div style="
        background: #6366f1;
        border: 3px solid #fff;
        border-radius: 50%;
        width: 14px; height: 14px;
        box-shadow: 0 0 0 4px rgba(99,102,241,0.3);
      "></div>`,
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    const pin = L.marker(center, { icon: pinIcon, draggable: true }).addTo(map);
    pinRef.current = pin;

    const onPick = (lat: number, lng: number) => {
      if (!inIndia(lat, lng)) return;
      pickSeq.current += 1;
      setFormData((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng), location_name: "" }));
      const seq = pickSeq.current;
      void reverseGeocodeName(lat, lng).then((name) => {
        if (seq === pickSeq.current) {
          setFormData((prev) => (name ? { ...prev, location_name: name } : prev));
        }
      });
    };

    map.on("click", (e: L.LeafletMouseEvent) => onPick(e.latlng.lat, e.latlng.lng));
    pin.on("dragend", () => {
      const p = pin.getLatLng();
      onPick(p.lat, p.lng);
    });

    // Grey-tile repaint fix: watch the container and nudge invalidateSize.
    let ro: ResizeObserver | null = null;
    if (hasResizeObserver) {
      ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(container);
    }
    // Force a repaint tick after React flushes the mount.
    const repaintTimer = window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      window.clearTimeout(repaintTimer);
      if (ro) ro.disconnect();
      pin.remove();
      pinRef.current = null;
      map.remove();
      leafletMap.current = null;
    };
    // [showForm] only on purpose: the default center is read on form-open.
    // Re-creating the map when the parent's defaultLat/defaultLng change would
    // wipe out a pin the user just placed in the picker.
  }, [showForm]);

  // ================================================================
  // Keep the pin in sync with GPS / search / manual edits
  // ================================================================
  useEffect(() => {
    const map = leafletMap.current;
    const pin = pinRef.current;
    if (!showForm || !map || !pin) return;
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      pin.setLatLng([lat, lng]);
      if (inIndia(lat, lng) && !map.getBounds().contains([lat, lng])) {
        map.panTo([lat, lng]);
      }
    }
    // Coords empty (fresh form after Save/Cancel): the pin stays where the
    // map opened (default center or INDIA_CENTER) — nothing to do.
  }, [formData.latitude, formData.longitude, showForm]);

  // ================================================================
  // Load saved locations + always-live AQI pre-fetch
  // ================================================================
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
      // Fresh cache — AQI is never stored statically, so every visible
      // card re-fetches its live reading below.
      setAqis(new Map());
      for (const loc of data ?? []) {
        void refreshLocation(loc);
      }
    } catch (err) {
      console.error("Failed to load locations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshLocation(loc: SavedLocationRow) {
    if (!fetchAQI) return;
    const lat = loc.latitude;
    const lng = loc.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inIndia(lat, lng)) return;
    setFetchingIds((prev) => new Set(prev).add(loc.id));
    try {
      const result = await fetchAQI(lat, lng);
      setAqis((prev) => {
        const n = new Map(prev);
        n.set(loc.id, result);
        return n;
      });
    } catch {
      // No badge for this location — leave stale value untouched on error.
    } finally {
      setFetchingIds((prev) => {
        const n = new Set(prev);
        n.delete(loc.id);
        return n;
      });
    }
  }

  // ================================================================
  // Form: search / GPS / submit
  // ================================================================
  function handleFormSearch(lat: number, lng: number, name: string) {
    if (!inIndia(lat, lng)) return;
    pickSeq.current += 1;
    setFormData((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng), location_name: name }));
  }

  function getMyLocation() {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!inIndia(lat, lng)) {
          alert("Your location appears to be outside India. AirAware currently supports India only.");
          return;
        }
        pickSeq.current += 1;
        setFormData((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng), location_name: "" }));
        const seq = pickSeq.current;
        const name = await reverseGeocodeName(lat, lng);
        if (seq === pickSeq.current) {
          setFormData((prev) => (name ? { ...prev, location_name: name } : prev));
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Unable to get your location. Please enable location access.");
      },
      { timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (!formData.location_name.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (editingId) {
      const { error } = await supabase
        .from("saved_locations")
        .update({
          location_name: formData.location_name.trim(),
          latitude: lat,
          longitude: lng,
          location_type: formData.location_type,
        })
        .eq("id", editingId)
        .eq("user_id", userId);
      if (error) {
        console.error("Update failed:", error);
        alert(`Save failed: ${error.message}`);
        return;
      }
      setEditingId(null);
    } else {
      const { error } = await supabase.from("saved_locations").insert({
        user_id: userId,
        location_name: formData.location_name.trim(),
        latitude: lat,
        longitude: lng,
        location_type: formData.location_type,
      });
      if (error) {
        console.error("Insert failed:", error);
        alert(`Save failed: ${error.message}`);
        return;
      }
    }

    // Clean reset: blank name, type "Other", blank coords, cleared preview —
    // the user can immediately iterate GPS / search / pinpoint again.
    pickSeq.current += 1;
    setFormData({ location_name: "", location_type: "Other", latitude: "", longitude: "" });
    setPreviewAQI(null);
    setShowForm(false);
    await loadLocations();
  }

  function startEdit(loc: SavedLocationRow) {
    setEditingId(loc.id);
    setFormData({
      location_name: loc.location_name,
      location_type: loc.location_type,
      latitude: String(loc.latitude),
      longitude: String(loc.longitude),
    });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("saved_locations").delete().eq("id", id).eq("user_id", userId);
    if (error) {
      console.error("Delete failed:", error);
      return;
    }
    await loadLocations();
  }

  async function handleClick(loc: SavedLocationRow) {
    onLocationSelect(loc.latitude, loc.longitude, loc.location_name);
    // Always-live AQI: re-fetch when a location is selected.
    await refreshLocation(loc);
  }

  function cancelForm() {
    pickSeq.current += 1;
    setShowForm(false);
    setEditingId(null);
    setFormData({ location_name: "", location_type: "Other", latitude: "", longitude: "" });
    setPreviewAQI(null);
  }

  // ================================================================
  // Filtered locations list
  // ================================================================
  const filtered = filterText
    ? locations.filter(
        (loc) =>
          loc.location_name.toLowerCase().includes(filterText.toLowerCase()) ||
          loc.location_type.toLowerCase().includes(filterText.toLowerCase())
      )
    : locations;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Loading locations…</div>
      </div>
    );
  }

  // Form-level derived state
  const formLat = parseFloat(formData.latitude);
  const formLng = parseFloat(formData.longitude);
  const coordsValid = Number.isFinite(formLat) && Number.isFinite(formLng) && inIndia(formLat, formLng);
  const canSave = coordsValid && formData.location_name.trim().length > 0;
  const previewMeta = previewAQI?._meta;
  const previewCat = previewMeta && previewMeta.naqi >= 0 ? naqiCategory(previewMeta.naqi) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Saved Locations</h2>
        <button
          type="button"
          onClick={() => (showForm ? cancelForm() : setShowForm(true))}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Location"}
        </button>
      </div>

      {/* Quick filter */}
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

      {/* Add / Edit form with the all-in-one interactive map picker */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          {/* Search + GPS, side by side above the map */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <SearchBar onSelect={handleFormSearch} placeholder="Search city or area…" />
            </div>
            <button
              type="button"
              onClick={getMyLocation}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              title="Use my current GPS location"
            >
              <Navigation className="h-4 w-4 text-sky-600" /> Use My Location
            </button>
          </div>

          {/* Click-anywhere / draggable-pin map */}
          <div>
            <div ref={mapRef} className="rounded-xl border border-slate-200 bg-white shadow-sm" style={{ height: "300px" }} />
            <p className="mt-1 text-xs text-slate-400">Tap the map or drag the pin to place your location (India only)</p>
          </div>

          {/* Live reverse-geocoded name — auto-filled, editable */}
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
              {LOCATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Bottom row: live NAQI + US AQI preview pill, Cancel, Save */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
              {coordsValid && !previewCat && (
                <>
                  <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600 inline-block" />
                  <span className="text-slate-500">Fetching live AQI…</span>
                </>
              )}
              {coordsValid && previewCat && previewMeta && (
                <>
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: previewCat.color }} />
                  <span className="font-semibold" style={{ color: previewCat.color }}>
                    NAQI {previewMeta.naqi} · {previewCat.label}
                  </span>
                  {previewMeta.usAqi != null && <span className="text-slate-500">US AQI {previewMeta.usAqi}</span>}
                </>
              )}
              {!coordsValid && <span className="text-slate-400">Live AQI appears once you place a pin</span>}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className="flex items-center gap-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              <div key={loc.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-sm">
                {/* Card row */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ background: badge ? `${badge.color}20` : "#f0f9ff" }}
                    >
                      {fetching ? (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600" />
                      ) : badge ? (
                        <span className="text-xs font-bold" style={{ color: badge.color }}>
                          {badge.naqi}
                        </span>
                      ) : (
                        <Wind className="h-4 w-4 text-sky-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900" title={loc.location_name}>{loc.location_name}</p>
                      <p className="truncate text-xs text-slate-500" title={`${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} · ${loc.location_type}`}>
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} · {loc.location_type}
                      </p>
                      {badge && (
                        <p className="mt-0.5 text-xs font-medium" style={{ color: badge.color }}>
                          {badge.categoryLabel} · NAQI {badge.naqi}
                          {badge.usAqi != null && <span className="ml-1 text-slate-500">US AQI {badge.usAqi}</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-2 flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void handleClick(loc)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-sky-600"
                      title="Select"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(loc)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(loc.id)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const willExpand = expandedId !== loc.id;
                        setExpandedId(willExpand ? loc.id : null);
                        // Always-live AQI: refresh when the drawer opens.
                        if (willExpand) void refreshLocation(loc);
                      }}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100"
                      title="Toggle AQI details"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Expandable AQI drawer */}
                {isExpanded && (
                  <div className="space-y-3 border-t border-slate-100 bg-slate-50 px-3 py-3">
                    {(() => {
                      const ad = aqiData;
                      if (!ad) {
                        return (
                          <div className="py-2 text-center text-xs text-slate-400">
                            {fetching ? "Fetching live AQI…" : "AQI data unavailable — try again later."}
                          </div>
                        );
                      }
                      const m = ad._meta!;
                      const primary = ad.primary;
                      const pollutants = ["pm25", "pm10", "no2", "co", "so2", "o3"] as const;
                      const pollLabels: Record<string, string> = {
                        pm25: "PM2.5",
                        pm10: "PM10",
                        no2: "NO2",
                        co: "CO",
                        so2: "SO2",
                        o3: "O3",
                      };
                      return (
                        <div className="space-y-2">
                          {/* Badges + station info row */}
                          <div className="flex flex-wrap items-center gap-3">
                            {(() => {
                              const cat = naqiCategory(m.naqi);
                              return (
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                                  style={{ backgroundColor: `${cat.color}18`, borderColor: cat.color, color: cat.color }}
                                >
                                  <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />
                                  NAQI {m.naqi} — {m.category.label}
                                </span>
                              );
                            })()}
                            {m.usAqi != null && m.usAqiCategory && (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                                style={{
                                  backgroundColor: `${m.usAqiCategory.color}18`,
                                  borderColor: m.usAqiCategory.color,
                                  color: m.usAqiCategory.color,
                                }}
                              >
                                <span className="h-2 w-2 rounded-full" style={{ background: m.usAqiCategory.color }} />
                                US AQI {m.usAqi} — {m.usAqiCategory.label}
                              </span>
                            )}
                            {primary && (
                              <>
                                <span className="truncate text-xs text-slate-600">{primary.station_name}</span>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs text-slate-500">{[primary.city, primary.state].filter(Boolean).join(", ")}</span>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs text-slate-500">{primary.distance_km.toFixed(1)} km</span>
                                <span
                                  className={`ml-auto rounded-full border px-2 py-0.5 text-xs font-medium ${
                                    primary.source === "cpcb"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-blue-200 bg-blue-50 text-blue-700"
                                  }`}
                                >
                                  {primary.source === "cpcb" ? "CPCB Station" : "Open-Meteo Model"}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Pollutant grid */}
                          {primary && Object.keys(primary.concentrations).length > 0 && (
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
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
                              onClick={() => void refreshLocation(loc)}
                              disabled={fetching}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-sky-400 hover:bg-white hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {fetching ? "Refreshing…" : "↻ Refresh AQI"}
                            </button>
                            <a
                              href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-sky-400 hover:bg-white hover:text-sky-600"
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
