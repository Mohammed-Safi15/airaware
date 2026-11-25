import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * A dev-only panel to prove Row Level Security is working.
 *
 * It deliberately provides RAW table access (no user_id filter in the query)
 * so that the only thing keeping User A from seeing User B's rows is the
 * Postgres RLS policy. If RLS is broken, the "all rows" query will leak data.
 */

interface ProfileRow {
  id: string;
  display_name: string;
  lifestyle: string;
}

interface LocationRow {
  id: string;
  user_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  location_type: string;
}

const LIFESTYLES = ["Student", "Working Professional", "Home-Stayer", "Outdoor Worker", "Other"];
const LOCATION_TYPES = ["Home", "Office", "College", "Other"];

export function RlsTestPanel({ userId }: { userId: string }) {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [lifestyle, setLifestyle] = useState(LIFESTYLES[0]);
  const [locName, setLocName] = useState("Home");
  const [locType, setLocType] = useState(LOCATION_TYPES[0]);
  const [lat, setLat] = useState("12.9716");
  const [lng, setLng] = useState("77.5946");

  const refresh = useCallback(async () => {
    setError(null);

    // No .eq("user_id", ...) filter: RLS must do the isolation.
    const [p, l] = await Promise.all([
      supabase.from("profiles").select("id, display_name, lifestyle").order("created_at", { ascending: true }),
      supabase
        .from("saved_locations")
        .select("id, user_id, location_name, latitude, longitude, location_type")
        .order("created_at", { ascending: true }),
    ]);

    if (p.error) setError(`profiles: ${p.error.message}`);
    else setProfiles(p.data ?? []);

    if (l.error) setError((prev) => `${prev ? prev + " | " : ""}saved_locations: ${l.error.message}`);
    else setLocations(l.data ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function addProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, display_name: displayName || "Test User", lifestyle }, { onConflict: "id" });
    if (error) setError(`insert profile: ${error.message}`);
    else {
      setStatus("Profile saved for this user.");
      void refresh();
    }
  }

  async function addLocation(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const latN = Number(lat);
    const lngN = Number(lng);
    if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
      setError("Latitude and longitude must be numbers.");
      return;
    }
    const { error } = await supabase.from("saved_locations").insert({
      user_id: userId,
      location_name: locName || "Untitled",
      latitude: latN,
      longitude: lngN,
      location_type: locType,
    });
    if (error) setError(`insert location: ${error.message}`);
    else {
      setStatus("Location saved for this user.");
      void refresh();
    }
  }

  async function attemptCrossUserWrite() {
    setError(null);
    setStatus(null);
    // Try to insert a row FOR A DIFFERENT USER. RLS WITH CHECK must reject this.
    const fakeUserId = crypto.randomUUID();
    const { error } = await supabase.from("saved_locations").insert({
      user_id: fakeUserId,
      location_name: "Should be rejected",
      latitude: 12.9,
      longitude: 77.6,
      location_type: "Other",
    });
    if (error) {
      setStatus(`Good: cross-user insert was rejected -> ${error.message}`);
    } else {
      setError("SECURITY PROBLEM: a row for another user_id was inserted. RLS is not enforcing WITH CHECK.");
    }
    void refresh();
  }

  const foreignRows = locations.filter((l) => l.user_id !== userId).length;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">RLS verification</h2>
        <p className="mt-1 text-sm text-slate-600">
          Signed in as <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{userId}</code>
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="profiles visible" value={String(profiles.length)} />
          <Stat label="locations visible" value={String(locations.length)} />
          <Stat label="rows owned by others" value={String(foreignRows)} good={foreignRows === 0} />
          <Stat label="expected profiles" value="1" />
        </div>

        {foreignRows > 0 && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            RLS FAILURE: {foreignRows} row(s) belonging to another user are visible.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Re-query tables
          </button>
          <button
            type="button"
            onClick={() => void attemptCrossUserWrite()}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            Try inserting a row for another user
          </button>
        </div>

        {status && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{status}</p>}
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={addProfile} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900">profiles</h3>
          <div className="mt-3 space-y-3">
            <Field label="Display name">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Test User"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </Field>
            <Field label="Lifestyle">
              <select
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {LIFESTYLES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
              Upsert my profile
            </button>
          </div>
          <RowTable
            columns={["display_name", "lifestyle"]}
            rows={profiles.map((p) => [p.display_name, p.lifestyle])}
            empty="No profile row yet."
          />
        </form>

        <form onSubmit={addLocation} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900">saved_locations</h3>
          <div className="mt-3 space-y-3">
            <Field label="Label">
              <input
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </Field>
            <Field label="Type">
              <select
                value={locType}
                onChange={(e) => setLocType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {LOCATION_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude">
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  inputMode="decimal"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
              <Field label="Longitude">
                <input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  inputMode="decimal"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>
            <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
              Add location
            </button>
          </div>
          <RowTable
            columns={["location_name", "type", "lat", "lng", "owner"]}
            rows={locations.map((l) => [
              l.location_name,
              l.location_type,
              l.latitude.toFixed(4),
              l.longitude.toFixed(4),
              l.user_id === userId ? "me" : l.user_id.slice(0, 8),
            ])}
            empty="No location rows yet."
          />
        </form>
      </div>
    </section>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-semibold ${good === false ? "text-red-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function RowTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">{empty}</p>;
  }
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            {columns.map((c) => (
              <th key={c} className="py-2 pr-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
