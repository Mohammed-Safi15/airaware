import { useState, useEffect } from "react";
import { supabase, LIFESTYLES, type Lifestyle, type LifestyleProfileRow, type SavedLocationRow } from "../lib/supabase";
import { useAuth } from "../App";
import { useProfiles } from "../lib/profileContext";

interface FormState {
  name: string;
  age: number;
  lifestyle: Lifestyle;
  healthConditionsText: string;
  homeLocationId: string;
  hasAirPurifier: boolean;
  usesN95Mask: boolean;
  ventilatesWindows: boolean;
}

const emptyForm: FormState = {
  name: "",
  age: 25,
  lifestyle: LIFESTYLES[0],
  healthConditionsText: "",
  homeLocationId: "",
  hasAirPurifier: false,
  usesN95Mask: false,
  ventilatesWindows: false,
};

function profileToForm(p: LifestyleProfileRow): FormState {
  return {
    name: p.name,
    age: p.age,
    lifestyle: p.lifestyle,
    healthConditionsText: (p.health_conditions ?? []).join(", "),
    homeLocationId: p.home_location_id ?? "",
    hasAirPurifier: p.has_air_purifier,
    usesN95Mask: p.uses_n95_mask,
    ventilatesWindows: p.ventilates_windows,
  };
}

export function LifestyleProfiles() {
  const { user } = useAuth();
  const { switchActive, refreshProfiles } = useProfiles();
  const [savedLocations, setSavedLocations] = useState<SavedLocationRow[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { profiles } = useProfiles();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase.from("saved_locations").select("*").then(({ data }) => {
      if (!cancelled) setSavedLocations((data as SavedLocationRow[]) ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Open the add form
  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setShowForm(true);
  };

  // Open the edit form pre-filled
  const openEdit = (p: LifestyleProfileRow) => {
    setForm(profileToForm(p));
    setEditingId(p.id);
    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setShowForm(false);
  };

  const saveProfile = async () => {
    if (!user || !form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setIsSaving(true);
    setError(null);

    const healthConditions = form.healthConditionsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      age: form.age,
      lifestyle: form.lifestyle,
      health_conditions: healthConditions,
      home_location_id: form.homeLocationId || null,
      has_air_purifier: form.hasAirPurifier,
      uses_n95_mask: form.usesN95Mask,
      ventilates_windows: form.ventilatesWindows,
    };

    let result;
    if (editingId) {
      result = await supabase.from("lifestyle_profiles").update(payload).eq("id", editingId);
    } else {
      result = await supabase.from("lifestyle_profiles").insert({ ...payload, user_id: user.id, is_active: profiles.length === 0 });
    }

    if (result.error) {
      setError(`Save failed: ${result.error.message}`);
    } else {
      await refreshProfiles();
      closeForm();
    }
    setIsSaving(false);
  };

  const deleteProfile = async (id: string) => {
    if (!confirm("Delete this lifestyle profile?")) return;
    await supabase.from("lifestyle_profiles").delete().eq("id", id);
    await refreshProfiles();
  };

  if (!user) return null;

  const active = profiles.find((p) => p.is_active) ?? null;
  const locationName = (id: string) => savedLocations.find((l) => l.id === id)?.location_name ?? "Unknown location";

  const toggle = (key: keyof FormState, label: string) => (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={form[key] as boolean}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
        className="h-4 w-4 rounded border-slate-300"
      />
      <span>{label}</span>
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lifestyle Profiles</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage household members. The active profile drives your Personal Exposure Score.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-lg bg-[var(--color-warm-dawn)] px-4 py-2 text-sm font-medium text-[var(--color-deep-pine)] shadow-sm transition-colors hover:bg-[var(--color-deep-pine)] hover:text-white"
        >
          + Add Profile
        </button>
      </div>

      {/* Active profile banner */}
      {active && (
        <div className="rounded-xl border border-[var(--color-sage-border)] bg-[var(--color-sage-border)]/60 p-4 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Profile</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{active.name}</p>
          <p className="text-sm text-slate-600">
            Age {active.age} · {active.lifestyle}
            {active.health_conditions.length > 0 && ` · ${active.health_conditions.join(", ")}`}
          </p>
        </div>
      )}

      {/* Profile cards */}
      {profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600">No profiles yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border bg-white/80 p-4 shadow-[0_8px_30px_rgb(30,46,36,0.06)] backdrop-blur-md transition-colors ${
                p.is_active ? "border-[var(--color-warm-dawn)]" : "border-white/60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {p.name}
                    {p.is_active && (
                      <span className="ml-2 rounded-full bg-[var(--color-warm-dawn)]/20 px-2 py-0.5 text-xs font-medium text-[var(--color-deep-pine)]">
                        active
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Age {p.age} · {p.lifestyle}
                  </p>
                  {p.health_conditions.length > 0 && (
                    <p className="mt-0.5 text-xs text-slate-400">Health: {p.health_conditions.join(", ")}</p>
                  )}
                  {p.home_location_id && (
                    <p className="mt-0.5 text-xs text-slate-400">Home: {locationName(p.home_location_id)}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {p.has_air_purifier && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Purifier</span>}
                {p.uses_n95_mask && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">N95 habit</span>}
                {p.ventilates_windows && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Ventilates</span>}
              </div>

              <div className="mt-3 flex gap-2">
                {!p.is_active && (
                  <button
                    onClick={() => switchActive(p.id)}
                    className="flex-1 rounded-lg bg-[var(--color-deep-pine)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteProfile(p.id)}
                  className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit form — inline panel */}
      {showForm && (
        <div className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-[0_8px_30px_rgb(30,46,36,0.06)] backdrop-blur-md">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {editingId ? "Edit Profile" : "New Profile"}
          </h2>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Name *</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                placeholder="e.g. Mohammed"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Age</span>
              <input
                type="number"
                min={0}
                max={120}
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: parseInt(e.target.value, 10) || 0 }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Lifestyle</span>
              <select
                value={form.lifestyle}
                onChange={(e) => setForm((f) => ({ ...f, lifestyle: e.target.value as Lifestyle }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {LIFESTYLES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Health conditions <span className="text-slate-400">(comma-separated)</span>
              </span>
              <input
                value={form.healthConditionsText}
                onChange={(e) => setForm((f) => ({ ...f, healthConditionsText: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                placeholder="e.g. asthma, hypertension"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Home location</span>
              <select
                value={form.homeLocationId}
                onChange={(e) => setForm((f) => ({ ...f, homeLocationId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">— none —</option>
                {savedLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.location_name} ({l.location_type})
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-2">
              {toggle("hasAirPurifier", "Has air purifier at home")}
              {toggle("usesN95Mask", "Uses N95 mask regularly")}
              {toggle("ventilatesWindows", "Ventilates / cross-ventilates windows")}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="rounded-lg bg-[var(--color-deep-pine)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : editingId ? "Save Changes" : "Create Profile"}
            </button>
            <button
              onClick={closeForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
