import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Route,
  Settings,
  Sparkles,
  User,
  Users,
  Wind,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useProfiles } from "../lib/profileContext";
import { AtmosphericBackdrop } from "./AtmosphericBackdrop";
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
      : "text-[var(--color-pine-mist)] hover:bg-white/5 hover:text-[#F4F6F3]"
  }`;
}

export function AppShell({ user, setUser }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auto-close the mobile drawer on every route change.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {/* Fixed scientific atmospheric backdrop — sky/canopy wash, contour
          lines, altitude ticks, drifting mist. Non-interactive. */}
      <AtmosphericBackdrop />

      {/* Mobile drawer — off-canvas below lg, full height with bottom-pinned Settings/Account/Sign Out */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-72 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[var(--color-deep-pine)] text-white transition-transform duration-300 ease-out lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col lg:justify-between lg:w-64 lg:translate-x-0 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Drawer header: brand + mobile close button */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-deep-pine-soft)]">
            <Wind className="h-5 w-5 text-[var(--color-warm-dawn)]" />
          </span>
          <h1 className="flex-1 text-lg font-bold tracking-tight">AirAware</h1>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
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

          <NavLink to="/ask" className={({ isActive }) => navLinkClass(isActive)}>
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Ask AirAware</span>
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

      {/* Main Content — offset by the fixed lg sidebar */}
      <main className="min-w-0 flex-1 lg:pl-64">
        {/* Mobile top bar — hamburger + brand, shown below lg */}
        <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[var(--color-sage-border)] bg-[var(--color-deep-pine)] px-4 text-white lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 transition-colors hover:bg-white/10 active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Wind className="h-4 w-4 text-[var(--color-warm-dawn)]" />
            AirAware
          </span>
        </div>
        <ProfileSwitcherBar />
        <div className="px-4 py-4 lg:px-6 lg:py-6">
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
    <div className="sticky top-14 z-30 flex items-center justify-between gap-3 border-b border-[var(--color-sage-border)] bg-white/70 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-6">
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
