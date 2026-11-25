import { AuthPanel } from "../components/AuthPanel";

interface LoginPageProps {
  onLogin: (user: import("@supabase/supabase-js").User) => void;
}

export function LoginPage({ onLogin: _onLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-100 mb-4">
            <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AirAware</h1>
          <p className="mt-2 text-sm text-slate-500">Track air quality. Stay informed. Breathe easier.</p>
        </div>

        {/* Auth Panel */}
        <AuthPanel />

        {/* Feature Preview */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-medium text-slate-900 mb-3">What you'll get:</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              Real-time AQI data from CPCB & OpenAQ
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-sky-500 shrink-0" />
              Interactive map with station markers
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              Save and manage favorite locations
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-purple-500 shrink-0" />
              Personalized health recommendations
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
