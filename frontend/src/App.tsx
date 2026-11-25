import { useEffect, useState } from "react";
import { AuthPanel } from "./components/AuthPanel";
import { RlsTestPanel } from "./components/RlsTestPanel";
import { supabase } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";

const APP_TITLE = "AirAware — Test harness (Phase 1)";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for real-time auth changes (sign in / sign out / token refresh).
  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="mx-auto max-w-2xl px-4 text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">{APP_TITLE}</h1>
          {user ? (
            <UserBadge email={user.email} userId={user.id} onSignOut={() => void supabase.auth.signOut()} />
          ) : (
            <p className="text-xs text-slate-500">Not signed in</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 py-8 px-4">
        {!user && (
          <>
            <AuthPanel />
            <p className="px-1 text-xs text-slate-500">
              Tip: create two different accounts (e.g., a@b.com and b@b.com), then open them in separate incognito
              windows to compare rows seen by each user.
            </p>
          </>
        )}

        {user && <RlsTestPanel userId={user.id} />}
      </main>
    </div>
  );
}

function UserBadge({ email, userId, onSignOut }: { email?: string; userId: string; onSignOut: () => void }) {
  return (
    <button
      type="button"
      onClick={onSignOut}
      title="Sign out"
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
    >
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
      <span className="max-w-[160px] truncate">{email}</span>
      <span className="hidden font-mono text-slate-400 sm:inline">{userId.slice(0, 8)}…</span>
    </button>
  );
}
