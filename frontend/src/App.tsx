import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { LocationsPage } from "./pages/Locations";
import { SettingsPage } from "./pages/Settings";

function ProtectedRoute({ user, children }: { user: User | null; children: React.ReactNode }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
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
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={setUser} />}
        />

        {/* Protected routes */}
        <Route
          element={<ProtectedRoute user={user}><AppShell user={user} setUser={setUser} /></ProtectedRoute>}
        >
          <Route path="/dashboard" element={<Dashboard userId={user?.id ?? ''} />} />
          <Route path="/locations" element={<LocationsPage userId={user?.id ?? ''} onLocationSelect={() => {}} />} />
          <Route path="/settings" element={<SettingsPage userId={user?.id ?? ''} userEmail={user?.email} />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
