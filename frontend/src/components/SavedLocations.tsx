import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { SavedLocationRow, LocationType } from "../lib/supabase";
import { Plus, Trash2, MapPin, Edit2, Save, X } from "lucide-react";

interface SavedLocationsProps {
  userId: string;
  onLocationSelect: (lat: number, lng: number, name: string) => void;
}

export function SavedLocations({ userId, onLocationSelect }: SavedLocationsProps) {
  const [locations, setLocations] = useState<SavedLocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    location_name: "",
    latitude: "",
    longitude: "",
    location_type: "Other" as LocationType,
  });

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
    } catch (error) {
      console.error("Failed to load locations:", error);
    } finally {
      setLoading(false);
    }
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

    setFormData({ location_name: "", latitude: "", longitude: "", location_type: "Other" });
    setShowForm(false);
    await loadLocations();
  }

  function startEdit(loc: SavedLocationRow) {
    setEditingId(loc.id);
    setFormData({
      location_name: loc.location_name,
      latitude: String(loc.latitude),
      longitude: String(loc.longitude),
      location_type: loc.location_type,
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

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ location_name: "", latitude: "", longitude: "", location_type: "Other" });
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="12.9716"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="77.5946"
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
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{loc.location_name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} · {loc.location_type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onLocationSelect(loc.latitude, loc.longitude, loc.location_name)}
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
          ))}
        </div>
      )}
    </div>
  );
}
