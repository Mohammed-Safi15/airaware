import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Lifestyle, ProfileRow } from "../lib/supabase";
import { User, Save, Loader2 } from "lucide-react";

interface SettingsPageProps {
  userId: string;
  userEmail?: string;
}

export function SettingsPage({ userId, userEmail }: SettingsPageProps) {
  const [_profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [lifestyle, setLifestyle] = useState<Lifestyle>("Other");

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name);
        setLifestyle(data.lifestyle);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          display_name: displayName.trim(),
          lifestyle,
        });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your profile and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
            <User className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Profile</h2>
            {userEmail && <p className="text-xs text-slate-500">{userEmail}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lifestyle</label>
            <select
              value={lifestyle}
              onChange={(e) => setLifestyle(e.target.value as Lifestyle)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="Student">Student</option>
              <option value="Working Professional">Working Professional</option>
              <option value="Home-Stayer">Home-Stayer</option>
              <option value="Outdoor Worker">Outdoor Worker</option>
              <option value="Other">Other</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              This helps us personalize exposure recommendations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Changes"}
            </button>

            {success && (
              <p className="text-sm text-emerald-600">Profile saved successfully!</p>
            )}
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Account Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">User ID</span>
            <span className="font-mono text-slate-700">{userId.slice(0, 8)}…</span>
          </div>
          {userEmail && (
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="text-slate-700">{userEmail}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Phase</span>
            <span className="text-slate-700">Phase 3 — Map & Geocoding</span>
          </div>
        </div>
      </div>

      {/* Data Status */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Data Status</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span className="text-slate-700">Worker: <span className="font-medium">Running locally</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span className="text-slate-700">Supabase: <span className="font-medium">Connected</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-sky-500"></div>
            <span className="text-slate-700">Leaflet: <span className="font-medium">Loaded</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
