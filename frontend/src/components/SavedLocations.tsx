import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { SavedLocationRow, LocationType } from "../lib/supabase";
import { Plus, Trash2, MapPin, Edit2, Save, X, Wind } from "lucide-react";
import type { AQResponse } from "../types/aq";

// India bounding box for validation
const INDIA_LAT_MIN = 8, INDIA_LAT_MAX = 35, INDIA_LNG_MIN = 68, INDIA_LNG_MAX = 97;

interface SavedLocationsProps {
  userId: string;
  /** Called when a location is selected — pass coords back to the map */
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  /** Optional: fetch AQI given lat/lng — if provided, badges render inline */
  fetchAQI?: (lat: number, lng: number) => Promise<AQResponse | null>;
  /** Optional default lat/lng from map click or search; pre-populates form silently */
  defaultLat?: number;
  /** Optional default lat/lng from map click or search; pre-populates form silently */
  defaultLng?: number;
}

interface LocationAQI {
  naqi: number;
  categoryLabel: string;
  color: string;
}

/** NAQI colour helpers (must mirror worker/src/lib/nqi.ts logic) */
function naqiCategory(naqi: number): { label: string; color: string } {
  if (naqi <= 50) return { label: "Good", color: "#16a34a" };       // green-600
  if (naqi <= 100) return { label: "Satisfactory", color: "#ca8a04" }; // yellow-600
  if (naqi <= 200) return { label: "Moderate", color: "#ea580c" };   // orange-600
  if (naqi <= 300) return { label: "Poor", color: "#dc2626" };       // red-600
  if (naqi <= 400) return { label: "Very Poor", color: "#7c3aed" };  // violet-600
  return { label: "Severe", color: "#7f1d1d" };                     // red-900
}

function getNAQIBadge(aqiData: AQResponse | null): LocationAQI | null {
  if (!aqiData?._meta?.naqi || aqiData._meta.naqi < 0) return null;
  const cat = naqiCategory(aqiData._meta.naqi);
  return { naqi: aqiData._meta.naqi, categoryLabel: cat.label, color: cat.color };
}

export function SavedLocations({ userId, onLocationSelect, fetchAQI, defaultLat, defaultLng }: SavedLocationsProps) {
  const [locations, setLocations] = useState<SavedLocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [aqis, setAqis] = useState<Map<string, AQResponse | null>>(new Map());
  const [fetchingIds, setFetchingIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ location_name: string; location_type: "Other" | "Home" | "Office" | "College"; latitude: string; longitude: string }>({
    location_name: "",
    location_type: "Other",
    latitude: "",
    longitude: "",
  });

  // Initialize form with default lat/lng from map click / search if provided
  useEffect(() => {
    if (defaultLat !== undefined && defaultLng !== undefined) {
      setFormData({
        location_name: "",
        location_type: "Other",
        latitude: "",
        longitude: "",
      });
    }
  }, [defaultLat, defaultLng]);

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

      // Pre-fetch AQI for all loaded locations if fetchAQI is available
      if (fetchAQI) {
        const ids = new Set<string>();
        const pendingPromises = (data ?? []).map(async (loc) => {
          if (!Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude)) return;
          if (loc.latitude < INDIA_LAT_MIN || loc.latitude > INDIA_LAT_MAX ||
              loc.longitude < INDIA_LNG_MIN || loc.longitude > INDIA_LNG_MAX) return;
          ids.add(loc.id);
          setFetchingIds(ids);
          try {
            const result = await fetchAQI(loc.latitude, loc.longitude);
            setAqis((prev) => {
              const next = new Map(prev);
              next.set(loc.id, result);
              return next;
            });
          } catch {
            // Leave without entry — no badge shown
          } finally {
            setFetchingIds((prev) => {
              const next = new Set(prev);
              next.delete(loc.id);
              return next;
            });
          }
        });
        await Promise.all(pendingPromises);
      }
    } catch (error) {
      console.error("Failed to load locations:", error);
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
        return;
      }
    }

    setFormData({ location_name: "", location_type: "Other", latitude: "", longitude: "" });
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
    // If fetchAQI is available, re-fetch on explicit click for instant badge
    if (fetchAQI && Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude)) {
      try {
        const result = await fetchAQI(loc.latitude, loc.longitude);
        setAqis((prev) => {
          const next = new Map(prev);
          next.set(loc.id, result);
          return next;
        });
      } catch {
        // ignore
      }
    }
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ location_name: "", location_type: "Other", latitude: "", longitude: "" });
  }

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
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Location"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Location Name</label>
            <input
              type="text"
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              placeholder="e.g., Home, Office, College"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Location Name</label>
              <input
                type="text"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                placeholder="e.g., Home, Office, College"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                required
              />
            </div>
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

          <input
            type="hidden"
            name="latitude"
            value={formData.latitude || ""}
            defaultValue={formData.latitude || ""}
          />
          <input
            type="hidden"
            name="longitude"
            value={formData.longitude || ""}
            defaultValue={formData.longitude || ""}
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelForm}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              <Save className="h-4 w-4" /> {editingId ? "Update" : "Save"}
            </button>
          </div>
        </form>
      )}

      {locations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <MapPin className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No saved locations yet</p>
          <p className="text-xs text-slate-400">Add your home, office, or frequently visited places</p>
        </div>
      ) : (
        <div className="space-y-2">
          {locations.map((loc) => {
            const aqiData = aqis.get(loc.id) ?? null;
            const badge = getNAQIBadge(aqiData);
            const fetching = fetchingIds.has(loc.id);
            return (
              <div
                key={loc.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ background: badge ? `${badge.color}20` : "#f0f9ff", borderColor: badge ? badge.color : undefined }}
                  >
                    {fetching ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600 inline-block" />
                    ) : badge ? (
                      <span
                        className="text-xs font-bold text-white"
                        style={{ color: badge.color }}
                      >
                        {badge.naqi}
                      </span>
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
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => handleClick(loc)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-sky-600 transition-colors"
                    title="Select this location"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(loc)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                    title="Edit location"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(loc.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete location"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
