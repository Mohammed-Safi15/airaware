import { useState, useEffect } from "react";
import { MapView } from "../components/MapView";
import { useAuth } from "../App";
import { useProfiles } from "../lib/profileContext";
import {
  supabase,
  ACTIVE_DAYS,
  ROUTINE_ENVIRONMENT_TYPES,
  TRANSIT_MODES,
  TRANSIT_MODE_LABELS,
  saveExposureSnapshot,
  type RoutineRow,
  type RoutineSegmentRow,
  type RoutineStop,
  type SavedLocationRow,
  type TransitMode,
} from "../lib/supabase";
import {
  computeExposure,
  toExposureStop,
  fetchStopAqi,
  type ExposureResult,
} from "../lib/exposure";
import type { AdviceOutcome } from "../lib/advice";
import { Clock, MapPin, Pencil, Plus, Trash2, AlertCircle } from "lucide-react";

/** One routine editor form — mirrors the Phase 4 commute_routines extension columns. */
interface RoutineForm {
  id: string | null;
  name: string;
  transit_mode: TransitMode;
  departure_time: string;
  return_time: string;
  active_days: string[];
  stops: RoutineStop[];
}

const emptyForm: RoutineForm = {
  id: null,
  name: "",
  transit_mode: "walk",
  departure_time: "09:00",
  return_time: "18:00",
  active_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  stops: [],
};

const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;

/** Result of a "Check Routine AQI" run for one routine. */
interface RoutineCheck {
  result: ExposureResult;
  at: number;
}

function segsToStops(segs: RoutineSegmentRow[], locs: SavedLocationRow[]): RoutineStop[] {
  return segs.map((s) => {
    const saved = s.location_id ? locs.find((l) => l.id === s.location_id) : null;
    return {
      location_id: s.location_id,
      label: saved
        ? saved.location_name
        : `Pinpoint (${(s.latitude ?? 0).toFixed(4)}, ${(s.longitude ?? 0).toFixed(4)})`,
      latitude: s.latitude ?? saved?.latitude ?? null,
      longitude: s.longitude ?? saved?.longitude ?? null,
      environment_type: s.environment_type as RoutineStop["environment_type"],
      duration_minutes: s.duration_minutes,
    };
  });
}

function totalDurationLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function RoutinesPage() {
  const { user } = useAuth();
  const { activeProfile } = useProfiles();

  const [routines, setRoutines] = useState<RoutineRow[]>([]);
  const [segments, setSegments] = useState<Record<string, RoutineSegmentRow[]>>({});
  const [savedLocations, setSavedLocations] = useState<SavedLocationRow[]>([]);
  const [checks, setChecks] = useState<Record<string, RoutineCheck>>({});
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoutineForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addLocationId, setAddLocationId] = useState("");
  const [picking, setPicking] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adviceState, setAdviceState] = useState<Record<string, { status: "idle" | "loading" | "success" | "error"; outcome: AdviceOutcome | null; error: string | null }>>({});

  async function reload() {
    if (!user) return;
    try {
      const [{ data: r, error: rError }, { data: s, error: sError }, { data: l, error: lError }] = await Promise.all([
        supabase
          .from("commute_routines")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("daily_routine_segments").select("*").eq("user_id", user.id),
        supabase.from("saved_locations").select("*"),
      ]);

      if (rError || sError || lError) {
        setLoadError(`Failed to load routines: ${rError?.message || sError?.message || lError?.message || "Unknown error"}`);
        return;
      }

      setRoutines((r as RoutineRow[]) ?? []);
      const map: Record<string, RoutineSegmentRow[]> = {};
      for (const seg of (s as RoutineSegmentRow[]) ?? []) {
        if (!seg.routine_id) continue;
        (map[seg.routine_id] ??= []).push(seg);
      }
      Object.values(map).forEach((list) => list.sort((a, b) => a.sequence_order - b.sequence_order));
      setSegments(map);
      setSavedLocations((l as SavedLocationRow[]) ?? []);
      setLoadError(null);
    } catch (err) {
      setLoadError(`Failed to load routines: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Routine CRUD ─────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm({ ...emptyForm, stops: [] });
    setFormError(null);
    setAddLocationId("");
    setPicking(false);
  };

  const openEdit = (r: RoutineRow) => {
    setForm({
      id: r.id,
      name: r.name || "Untitled routine",
      transit_mode: r.transit_mode ?? "walk",
      departure_time: r.departure_time ?? "09:00",
      return_time: r.return_time ?? "18:00",
      active_days: r.active_days?.length ? r.active_days : [],
      stops: segsToStops(segments[r.id] ?? [], savedLocations),
    });
    setFormError(null);
    setAddLocationId("");
    setPicking(false);
  };

  const closeForm = () => {
    setForm(null);
    setFormError(null);
    setPicking(false);
  };

  const saveRoutine = async () => {
    if (!user || !form) return;
    if (!form.name.trim()) {
      setFormError("Routine name is required.");
      return;
    }
    if (form.stops.length === 0) {
      setFormError("Add at least one stop (saved location or map pinpoint).");
      return;
    }
    setSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      transit_mode: form.transit_mode,
      departure_time: form.departure_time || null,
      return_time: form.return_time || null,
      active_days: form.active_days,
    };

    try {
      let routineId = form.id;
      if (form.id) {
        const { error } = await supabase.from("commute_routines").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("commute_routines")
          .insert({ ...payload, user_id: user.id })
          .select();
        if (error) throw error;
        routineId = data?.[0]?.id ?? null;
        if (!routineId) throw new Error("could not create routine");
      }

      // Rebuild the stop list from scratch (delete-then-insert keeps ordering clean).
      if (form.id) {
        await supabase.from("daily_routine_segments").delete().eq("routine_id", form.id);
      }
      if (form.stops.length > 0 && routineId) {
        const inserts = form.stops.map((s, i) => ({
          user_id: user.id,
          routine_id: routineId,
          location_id: s.location_id,
          latitude: s.latitude,
          longitude: s.longitude,
          environment_type: s.environment_type,
          duration_minutes: Math.max(1, s.duration_minutes),
          sequence_order: i + 1,
        }));
        const { error } = await supabase.from("daily_routine_segments").insert(inserts);
        if (error) throw error;
      }

      setForm(null);
      await reload();
    } catch (err) {
      setFormError(`Save failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteRoutine = async (id: string) => {
    if (!confirm("Delete this routine? Its stops will be removed too.")) return;
    await supabase.from("commute_routines").delete().eq("id", id);
    setChecks((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await reload();
  };

  // ── One-click multi-location AQI check ────────────────────────────────────

  const checkRoutine = async (id: string) => {
    const routine = routines.find((r) => r.id === id);
    if (!routine) return;
    const stops = segsToStops(segments[id] ?? [], savedLocations);
    setCheckingId(id);

    // Concurrent live /api/aqi fetches — each stop gets the NAQI/US AQI the
    // worker computes for that stop's own location (no station averaging).
    const aqi = await Promise.all(
      stops.map((s) =>
        s.latitude != null && s.longitude != null
          ? fetchStopAqi(s.latitude, s.longitude)
          : Promise.resolve(null),
      ),
    );
    const stopInputs = stops.map((s, i) =>
      toExposureStop(s.label, s.duration_minutes / 60, s.environment_type, aqi[i]),
    );
    const result = computeExposure(
      stopInputs,
      activeProfile,
      routine.transit_mode ?? null,
      routine.departure_time ?? null,
    );
    setChecks((prev) => ({ ...prev, [id]: { result, at: Date.now() } }));
    setCheckingId(null);

    // ── Phase 5C: auto-save this check as an exposure snapshot (History page) ──
    // Fire-and-forget — a snapshot write failure must not block the check UI.
    if (user) {
      void saveExposureSnapshot(user, {
        profile_id: activeProfile?.id ?? null,
        routine_id: id,
        routine_name: routine.name,
        exposure_score: result.score,
        total_dose: result.totalDose,
        stop_naqi_summary: stops.map((s, i) => ({
          label: s.label,
          naqi: aqi[i]?._meta?.naqi ?? null,
          usAqi: aqi[i]?._meta?.usAqi ?? null,
          reliability: aqi[i]?.primary?.reliability ?? null,
          hours: s.duration_minutes / 60,
          environment_type: s.environment_type,
        })),
      }).then((err) => {
        if (err) console.warn("Failed to save exposure snapshot:", err);
      });
    }

    // ── Hybrid advice card: POST /api/advice ─────────────────────────────────
    setAdviceState((prev) => ({
      ...prev,
      [id]: {
        status: "loading",
        outcome: null,
        error: null,
      },
    }));

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787/api";
      const resp = await fetch(`${apiBase}/advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: activeProfile
            ? {
                name: activeProfile.name,
                age: activeProfile.age,
                lifestyle: activeProfile.lifestyle,
                health_conditions: activeProfile.health_conditions ?? [],
                has_air_purifier: activeProfile.has_air_purifier,
                uses_n95_mask: activeProfile.uses_n95_mask,
                ventilates_windows: activeProfile.ventilates_windows,
              }
            : null,
          stops: stops.map((s, i) => ({
            label: s.label,
            naqi: aqi[i]?._meta?.naqi ?? null,
            usAqi: aqi[i]?._meta?.usAqi ?? null,
            categoryLabel: s.environment_type,
            hours: s.duration_minutes / 60,
            environmentType: s.environment_type,
          })),
          exposureScore: result.score,
          departureTime: routine.departure_time ?? null,
          transitMode: routine.transit_mode ?? "walk",
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`advice API ${resp.status}: ${txt}`);
      }
      const outcome: AdviceOutcome = await resp.json();
      setAdviceState((prev) => ({
        ...prev,
        [id]: { status: "success", outcome, error: null },
      }));
    } catch (err) {
      setAdviceState((prev) => ({
        ...prev,
        [id]: { status: "error", outcome: null, error: err instanceof Error ? err.message : String(err) },
      }));
    }
  };

  // ── Stop editor helpers ───────────────────────────────────────────────────

  const updateStop = (i: number, patch: Partial<RoutineStop>) =>
    setForm((f) => f && { ...f, stops: f.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  const removeStop = (i: number) =>
    setForm((f) => f && { ...f, stops: f.stops.filter((_s, j) => j !== i) });

  const addSavedLocation = () => {
    const loc = savedLocations.find((l) => l.id === addLocationId);
    if (!loc) return;
    setForm((f) =>
      f && {
        ...f,
        stops: [
          ...f.stops,
          {
            location_id: loc.id,
            label: loc.location_name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            environment_type: "Outdoor",
            duration_minutes: 60,
          },
        ],
      },
    );
    setAddLocationId("");
  };

  const addPinpoint = (lat: number, lng: number) => {
    setForm((f) =>
      f && {
        ...f,
        stops: [
          ...f.stops,
          {
            location_id: null,
            label: `Pinpoint (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            latitude: lat,
            longitude: lng,
            environment_type: "Outdoor",
            duration_minutes: 60,
          },
        ],
      },
    );
    setPicking(false);
  };

  const pickCenter = (() => {
    const withCoords = form?.stops.find((s) => s.latitude != null && s.longitude != null);
    return {
      lat: withCoords?.latitude ?? DEFAULT_LAT,
      lng: withCoords?.longitude ?? DEFAULT_LNG,
    };
  })();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Load Error Alert */}
      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Failed to load routines</h3>
              <p className="mt-1 text-sm text-red-700">{loadError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Routines</h1>
          <p className="mt-1 text-sm text-slate-500">
            Recurring multi-stop routes. Check live AQI across every stop in one click.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[var(--color-deep-pine)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-deep-pine-soft)]"
        >
          <Plus className="h-4 w-4" />
          New Routine
        </button>
      </div>

      {/* Active profile note */}
      <div className="rounded-xl border border-[var(--color-sage-border)] bg-[var(--color-sage-border)]/60 p-4 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Exposure scores use the active profile
        </p>
        <p className="mt-1 text-sm text-slate-700">
          {activeProfile
            ? `${activeProfile.name} — age ${activeProfile.age}, sensitivity weights applied automatically.`
            : "No active lifestyle profile. Scores use the adult baseline (×1.00)."}
        </p>
      </div>

      {/* Routine cards */}
      {routines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-10 text-center">
          <MapPin className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No routines yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Create one to check the air at all of your stops at once.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {routines.map((r) => {
            const check = checks[r.id];
            const advice = adviceState[r.id];
            const outcome = advice?.outcome;
            const stopList = segsToStops(segments[r.id] ?? [], savedLocations);
            const totalMins = stopList.reduce((sum, s) => sum + s.duration_minutes, 0);
            const allDays = r.active_days?.length === ACTIVE_DAYS.length;
            const checking = checkingId === r.id;

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_8px_30px_rgb(30,46,36,0.06)] backdrop-blur-md"
              >
                {/* Title + schedule */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900" title={r.name || "Untitled routine"}>
                    {r.name || "Untitled routine"}
                  </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{TRANSIT_MODE_LABELS[r.transit_mode ?? "walk"]}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {r.departure_time || "—"} to {r.return_time || "—"}
                      </span>
                      <span>{allDays ? "Daily" : (r.active_days ?? []).join(" · ")}</span>
                      <span>{stopList.length} stops · {totalDurationLabel(totalMins)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(r)}
                      title="Edit routine"
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void deleteRoutine(r.id)}
                      title="Delete routine"
                      className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Stops summary */}
                <ol className="mt-3 space-y-1">
                  {stopList.map((s, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span title={s.label} className="font-mono text-slate-400">{i + 1}</span>
                        {s.label}
                        <span title={s.label} className="text-slate-400 cursor-help">· {s.environment_type} · {totalDurationLabel(s.duration_minutes)}</span>
                      </span>
                    </li>
                  ))}
                </ol>

                {/* Check button */}
                <button
                  onClick={() => void checkRoutine(r.id)}
                  disabled={checking}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-warm-dawn)] px-4 py-3 text-sm font-semibold text-[var(--color-deep-pine)] shadow-sm transition-colors hover:bg-[var(--color-deep-pine)] hover:text-white disabled:opacity-50"
                >
                  {checking ? "Checking live AQI…" : "Check Routine AQI"}
                </button>

                {/* Result panel */}
                {check && (
                  <div className="mt-4 space-y-4">
                    {/* Score + side-by-side AQI */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Personal Exposure
                        </p>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-3xl font-bold" style={{ color: check.result.scoreColor }}>
                            {check.result.score}
                          </span>
                          <span className="text-sm font-medium" style={{ color: check.result.scoreColor }}>
                            {check.result.scoreLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Sensitivity ×{check.result.sensitivity} · checked{" "}
                          {new Date(check.at).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 sm:w-44">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Per-stop AQI
                        </p>
                        <div className="mt-2 space-y-1.5">
                          {check.result.breakdown.map((row) => (
                            <div key={row.label} className="flex items-center justify-between gap-2 text-xs">
                              <span className="truncate text-slate-600">{row.label}</span>
                              <span className="flex shrink-0 items-center gap-1">
                                <span
                                  className="rounded-full px-1.5 py-0.5 font-semibold"
                                  style={{
                                    background: row.naqiCategory?.color ? `${row.naqiCategory.color}22` : undefined,
                                    color: row.naqiCategory?.color ?? "#64748b",
                                  }}
                                >
                                  N {row.naqi}
                                </span>
                                <span
                                  className="rounded-full px-1.5 py-0.5 font-semibold"
                                  style={{
                                    background: row.usAqiCategory?.color ? `${row.usAqiCategory.color}22` : undefined,
                                    color: row.usAqiCategory?.color ?? "#64748b",
                                  }}
                                >
                                  US {row.usAqi ?? "–"}
                                </span>
                              </span>
                            </div>
                          ))}
                          {check.result.unavailableStops.map((label) => (
                            <div key={label} className="flex items-center justify-between gap-2 text-xs text-slate-400">
                              <span className="truncate">{label}</span>
                              <span>no data</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Dose breakdown */}
                    {check.result.breakdown.length > 0 && (
                      <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Inhaled dose breakdown
                        </p>
                        <div className="mt-2 space-y-2">
                          {check.result.breakdown.map((row) => (
                            <div key={row.label}>
                              <div className="flex items-center justify-between text-xs text-slate-600">
                                <span>
                                  {row.label} · {row.hours}h · att ×{row.attenuation} · mit ×{row.mitigation}
                                </span>
                                <span className="font-mono text-slate-500">
                                  {Math.round(row.dose)} dose · {Math.round(row.share * 100)}%
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.max(2, row.share * 100)}%`,
                                    background: row.naqiCategory?.color ?? "#15803d",
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sensitivity + tips */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Why this score
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-slate-600">
                          {check.result.sensitivityReasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                          <li>Total inhaled dose {check.result.totalDose} / budget 800</li>
                        </ul>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Suggested actions
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-slate-600">
                          {check.result.tips.length > 0 ? (
                            check.result.tips.map((tip) => <li key={tip}>• {tip}</li>)
                          ) : (
                            <li>No changes needed — keep going.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hybrid Advice Card */}
                {advice && (
                  <div className="mt-5 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_8px_30px_rgb(30,46,36,0.06)] backdrop-blur-md">
                    {advice.status === "loading" && (
                      <div className="space-y-2" aria-busy="true">
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                      </div>
                    )}
                    {advice.status === "error" && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Advice unavailable</p>
                        <p className="mt-1 text-sm text-red-600">
                          The advice service couldn't be reached right now. Try the check again in a moment.
                        </p>
                      </div>
                    )}
                    {advice.status === "success" && outcome && (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {outcome.source === "ai" ? "AI + Rules" : "Rules-Based"}
                          </p>
                        </div>
                        {outcome.summary && (
                          <p className="mt-2 text-sm text-slate-700">{outcome.summary}</p>
                        )}
                        {outcome.tips.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {outcome.tips.map((tip, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 rounded-lg bg-[var(--color-deep-pine-soft)] px-3 py-2 text-xs text-[var(--color-misty-alabaster)]"
                              >
                                <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-deep-pine)]">
                                  {tip.kind}
                                </span>
                                <span>{tip.text}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Routine editor */}
      {form && (
        <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_8px_30px_rgb(30,46,36,0.06)] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {form.id ? "Edit Routine" : "New Routine"}
            </h2>
            <button onClick={closeForm} className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
              Close
            </button>
          </div>

          {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Name *</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => f && { ...f, name: e.target.value })}
                placeholder="e.g. Home → Work commute"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Primary transit / micro-environment
              </span>
              <select
                value={form.transit_mode}
                onChange={(e) => setForm((f) => f && { ...f, transit_mode: e.target.value as TransitMode })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {TRANSIT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {TRANSIT_MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Departure time</span>
              <input
                type="time"
                value={form.departure_time}
                onChange={(e) => setForm((f) => f && { ...f, departure_time: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Return time</span>
              <input
                type="time"
                value={form.return_time}
                onChange={(e) => setForm((f) => f && { ...f, return_time: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
          </div>

          {/* Active days */}
          <div className="mt-4">
            <p className="mb-1.5 text-sm font-medium text-slate-700">Active days</p>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVE_DAYS.map((d) => {
                const on = form.active_days.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() =>
                      setForm((f) =>
                        f && {
                          ...f,
                          active_days: on
                            ? f.active_days.filter((x) => x !== d)
                            : [...f.active_days, d],
                        },
                      )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      on
                        ? "bg-[var(--color-deep-pine)] text-white"
                        : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stops */}
          <div className="mt-4">
            <p className="mb-1.5 text-sm font-medium text-slate-700">
              Stops ({form.stops.length}) — in order
            </p>
            <div className="space-y-2">
              {form.stops.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5"
                >
                  <span className="w-5 text-center font-mono text-xs text-slate-400">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{s.label}</span>
                  <select
                    value={s.environment_type}
                    onChange={(e) =>
                      updateStop(i, {
                        environment_type: e.target.value as RoutineStop["environment_type"],
                      })
                    }
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                  >
                    {ROUTINE_ENVIRONMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input
                      type="number"
                      min={1}
                      value={s.duration_minutes}
                      onChange={(e) => updateStop(i, { duration_minutes: parseInt(e.target.value, 10) || 0 })}
                      className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                    />
                    min
                  </label>
                  <button
                    onClick={() => removeStop(i)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                    title="Remove stop"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add from saved locations */}
            <div className="mt-2 flex gap-2">
              <select
                value={addLocationId}
                onChange={(e) => setAddLocationId(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="">Add stop from saved locations…</option>
                {savedLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.location_name} ({l.location_type})
                  </option>
                ))}
              </select>
              <button
                onClick={addSavedLocation}
                disabled={!addLocationId}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                Add
              </button>
            </div>

            {/* Map pinpoint picker */}
            {picking ? (
              <div className="mt-2">
                <MapView
                  centerLat={pickCenter.lat}
                  centerLng={pickCenter.lng}
                  stations={[]}
                  onMapClick={(lat, lng) => addPinpoint(lat, lng)}
                  height="300px"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Click the map to add a pinpoint stop at that location.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setPicking(true)}
                className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                <MapPin className="h-4 w-4" />
                Pinpoint a stop on the map
              </button>
            )}
          </div>

          {/* Save / Cancel */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => void saveRoutine()}
              disabled={saving}
              className="rounded-lg bg-[var(--color-deep-pine)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-deep-pine-soft)] disabled:opacity-50"
            >
              {saving ? "Saving…" : form.id ? "Save Changes" : "Create Routine"}
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
