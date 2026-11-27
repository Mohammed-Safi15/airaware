import { useState, useEffect, useRef } from "react";
import {
  supabase,
  LIFESTYLES,
  LOCATION_TYPES,
  type Lifestyle,
  type LifestyleProfileRow,
  type SavedLocationRow,
  type LocationType,
} from "../lib/supabase";
import { useAuth } from "../App";
import { useProfiles } from "../lib/profileContext";
import { Check, X, Plus, Navigation, MapPin } from "lucide-react";

// ── India geofence (mirrors worker + SavedLocations.tsx) ─────────────────────
const INDIA_LAT_MIN = 8;
const INDIA_LAT_MAX = 35;
const INDIA_LNG_MIN = 68;
const INDIA_LNG_MAX = 97;

function inIndia(lat: number, lng: number): boolean {
  return lat >= INDIA_LAT_MIN && lat <= INDIA_LAT_MAX && lng >= INDIA_LNG_MIN && lng <= INDIA_LNG_MAX;
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

// ── Add / Edit form (existing profiles panel) ────────────────────────────────
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

// ── Wizard option sets ────────────────────────────────────────────────────────
// Lifestyle / Daily Role — uses the shared LIFESTYLES set so the wizard
// writes the same values as the add/edit panel (DB column is a fixed set).

// Health Conditions chips — "None" is mutually exclusive; +Other reveals inline text
const STEP2_HEALTH_OPTIONS = [
  { value: "None", isMutuallyExclusive: true },
  { value: "Asthma", isMutuallyExclusive: false },
  { value: "Allergies", isMutuallyExclusive: false },
  { value: "Respiratory Sensitivity", isMutuallyExclusive: false },
  { value: "Cardiac Condition", isMutuallyExclusive: false },
  { value: "Sinus / Bronchitis", isMutuallyExclusive: false },
];

// Protective Habits chips — +Other reveals inline text
const STEP2_PROTECTIVE_OPTIONS = [
  { value: "N95 / KN95 Mask", isMutuallyExclusive: false },
  { value: "Indoor HEPA Purifier", isMutuallyExclusive: false },
  { value: "Window Ventilation", isMutuallyExclusive: false },
  { value: "Check AQI Before Outdoors", isMutuallyExclusive: false },
  { value: "Avoid Peak Traffic", isMutuallyExclusive: false },
];

interface WizardState {
  name: string;
  age: number;
  lifestyle: Lifestyle;
  healthConditions: string[];
  protectiveHabits: string[];
  homeLocationId: string;
  /** Live drafts for the +Other inline inputs (cleared on add). */
  otherHealthCustom?: string;
  otherProtectiveCustom?: string;
}

const emptyWizard: WizardState = {
  name: "",
  age: 25,
  lifestyle: LIFESTYLES[0],
  healthConditions: [],
  protectiveHabits: [],
  homeLocationId: "",
};

const WIZARD_STEPS = ["Basics", "Sensitivities", "Home Base"];

export function LifestyleProfiles() {
  const { user } = useAuth();
  const { profiles, switchActive, refreshProfiles } = useProfiles();
  const [savedLocations, setSavedLocations] = useState<SavedLocationRow[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Profile Builder Wizard ───────────────────────────────────────────
  // Step shown when the wizard first opens (zero profiles yet)
  const [wizardOpen, setWizardOpen] = useState(false);
  // Active step; a *pending* step is the one being animated out
  const [wStep, setWStep] = useState(1);
  const [wizard, setWizard] = useState<WizardState>(emptyWizard);
  // Directional transition state (emil-design-eng: translateX + opacity, ≤300ms)
  const [prevStep, setPrevStep] = useState<number | null>(null);
  const [direction, setDirection] = useState<"fwd" | "bwd">("fwd");

  // GPS "Use My Current Location" (SavedLocations.tsx pattern)
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [manualHome, setManualHome] = useState({
    name: "",
    latitude: "",
    longitude: "",
    locationType: "Home" as LocationType,
  });
  const [showManualHome, setShowManualHome] = useState(false);
  const [savingHome, setSavingHome] = useState(false);
  const [wizardSaveError, setWizardSaveError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Monotonic counter so a slow GPS reverse-geocode can never overwrite a
  // newer manual entry.
  const pickSeq = useRef(0);

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
      result = await supabase.from("lifestyle_profiles").insert({
        ...payload,
        user_id: user.id,
        is_active: profiles.length === 0,
      });
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

  // ── Wizard: directional step transitions ────────────────────────────
  const goWizardStep = (next: number) => {
    if (next === wStep) return;
    setDirection(next > wStep ? "fwd" : "bwd");
    setPrevStep(wStep);
    setWStep(next);
  };

  // Hide the exiting step once its out-animation settles (280ms).
  useEffect(() => {
    if (prevStep === null) return;
    const t = window.setTimeout(() => setPrevStep(null), 300);
    return () => window.clearTimeout(t);
  }, [prevStep]);

  const closeWizard = () => {
    setWizardOpen(false);
    setWizard(emptyWizard);
    setWStep(1);
    setPrevStep(null);
    setShowManualHome(false);
    setManualHome({ name: "", latitude: "", longitude: "", locationType: "Home" });
    setGpsError(null);
    setWizardSaveError(null);
  };

  // ── Wizard: Step 2 chip logic ────────────────────────────────────────
  const toggleHealth = (value: string) => {
    setWizard((w) => {
      if (value === "None") {
        // "None" clears every other condition; re-selecting it is a no-op.
        return { ...w, healthConditions: w.healthConditions.includes("None") ? [] : ["None"] };
      }
      const withoutNone = w.healthConditions.filter((c) => c !== "None");
      const next = w.healthConditions.includes(value)
        ? withoutNone.filter((c) => c !== value)
        : [...withoutNone, value];
      return { ...w, healthConditions: next };
    });
  };

  const toggleProtective = (value: string) => {
    setWizard((w) => ({
      ...w,
      protectiveHabits: w.protectiveHabits.includes(value)
        ? w.protectiveHabits.filter((c) => c !== value)
        : [...w.protectiveHabits, value],
    }));
  };

  const addCustomHealth = () => {
    const v = wizard.otherHealthCustom?.trim() ?? "";
    if (!v) return;
    setWizard((w) =>
      w.healthConditions.includes(v) ? w : { ...w, healthConditions: [...w.healthConditions.filter((c) => c !== "None"), v] }
    );
  };

  const addCustomProtective = () => {
    const v = wizard.otherProtectiveCustom?.trim() ?? "";
    if (!v) return;
    setWizard((w) =>
      w.protectiveHabits.includes(v) ? w : { ...w, protectiveHabits: [...w.protectiveHabits, v] }
    );
  };

  const removeSelectedChip = (section: "health" | "protective", value: string) => {
    setWizard((w) =>
      section === "health"
        ? { ...w, healthConditions: w.healthConditions.filter((c) => c !== value) }
        : { ...w, protectiveHabits: w.protectiveHabits.filter((c) => c !== value) }
    );
  };

  // ── Wizard: Step 3 GPS (SavedLocations.tsx pattern) ─────────────────
  const startGps = () => {
    setGpsError(null);
    if (!("geolocation" in navigator)) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGpsLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!inIndia(lat, lng)) {
          setGpsError("Your location appears to be outside India. AirAware currently supports India only.");
          return;
        }
        pickSeq.current += 1;
        const seq = pickSeq.current;
        setManualHome((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng), name: "" }));
        setShowManualHome(true);
        const name = await reverseGeocodeName(lat, lng);
        if (seq === pickSeq.current) {
          setManualHome((prev) => (name ? { ...prev, name: name } : prev));
        }
      },
      (err) => {
        setGpsLoading(false);
        console.error("Geolocation error:", err);
        setGpsError("Unable to get your location. Please enable location access, or enter it manually.");
      },
      { timeout: 10000 }
    );
  };

  // Save the manual home as a new saved_locations row and link it.
  const saveManualHome = async () => {
    if (!user) return;
    const lat = parseFloat(manualHome.latitude);
    const lng = parseFloat(manualHome.longitude);
    if (!manualHome.name.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (!inIndia(lat, lng)) {
      setGpsError("Those coordinates are outside India. AirAware currently supports India only.");
      return;
    }
    pickSeq.current += 1;
    setSavingHome(true);
    setGpsError(null);
    const { data, error: insertError } = await supabase.from("saved_locations").insert({
      user_id: user.id,
      location_name: manualHome.name.trim(),
      latitude: lat,
      longitude: lng,
      location_type: manualHome.locationType,
    });
    setSavingHome(false);
    if (insertError || !data) {
      setGpsError(insertError ? `Could not save location: ${insertError.message}` : "Could not save location.");
      return;
    }
    // Insert-if-new: capture the new row's ID and link it to the wizard.
    const newRow = data[0] as SavedLocationRow | undefined;
    if (newRow?.id) {
      setWizard((w) => ({ ...w, homeLocationId: newRow.id }));
      setSavedLocations((prev) => [newRow, ...prev]);
      setManualHome({ name: "", latitude: "", longitude: "", locationType: "Home" });
    }
  };

  const wizardHomeLinked = savedLocations.some((l) => l.id === wizard.homeLocationId);

  // ── Wizard: Confirm & Create ─────────────────────────────────────────
  const confirmWizard = async () => {
    if (!user || confirming) return;
    if (!wizard.name.trim()) {
      setWizardSaveError("Please add a name in Step 1 before confirming.");
      setWStep(1);
      setPrevStep(null);
      setDirection("bwd");
      return;
    }
    setConfirming(true);
    setWizardSaveError(null);
    const payload = {
      name: wizard.name.trim(),
      age: wizard.age,
      lifestyle: wizard.lifestyle,
      health_conditions: wizard.healthConditions,
      home_location_id: wizard.homeLocationId || null,
      has_air_purifier: wizard.protectiveHabits.includes("Indoor HEPA Purifier"),
      uses_n95_mask: wizard.protectiveHabits.some((h) => h.toLowerCase().startsWith("n95")),
      ventilates_windows: wizard.protectiveHabits.some((h) =>
        h.toLowerCase().includes("ventilat")
      ),
      is_active: true,
      user_id: user.id,
    };
    const { error: insertError } = await supabase.from("lifestyle_profiles").insert(payload);
    setConfirming(false);
    if (insertError) {
      setWizardSaveError(`Save failed: ${insertError.message}`);
      return;
    }
    await refreshProfiles();
    closeWizard();
  };

  if (!user) return null;

  const active = profiles.find((p) => p.is_active) ?? null;
  const locationName = (id: string) =>
    savedLocations.find((l) => l.id === id)?.location_name ?? "Unknown location";

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

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--color-sky-accent)] focus:ring-2 focus:ring-[var(--color-sky-accent)]/20";
  const primaryBtnClass =
    "press-soft inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-deep-pine)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-deep-pine-soft)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const secondaryBtnClass =
    "press-soft rounded-lg border border-[var(--color-sage-border)] bg-white/60 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white active:scale-[0.98]";

  // Chip button used by both Step 2 chip grids
  const chipButton = (
    value: string,
    selected: boolean,
    onToggle: () => void,
    exclusiveIcon: "check" | "none"
  ) => (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`press-soft flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors active:scale-[0.98] ${
        selected
          ? "border-[var(--color-deep-pine)] bg-[var(--color-deep-pine)] text-white"
          : "border-[var(--color-sage-border)] bg-white/70 text-slate-600 hover:border-[var(--color-pine-mist)] hover:bg-white"
      }`}
    >
      {selected && exclusiveIcon === "check" && <Check className="h-3.5 w-3.5" />}
      {selected && value === "None" && <X className="h-3.5 w-3.5" />}
      {value}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-deep-pine)]">
            Lifestyle <em className="text-[var(--color-warm-dawn)]">Profiles</em>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage household members. The active profile drives your Personal Exposure Score.
          </p>
        </div>
        <button
          onClick={openAdd}
          className={primaryBtnClass}
        >
          <Plus className="h-4 w-4" /> Add Profile
        </button>
      </div>

      {/* Active profile banner */}
      {active && (
        <div className="rounded-xl border border-[var(--color-sage-border)] bg-[var(--color-sage-border)]/40 p-4 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Profile</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{active.name}</p>
          <p className="text-sm text-slate-600">
            Age {active.age} · {active.lifestyle}
            {active.health_conditions.length > 0 && ` · ${active.health_conditions.join(", ")}`}
          </p>
        </div>
      )}

      {/* ── Zero profiles: intro + Profile Builder Wizard ─────────────── */}
      {profiles.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-6 shadow-[0_8px_30px_rgb(30,46,36,0.06)] backdrop-blur-md sm:p-8">
          {/* Sky-Blue / Canopy-Mist gradient washes behind the frosted card */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-sky-soft)] via-transparent to-[var(--color-canopy-mist)]" />
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[var(--color-sky-accent)]/10 blur-2xl" />
            <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[var(--color-canopy-mist)]/60 blur-2xl" />
          </div>

          <div className="relative">
            <p className="text-sm text-slate-600">
              No profiles yet. Looks like this is your first time! Let&rsquo;s set up your profile.
            </p>

            {!wizardOpen && (
              <div className="mt-4">
                <button onClick={() => setWizardOpen(true)} className={primaryBtnClass}>
                  <MapPin className="h-4 w-4" />
                  Start Profile Builder
                </button>
              </div>
            )}

            {wizardOpen && (
              <div className="mt-6">
                {/* Animated 3-step progress rail */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    {WIZARD_STEPS.map((label, i) => {
                      const stepNum = i + 1;
                      const isDone = wStep > stepNum;
                      const isCurrent = wStep === stepNum;
                      return (
                        <div key={label} className="flex items-center gap-2">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                              isDone || isCurrent
                                ? "bg-[var(--color-deep-pine)] text-white"
                                : "bg-[var(--color-sage-border)] text-slate-500"
                            }`}
                          >
                            {isDone ? <Check className="h-3.5 w-3.5" /> : stepNum}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              isCurrent ? "text-[var(--color-deep-pine)]" : "text-slate-400"
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-sage-border)]">
                    <div
                      className="wiz-progress-fill h-full rounded-full bg-gradient-to-r from-[var(--color-sky-accent)] to-[var(--color-deep-pine)]"
                      style={{ width: `${((wStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Exiting step (settles out over 280ms on --ease-soft) */}
                {prevStep !== null && (
                  <div className={`relative ${direction === "fwd" ? "wiz-out-f" : "wiz-out-b"}`} aria-hidden="true">
                    {renderWizardStep(prevStep)}
                  </div>
                )}
                {/* Entering step */}
                <div className={direction === "fwd" ? "wiz-in-f" : "wiz-in-b"}>
                  {renderWizardStep(wStep)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile cards */}
      {profiles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((p, idx) => (
            <div
              key={p.id}
              className={`animate-card-rise rounded-xl border bg-white/80 p-4 shadow-[0_8px_30px_rgb(30,46,36,0.06)] backdrop-blur-md transition-colors ${
                p.is_active ? "border-[var(--color-warm-dawn)]" : "border-white/60"
              }`}
              style={{ animationDelay: `${Math.min(idx, 8) * 50}ms` }}
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
                {p.has_air_purifier && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Purifier</span>
                )}
                {p.uses_n95_mask && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">N95 habit</span>
                )}
                {p.ventilates_windows && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Ventilates</span>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                {!p.is_active && (
                  <button
                    onClick={() => switchActive(p.id)}
                    className="flex-1 rounded-lg bg-[var(--color-deep-pine)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-deep-pine-soft)]"
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
                className={inputClass}
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
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Lifestyle</span>
              <select
                value={form.lifestyle}
                onChange={(e) => setForm((f) => ({ ...f, lifestyle: e.target.value as Lifestyle }))}
                className={inputClass}
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
                className={inputClass}
                placeholder="e.g. asthma, hypertension"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Home location</span>
              <select
                value={form.homeLocationId}
                onChange={(e) => setForm((f) => ({ ...f, homeLocationId: e.target.value }))}
                className={inputClass}
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
              className={primaryBtnClass}
            >
              {isSaving ? "Saving…" : editingId ? "Save Changes" : "Create Profile"}
            </button>
            <button onClick={closeForm} className={secondaryBtnClass}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Wizard step bodies ───────────────────────────────────────────────────
  // Rendered for both the exiting (prevStep) and entering (wStep) layers,
  // so the directional transition keeps full field state throughout.
  function renderWizardStep(step: number) {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-[var(--color-deep-pine)]">
              Who is this <em className="text-[var(--color-warm-dawn)]">profile</em> for?
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Name *</span>
                <input
                  value={wizard.name}
                  onChange={(e) => setWizard((w) => ({ ...w, name: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. Mohammed"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Age</span>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={wizard.age}
                  onChange={(e) => setWizard((w) => ({ ...w, age: parseInt(e.target.value, 10) || 0 }))}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Lifestyle / Daily Role</span>
              <select
                value={wizard.lifestyle}
                onChange={(e) => setWizard((w) => ({ ...w, lifestyle: e.target.value as Lifestyle }))}
                className={inputClass}
              >
                {LIFESTYLES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-3 pt-1">
              <button onClick={() => goWizardStep(2)} className={primaryBtnClass}>
                Next →
              </button>
              <button onClick={closeWizard} className={secondaryBtnClass}>
                Skip for now
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-[var(--color-deep-pine)]">
              Health <em className="text-[var(--color-warm-dawn)]">sensitivities</em> & habits
            </h2>

            {/* Health Conditions chips */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Health Conditions</p>
              <div className="flex flex-wrap gap-2">
                {STEP2_HEALTH_OPTIONS.map((o) =>
                  chipButton(
                    o.value,
                    wizard.healthConditions.includes(o.value),
                    () => toggleHealth(o.value),
                    "check"
                  )
                )}
                {/* +Other inline input */}
                <div className="flex items-center gap-1.5">
                  <input
                    value={wizard.otherHealthCustom ?? ""}
                    onChange={(e) => setWizard((w) => ({ ...w, otherHealthCustom: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomHealth();
                        setWizard((w) => ({ ...w, otherHealthCustom: "" }));
                      }
                    }}
                    className="w-44 rounded-full border border-[var(--color-sage-border)] bg-white/70 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-[var(--color-sky-accent)] focus:ring-2 focus:ring-[var(--color-sky-accent)]/20"
                    placeholder="+ Other…"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addCustomHealth();
                      setWizard((w) => ({ ...w, otherHealthCustom: "" }));
                    }}
                    aria-label="Add custom health condition"
                    className="press-soft rounded-full bg-[var(--color-deep-pine)] p-1.5 text-white hover:bg-[var(--color-deep-pine-soft)] active:scale-[0.98]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {/* Live selected strip */}
              {wizard.healthConditions.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Selected
                  </span>
                  {wizard.healthConditions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => removeSelectedChip("health", c)}
                      className="flex items-center gap-1 rounded-full bg-[var(--color-deep-pine)] px-2.5 py-0.5 text-xs text-white hover:bg-[var(--color-deep-pine-soft)]"
                      aria-label={`Remove ${c}`}
                    >
                      {c}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Protective Habits chips */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Protective Habits</p>
              <div className="flex flex-wrap gap-2">
                {STEP2_PROTECTIVE_OPTIONS.map((o) =>
                  chipButton(
                    o.value,
                    wizard.protectiveHabits.includes(o.value),
                    () => toggleProtective(o.value),
                    "none"
                  )
                )}
                {/* +Other inline input */}
                <div className="flex items-center gap-1.5">
                  <input
                    value={wizard.otherProtectiveCustom ?? ""}
                    onChange={(e) => setWizard((w) => ({ ...w, otherProtectiveCustom: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomProtective();
                        setWizard((w) => ({ ...w, otherProtectiveCustom: "" }));
                      }
                    }}
                    className="w-44 rounded-full border border-[var(--color-sage-border)] bg-white/70 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-[var(--color-sky-accent)] focus:ring-2 focus:ring-[var(--color-sky-accent)]/20"
                    placeholder="+ Other…"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addCustomProtective();
                      setWizard((w) => ({ ...w, otherProtectiveCustom: "" }));
                    }}
                    aria-label="Add custom protective habit"
                    className="press-soft rounded-full bg-[var(--color-deep-pine)] p-1.5 text-white hover:bg-[var(--color-deep-pine-soft)] active:scale-[0.98]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {/* Live selected strip */}
              {wizard.protectiveHabits.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Selected
                  </span>
                  {wizard.protectiveHabits.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => removeSelectedChip("protective", c)}
                      className="flex items-center gap-1 rounded-full bg-[var(--color-deep-pine)] px-2.5 py-0.5 text-xs text-white hover:bg-[var(--color-deep-pine-soft)]"
                      aria-label={`Remove ${c}`}
                    >
                      {c}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => goWizardStep(1)} className={secondaryBtnClass}>
                ← Back
              </button>
              <button onClick={() => goWizardStep(3)} className={primaryBtnClass}>
                Next →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-[var(--color-deep-pine)]">
              Where do you live <em className="text-[var(--color-warm-dawn)]">most</em>?
            </h2>
            <p className="text-sm text-slate-500">
              Use GPS, pick a saved location, or skip — we&rsquo;ll finish your profile either way.
            </p>

            {/* GPS — SavedLocations.tsx pattern */}
            <button
              type="button"
              onClick={startGps}
              disabled={gpsLoading}
              className={secondaryBtnClass}
            >
              <Navigation className="h-4 w-4 text-[var(--color-sky-accent)]" />
              {gpsLoading ? "Getting your location…" : "Use My Current Location"}
            </button>
            {gpsError && <p className="text-xs text-red-600">{gpsError}</p>}

            {/* Manual entry (auto-shown after a GPS pick, or on demand) */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Manual Entry</span>
                <button
                  type="button"
                  onClick={() => setShowManualHome((s) => !s)}
                  className="text-xs font-medium text-[var(--color-sky-accent)] hover:underline"
                >
                  {showManualHome ? "Hide" : "Enter manually"}
                </button>
              </div>
              {showManualHome && (
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Place name</span>
                    <input
                      value={manualHome.name}
                      onChange={(e) => setManualHome((m) => ({ ...m, name: e.target.value }))}
                      className={inputClass}
                      placeholder="e.g. Home, 12 Main Street"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Latitude</span>
                    <input
                      value={manualHome.latitude}
                      onChange={(e) => {
                        pickSeq.current += 1;
                        setManualHome((m) => ({ ...m, latitude: e.target.value }));
                      }}
                      className={inputClass}
                      placeholder="e.g. 17.3829"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Longitude</span>
                    <input
                      value={manualHome.longitude}
                      onChange={(e) => {
                        pickSeq.current += 1;
                        setManualHome((m) => ({ ...m, longitude: e.target.value }));
                      }}
                      className={inputClass}
                      placeholder="e.g. 78.4892"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Location type</span>
                    <select
                      value={manualHome.locationType}
                      onChange={(e) => setManualHome((m) => ({ ...m, locationType: e.target.value as LocationType }))}
                      className={inputClass}
                    >
                      {LOCATION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => void saveManualHome()}
                      disabled={savingHome || !manualHome.name.trim()}
                      className={primaryBtnClass}
                    >
                      {savingHome ? "Saving…" : "Save as location"}
                    </button>
                    {wizardHomeLinked && (
                      <span className="ml-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <Check className="h-3.5 w-3.5" /> Linked to this profile
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Saved-location select */}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Or link a saved location
              </span>
              <select
                value={wizard.homeLocationId}
                onChange={(e) => setWizard((w) => ({ ...w, homeLocationId: e.target.value }))}
                className={inputClass}
              >
                <option value="">— none / skip —</option>
                {savedLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.location_name} ({l.location_type})
                  </option>
                ))}
              </select>
            </label>

            {/* Compact Profile Summary Card above confirm */}
            <div className="rounded-xl border border-[var(--color-sage-border)] bg-[var(--color-canopy-mist)]/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Profile summary
              </p>
              <dl className="mt-2 grid grid-cols-1 gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
                <div className="flex justify-between gap-3 sm:block">
                  <dt className="text-xs font-medium text-slate-400">Name</dt>
                  <dd className="font-semibold text-slate-900">{wizard.name.trim() || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3 sm:block">
                  <dt className="text-xs font-medium text-slate-400">Age · Lifestyle</dt>
                  <dd>
                    {wizard.age} · {wizard.lifestyle}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 sm:block">
                  <dt className="text-xs font-medium text-slate-400">Health</dt>
                  <dd>
                    {wizard.healthConditions.length > 0 ? wizard.healthConditions.join(", ") : "None"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 sm:block">
                  <dt className="text-xs font-medium text-slate-400">Protective habits</dt>
                  <dd>
                    {wizard.protectiveHabits.length > 0 ? wizard.protectiveHabits.join(", ") : "None"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 sm:col-span-2 sm:block">
                  <dt className="text-xs font-medium text-slate-400">Home</dt>
                  <dd>
                    {wizard.homeLocationId
                      ? locationName(wizard.homeLocationId)
                      : "No home linked yet"}
                  </dd>
                </div>
              </dl>
            </div>

            {wizardSaveError && <p className="text-xs text-red-600">{wizardSaveError}</p>}

            <div className="flex flex-wrap gap-3 pt-1">
              <button onClick={() => goWizardStep(2)} className={secondaryBtnClass}>
                ← Back
              </button>
              <button onClick={() => void confirmWizard()} disabled={confirming} className={primaryBtnClass}>
                {confirming ? "Creating…" : "Confirm & Create Profile"}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
}
