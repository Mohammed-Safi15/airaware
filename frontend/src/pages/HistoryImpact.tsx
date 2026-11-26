/**
 * History & My Impact (Phase 5C)
 * Two-part Deep Pine & Frosted Glass view:
 *   1. Exposure & Check History — saved routine AQI checks + Personal Exposure
 *      Scores for the active lifestyle profile, with an exposure-score trend.
 *   2. My Impact Calculator — a protective-action logger (N95, HEPA purifier,
 *      rescheduled outdoor activity, sealed Metro/AC transit) that estimates
 *      PM2.5 inhaled dose avoided (µg), exposure reduction (%) and emissions
 *      saved, persisting entries and running cumulative totals.
 *
 * Design: Deep Pine (#1E2E24), Misty Alabaster (#F4F6F3), Sage Border (#E6ECE7),
 * Warm Dawn (#C89666); CPCB NAQI semantic colors reserved for the AQI pills.
 */

import { useEffect, useMemo, useState } from "react";
import {
  History,
  Activity,
  Leaf,
  Wind,
  Route as RouteIcon,
  Save,
  Loader2,
  AlertCircle,
  Gauge,
} from "lucide-react";
import { useAuth } from "../App";
import { useProfiles } from "../lib/profileContext";
import {
  supabase,
  PROTECTIVE_ACTIONS,
  PROTECTIVE_MITIGATION,
  BASELINE_ATTENUATION,
  type ProtectiveAction,
  type ExposureCheckSnapshotRow,
  type EnvironmentalActionRow,
  type StopNaqiSummary,
} from "../lib/supabase";

/** NAQI colour helper — mirrors worker/src/lib/nqi.ts (CPCB semantic bands). */
function naqiCat(naqi: number): { label: string; color: string } {
  if (naqi <= 50) return { label: "Good", color: "#16a34a" };
  if (naqi <= 100) return { label: "Satisfactory", color: "#ca8a04" };
  if (naqi <= 200) return { label: "Moderate", color: "#ea580c" };
  if (naqi <= 300) return { label: "Poor", color: "#dc2626" };
  if (naqi <= 400) return { label: "Very Poor", color: "#7c3aed" };
  return { label: "Severe", color: "#7f1d1d" };
}

/** Score-band colour — mirrors exposure.ts scoreCategory (used only as a pill accent). */
function scoreColor(score: number): string {
  if (score <= 25) return "#15803d";
  if (score <= 50) return "#a16207";
  if (score <= 75) return "#c2410c";
  return "#dc2626";
}

const PROTECTIVE_ICON: Record<ProtectiveAction, React.ComponentType<{ className?: string }>> = {
  "N95 Mask": Wind,
  "HEPA Purifier": Leaf,
  "Rescheduled Outdoor Activity": RouteIcon,
  "Sealed Transit (Metro/AC)": Activity,
};

function fmtTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Exposure-score trend (single series: no legend; the history list is the table view) ──
function ExposureTrend({ points }: { points: ExposureCheckSnapshotRow[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 640;
  const H = 200;
  const pad = { l: 40, r: 20, t: 18, b: 26 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = points.length;

  const x = (i: number) => (n <= 1 ? pad.l + iw / 2 : pad.l + (i * iw) / (n - 1));
  const y = (score: number) => pad.t + ih - (Math.max(0, Math.min(100, score)) / 100) * ih;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.exposure_score).toFixed(1)}`).join(" ");

  // Axis tick labels: first, middle, last.
  const tickIdx = useMemo(() => {
    if (n <= 2) return points.map((_, i) => i);
    return [0, Math.floor((n - 1) / 2), n - 1];
  }, [n, points]);

  const grid = [0, 25, 50, 75, 100];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Exposure score over time">
        {/* Recessive gridlines + y labels */}
        {grid.map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="var(--color-sage-border)" strokeWidth={1} />
            <text x={pad.l - 8} y={y(g) + 4} textAnchor="end" fontSize={11} fill="var(--color-deep-pine)" opacity={0.55} className="tabular-nums">
              {g}
            </text>
          </g>
        ))}

        {/* X tick labels */}
        {tickIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--color-deep-pine)" opacity={0.55}>
            {fmtDay(points[i].created_at)}
          </text>
        ))}

        {/* Line */}
        {n >= 2 && (
          <path d={path} fill="none" stroke="var(--color-deep-pine)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Markers (with generous invisible hit targets) */}
        {points.map((p, i) => (
          <g key={p.id}>
            <circle cx={x(i)} cy={y(p.exposure_score)} r={i === n - 1 ? 5 : 4} fill={i === n - 1 ? "var(--color-warm-dawn)" : "var(--color-deep-pine)"} stroke="white" strokeWidth={2} />
            <circle cx={x(i)} cy={y(p.exposure_score)} r={12} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          </g>
        ))}

        {/* Crosshair + tooltip */}
        {hover !== null && points[hover] && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--color-warm-dawn)" strokeWidth={1} strokeDasharray="3 3" />
            {(() => {
              const p = points[hover];
              const tx = Math.max(pad.l, Math.min(W - 118, x(hover) - 59));
              const ty = Math.max(pad.t, y(p.exposure_score) - 46);
              return (
                <g>
                  <rect x={tx} y={ty} width={118} height={40} rx={8} fill="var(--color-deep-pine)" opacity={0.94} />
                  <text x={tx + 10} y={ty + 17} fontSize={11} fill="#F4F6F3">{fmtTs(p.created_at)}</text>
                  <text x={tx + 10} y={ty + 33} fontSize={12} fill="#C89666" fontWeight={600} className="tabular-nums">
                    {p.routine_name || "Routine"} · {p.exposure_score}
                  </text>
                </g>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
}

export function HistoryImpactPage() {
  const { user } = useAuth();
  const { activeProfile } = useProfiles();

  const [snapshots, setSnapshots] = useState<ExposureCheckSnapshotRow[]>([]);
  const [actions, setActions] = useState<EnvironmentalActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Calculator form state
  const [action, setAction] = useState<ProtectiveAction>("N95 Mask");
  const [typicalNaqi, setTypicalNaqi] = useState(150);
  const [durationHours, setDurationHours] = useState(2);
  const [frequencyDays, setFrequencyDays] = useState(5);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const snapQ = supabase
          .from("exposure_check_snapshots")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        const actQ = supabase.from("environmental_actions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        const [snapRes, actRes] = await Promise.all([snapQ, actQ]);

        if (cancelled) return;
        if (snapRes.error || actRes.error) {
          setLoadError(`Failed to load: ${snapRes.error?.message || actRes.error?.message || "unknown error"}`);
          return;
        }

        let snaps = ((snapRes.data as ExposureCheckSnapshotRow[]) ?? []).slice(-30);
        let acts = (actRes.data as EnvironmentalActionRow[]) ?? [];
        // Filter by the active lifestyle profile when one is selected.
        if (activeProfile?.id) {
          snaps = snaps.filter((s) => s.profile_id === activeProfile.id);
          acts = acts.filter((a) => a.profile_id === activeProfile.id);
        }
        setSnapshots(snaps);
        setActions(acts);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, activeProfile?.id]);

  // ── Impact math (transparent, documented constants) ──────────────────────
  const impact = useMemo(() => {
    const mitigation = PROTECTIVE_MITIGATION[action];
    const baseDosePerDay = typicalNaqi * durationHours * BASELINE_ATTENUATION; // µg
    const doseAvoidedPerDay = baseDosePerDay * mitigation; // µg
    const totalDoseAvoided = doseAvoidedPerDay * frequencyDays; // µg over the period
    const exposureReductionPct = Math.round(mitigation * 100); // % of that exposure window
    const emissionsSavedKgs =
      action === "Sealed Transit (Metro/AC)" ? durationHours * frequencyDays * 0.2 : 0; // kg CO₂
    return { mitigation, doseAvoidedPerDay, totalDoseAvoided, exposureReductionPct, emissionsSavedKgs };
  }, [action, typicalNaqi, durationHours, frequencyDays]);

  // Cumulative totals across the user's logged protective actions.
  const cumulative = useMemo(() => {
    const protective = actions.filter((a) => PROTECTIVE_ACTIONS.includes(a.action_type as ProtectiveAction));
    const dose = protective.reduce((sum, a) => sum + (a.pm25_dose_avoided ?? 0), 0);
    const co2 = actions.reduce((sum, a) => sum + (a.estimated_co2_saved ?? 0), 0);
    return { entries: protective.length, dose, co2 };
  }, [actions]);

  const refreshActions = async () => {
    if (!user) return;
    const res = await supabase.from("environmental_actions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (res.data) {
      let acts = (res.data as EnvironmentalActionRow[]) ?? [];
      if (activeProfile?.id) acts = acts.filter((a) => a.profile_id === activeProfile.id);
      setActions(acts);
    }
  };

  const logAction = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("environmental_actions").insert({
      user_id: user.id,
      profile_id: activeProfile?.id ?? null,
      action_type: action,
      quantity: frequencyDays, // days logged (schema requires quantity > 0)
      estimated_co2_saved: impact.emissionsSavedKgs,
      duration_hours: durationHours,
      frequency_days: frequencyDays,
      pm25_dose_avoided: Math.round(impact.totalDoseAvoided),
    });
    setSaving(false);
    if (!error) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2200);
      void refreshActions();
    } else {
      console.warn("Failed to log action:", error.message);
    }
  };

  const activeLabel = activeProfile ? activeProfile.name : "All profiles";

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-deep-pine)]">
            History &amp; My Impact
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Saved checks and personal protective wins for{" "}
            <span className="font-semibold text-[var(--color-deep-pine-soft)]">{activeLabel}</span>
          </p>
        </div>
      </header>

      {loadError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* ── 1. Exposure & Check History ───────────────────────────────────── */}
      <section className="mb-6 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_8px_30px_rgb(30,46,36,0.06)] backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-[var(--color-deep-pine)]" />
          <h2 className="text-lg font-semibold text-[var(--color-deep-pine)]">Exposure &amp; Check History</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading saved checks…
          </div>
        ) : snapshots.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No saved checks yet. Run a routine's "Check AQI" and it appears here automatically.
          </p>
        ) : (
          <>
            {snapshots.length >= 2 && (
              <div className="mb-5 rounded-xl border border-[var(--color-sage-border)] bg-[var(--color-misty-alabaster)]/50 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Gauge className="h-3.5 w-3.5" /> Exposure-score trend
                </p>
                <ExposureTrend points={snapshots} />
              </div>
            )}

            <ul className="divide-y divide-[var(--color-sage-border)]">
              {[...snapshots].reverse().map((s) => (
                <li key={s.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-deep-pine)]">{s.routine_name || "Routine check"}</p>
                      <p className="text-xs text-slate-500">{fmtTs(s.created_at)}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums text-white"
                      style={{ background: scoreColor(s.exposure_score) }}
                    >
                      {s.exposure_score}
                    </span>
                  </div>

                  {/* Stop NAQI summary pills */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.stop_naqi_summary.map((st: StopNaqiSummary, i) =>
                      st.naqi == null ? (
                        <span key={i} className="rounded-full border border-[var(--color-sage-border)] px-2 py-0.5 text-[11px] text-slate-400">
                          {st.label}: no data
                        </span>
                      ) : (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                          style={{ background: naqiCat(st.naqi).color }}
                          title={`${naqiCat(st.naqi).label} · ${st.environment_type} · ${st.hours}h`}
                        >
                          {st.label}: {st.naqi}
                        </span>
                      ),
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ── 2. My Impact Calculator ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_8px_30px_rgb(30,46,36,0.06)] backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2">
          <Leaf className="h-5 w-5 text-[var(--color-deep-pine)]" />
          <h2 className="text-lg font-semibold text-[var(--color-deep-pine)]">My Impact Calculator</h2>
        </div>

        {/* Action picker */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Protective action</p>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PROTECTIVE_ACTIONS.map((a) => {
            const Icon = PROTECTIVE_ICON[a];
            const active = a === action;
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAction(a)}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-[var(--color-warm-dawn)] bg-[var(--color-misty-alabaster)] ring-1 ring-[var(--color-warm-dawn)]"
                    : "border-[var(--color-sage-border)] bg-white hover:border-[var(--color-warm-dawn)]/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-[var(--color-deep-pine)]" : "text-slate-400"}`} />
                <span className="text-xs font-medium leading-tight text-[var(--color-deep-pine)]">{a}</span>
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Typical NAQI on affected days</span>
            <input
              type="number"
              min={1}
              max={500}
              value={typicalNaqi}
              onChange={(e) => setTypicalNaqi(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-full rounded-lg border border-[var(--color-sage-border)] bg-white px-3 py-2 text-sm tabular-nums text-[var(--color-deep-pine)] outline-none focus:border-[var(--color-warm-dawn)]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Duration per occurrence (hours)</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={durationHours}
              onChange={(e) => setDurationHours(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-full rounded-lg border border-[var(--color-sage-border)] bg-white px-3 py-2 text-sm tabular-nums text-[var(--color-deep-pine)] outline-none focus:border-[var(--color-warm-dawn)]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Days in this period</span>
            <input
              type="number"
              min={1}
              value={frequencyDays}
              onChange={(e) => setFrequencyDays(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              className="mt-1 w-full rounded-lg border border-[var(--color-sage-border)] bg-white px-3 py-2 text-sm tabular-nums text-[var(--color-deep-pine)] outline-none focus:border-[var(--color-warm-dawn)]"
            />
          </label>
        </div>

        {/* Result tiles */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-sage-border)] bg-[var(--color-misty-alabaster)]/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">PM2.5 dose avoided</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-deep-pine)]">
              {Math.round(impact.totalDoseAvoided).toLocaleString()}
              <span className="ml-1 text-sm font-medium text-slate-400">µg</span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">over {frequencyDays} day(s)</p>
          </div>
          <div className="rounded-xl border border-[var(--color-sage-border)] bg-[var(--color-misty-alabaster)]/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Exposure reduction</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-deep-pine)]">
              {impact.exposureReductionPct}
              <span className="ml-1 text-sm font-medium text-slate-400">%</span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">of that exposure window</p>
          </div>
          <div className="rounded-xl border border-[var(--color-sage-border)] bg-[var(--color-misty-alabaster)]/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Emissions saved</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-deep-pine)]">
              {impact.emissionsSavedKgs.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span className="ml-1 text-sm font-medium text-slate-400">kg CO₂</span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {action === "Sealed Transit (Metro/AC)" ? "vs. open roadside travel" : "personal-protection action"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={logAction}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-deep-pine)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-deep-pine-soft)] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Log this action
          </button>
          {savedFlash && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#15803d]">
              <Leaf className="h-4 w-4" /> Saved to your impact log
            </span>
          )}
        </div>

        {/* Cumulative totals */}
        <div className="mt-5 rounded-xl border border-[var(--color-sage-border)] bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Cumulative impact ({activeLabel})</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xl font-bold tabular-nums text-[var(--color-deep-pine)]">{cumulative.entries}</p>
              <p className="text-[11px] text-slate-400">protective actions logged</p>
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums text-[var(--color-deep-pine)]">{Math.round(cumulative.dose).toLocaleString()} µg</p>
              <p className="text-[11px] text-slate-400">total PM2.5 dose avoided</p>
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums text-[var(--color-deep-pine)]">{cumulative.co2.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg</p>
              <p className="text-[11px] text-slate-400">total CO₂ saved</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
