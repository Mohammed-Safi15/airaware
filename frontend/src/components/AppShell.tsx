import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Wind } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AppShellProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

export function AppShell({ user, setUser }: AppShellProps) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wind className="h-6 w-6 text-sky-600" />
            <h1 className="text-lg font-bold tracking-tight text-slate-900">AirAware</h1>
            <span className="hidden rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 sm:inline">
              Phase 3
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-500 sm:block">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Wind className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Not signed in</div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/90 backdrop-blur-md z-40">
          <div className="mx-auto flex max-w-5xl justify-around py-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                  isActive ? "text-sky-600" : "text-slate-500 hover:text-slate-700"
                }`
              }
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Dashboard</span>
            </NavLink>

            <NavLink
              to="/locations"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                  isActive ? "text-sky-600" : "text-slate-500 hover:text-slate-700"
                }`
              }
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-xs font-medium">Locations</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                  isActive ? "text-sky-600" : "text-slate-500 hover:text-slate-700"
                }`
              }
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium">Settings</span>
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
}
