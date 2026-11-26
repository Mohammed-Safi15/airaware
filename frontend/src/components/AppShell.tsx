import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LogOut,
  MapPin,
  Route,
  Settings,
  User,
  Users,
  Wind,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useProfiles } from "../lib/profileContext";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AppShellProps {
  user: SupabaseUser | null;
  setUser: (user: SupabaseUser | null) => void;
}

/** Active / inactive styles for primary nav links (top-left zone). */
function navLinkClass(isActive: boolean) {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive
      ? "bg-[var(--color-deep-pine-soft)] text-[var(--color-warm-dawn)]"
      : "text-slate-300 hover:bg-white/5 hover:text-white"
  }`;
}

/** Active / inactive styles for bottom-zone links (Settings / Account). */
function bottomLinkClass(isActive: boolean) {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive
      ? "bg-[var(--color-deep-pine-soft)] text-[var(--color-warm-dawn)]"
      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
  }`;
}

export function AppShell({ user, setUser }: AppShellProps) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-misty-alabaster)]">
      {/* Left Sidebar — sticky, full viewport height */}
      <aside className="sticky top-0 z-40 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[var(--color-deep-pine)] text-white">
        {/* Top-Left Zone: Brand */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-deep-pine-soft)]">
            <Wind className="h-5 w-5 text-[var(--color-warm-dawn)]" />
          </span>
          <h1 className="text-lg font-bold tracking-tight">AirAware</h1>
        </div>

        {/* Top-Left Zone: 6 primary feature links, anchored at the top */}
        <nav className="flex flex-col gap-1 px-3 py-4">
          <NavLink to="/dashboard" className={({ isActive }) => navLinkClass(isActive)}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/lifestyle" className={({ isActive }) => navLinkClass(isActive)}>
            <Users className="h-4 w-4 shrink-0" />
            <span>Lifestyle Profiles</span>
          </NavLink>

          <NavLink to="/locations" className={({ isActive }) => navLinkClass(isActive)}>
            <MapPin className="h-4 w-4 shrink-0" />
            <span>Saved Locations</span>
          </NavLink>

          <NavLink to="/routines" className={({ isActive }) => navLinkClass(isActive)}>
            <Route className="h-4 w-4 shrink-0" />
            <span>Routines</span>
          </NavLink>

          <NavLink to="/awareness" className={({ isActive }) => navLinkClass(isActive)}>
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>AQI Awareness</span>
          </NavLink>

          <NavLink to="/history" className={({ isActive }) => navLinkClass(isActive)}>
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span>History &amp; My Impact</span>
          </NavLink>
        </nav>

        {/* Bottom-Left Zone: Settings / Account, pinned to the bottom */}
        <div className="mt-auto border-t border-white/15 px-3 pb-5 pt-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Settings
          </p>

          <NavLink to="/settings" className={({ isActive }) => bottomLinkClass(isActive)}>
            <Settings className="h-4 w-4 shrink-0" />
            <span>App &amp; Alert Preferences</span>
          </NavLink>

          <NavLink to="/account" className={({ isActive }) => bottomLinkClass(isActive)}>
            <User className="h-4 w-4 shrink-0" />
            <span>Account &amp; Login</span>
          </NavLink>

          <div className="mt-3 border-t border-white/10 pt-3">
            {user?.email ? (
              <p className="truncate px-3 text-xs text-slate-400" title={user.email}>
                {user.email}
              </p>
            ) : (
              <p className="px-3 text-xs text-slate-500">Not signed in</p>
            )}

            <button
              onClick={handleSignOut}
              className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1">
        <ProfileSwitcherBar />
        <div className="px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/**
 * Slim sticky top bar with the active lifestyle-profile switcher (Phase 4.1).
 * Each household profile becomes a pill; the active one is highlighted in
 * Warm Dawn. Clicking any pill instantly flips the active profile
 * (optimistic + persisted) so every downstream exposure score re-weights.
 */
function ProfileSwitcherBar() {
  const { profiles, activeProfile, switchActive } = useProfiles();

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--color-sage-border)] bg-white/70 px-6 py-2.5 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Scoring profile
        </span>
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
          {profiles.length === 0 ? (
            <span className="truncate text-sm text-slate-400">
              No profiles — using adult baseline
            </span>
          ) : (
            profiles.map((p) => {
              const on = activeProfile?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => switchActive(p.id)}
                  title={on ? "Active profile" : `Switch to ${p.name}`}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    on
                      ? "bg-[var(--color-warm-dawn)] text-[var(--color-deep-pine)] shadow-sm"
                      : "border border-[var(--color-sage-border)] bg-white/60 text-slate-600 hover:bg-white"
                  }`}
                >
                  {p.name}
                  <span className={`ml-1.5 text-[10px] ${on ? "opacity-70" : "opacity-50"}`}>
                    {p.age}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
