import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { LocationsPage } from "./pages/Locations";
import { SettingsPage } from "./pages/Settings";
import { LifestyleProfiles } from "./pages/LifestyleProfiles";
import { RoutinesPage } from "./pages/Routines";
import { AwarenessPage } from "./pages/Awareness";
import { LoginPage } from "./pages/Login";
import { ProfilesProvider } from "./lib/profileContext";

/** Live auth context — all child components read the current user from here */
const AuthCtx = createContext<{ user: User | null; setUser: (u: User | null) => void }>({
  user: null,
  setUser: () => {},
});
export function useAuth() { return useContext(AuthCtx); }

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600"></div>
          <p className="mt-3 text-sm text-slate-500">Loading AirAware…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthCtx.Provider value={{ user, setUser }}>
        <ProfilesProvider user={user}>
          <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={setUser} />}
          />

          {/* Protected */}
          <Route
            element={<ProtectedRoute><AppShell user={user} setUser={setUser} /></ProtectedRoute>}
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/lifestyle" element={<LifestyleProfiles />} />
            <Route path="/routines" element={<RoutinesPage />} />
            <Route path="/awareness" element={<AwarenessPage />} />
            <Route path="/account" element={<Navigate to="/settings" replace />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ProfilesProvider>
      </AuthCtx.Provider>
    </BrowserRouter>
  );
}