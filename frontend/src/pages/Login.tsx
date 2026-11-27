import { Link } from "react-router-dom";
import { ArrowLeft, Wind, Gauge, Users, Leaf } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AuthPanel } from "../components/AuthPanel";
import { FoggyBackdrop } from "../components/FoggyBackdrop";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

/**
 * Log In / Sign Up — frosted-glass split card over the sky-to-canopy
 * foggy backdrop. Left pane: brand + feature highlights. Right pane:
 * the auth form. On phones the brand pane collapses to a compact header.
 */
export function LoginPage({ onLogin: _onLogin }: LoginPageProps) {
  return (
    <div className="relative flex min-h-dvh min-h-screen flex-col">
      <FoggyBackdrop />

      {/* Back to home */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pt-5 sm:px-8 sm:pt-7">
        <Link
          to="/"
          className="press-soft active:scale-[0.98] inline-flex items-center gap-1.5 rounded-full border border-[var(--color-sage-border)] bg-white/70 px-3.5 py-2 text-xs font-semibold text-[var(--color-deep-pine)] backdrop-blur-md hover:bg-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>

      {/* Split card */}
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 items-center px-5 py-6 sm:px-8 sm:py-8">
        <div className="animate-card-rise grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(30,46,36,0.08)] backdrop-blur-md lg:grid-cols-[1.05fr_1fr]">
          {/* Brand pane — hidden on phones, compact header there */}
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[var(--color-deep-pine)] to-[var(--color-deep-pine-soft)] p-8 text-[var(--color-misty-alabaster)] lg:flex lg:p-10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Wind className="h-[18px] w-[18px] text-[var(--color-warm-dawn)]" />
                </span>
                <span className="font-display text-xl font-bold">AirAware</span>
              </div>
              <h1 className="mt-8 font-display text-3xl leading-snug font-bold">
                Air that <em className="text-[var(--color-warm-dawn)] italic">knows</em>{" "}
                your routine.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-pine-mist)]">
                Hyperlocal Indian NAQI + US AQI, multi-profile household
                exposure scoring, and hybrid AI routine tips — all in one calm
                place.
              </p>
            </div>

            <ul className="mt-10 space-y-3">
              {[
                { icon: Gauge, text: "Live CPCB & OpenAQ stations, mapped to your street" },
                { icon: Users, text: "Self, child & senior-parent exposure profiles" },
                { icon: Leaf, text: "Daily 0–100 exposure score with plain-English tips" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-[var(--color-misty-alabaster)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Icon className="h-4 w-4 text-[var(--color-sky-accent)]" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </aside>

          {/* Form pane */}
          <section className="flex flex-col p-6 sm:p-8">
            {/* Mobile brand header (pane is hidden on phones) */}
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-deep-pine)]">
                <Wind className="h-[18px] w-[18px] text-[var(--color-warm-dawn)]" />
              </span>
              <div>
                <h1 className="font-display text-lg leading-tight font-bold text-[var(--color-deep-pine)]">
                  AirAware
                </h1>
                <p className="text-xs text-slate-500">Breathe informed.</p>
              </div>
            </div>

            <h2 className="mb-4 text-center font-display text-2xl font-bold text-[var(--color-deep-pine)] lg:text-left">
              Welcome back
            </h2>
            <AuthPanel />

            <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
              Signing in routes you straight to your dashboard. New accounts
              land on the profile-builder setup.
            </p>
          </section>
        </div>
      </main>

      {/* Sign-out safety net — if the app re-hydrates a session while this
          page is open, onAuthStateChange in App.tsx flips user state and
          the route guard bounces the visitor to /dashboard. */}
      <footer className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-5 text-center text-[11px] text-slate-400 sm:px-8 sm:pb-6">
        Data sourced from CPCB &amp; OpenAQ — your readings stay private to your account.
      </footer>
    </div>
  );
}
