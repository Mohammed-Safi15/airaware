import { Link } from "react-router-dom";
import { ArrowLeft, Wind, Gauge, Users, Leaf } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AuthPanel } from "../components/AuthPanel";
import { FoggyBackdrop } from "../components/FoggyBackdrop";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

/**
 * Log In / Sign Up — frosted-glass card over the botanical foggy
 * backdrop. Desktop: split card with a sculpted paper-cut wave edge
 * separating the clean form pane from rich shadowed deep-pine fronds +
 * a sky-blue glow. Mobile (360–640px): the `.glass-panel` auth card
 * centres directly over the lush foliage so the glass visibly blurs
 * leaf shapes and sky gradients underneath.
 */
export function LoginPage({ onLogin: _onLogin }: LoginPageProps) {
  return (
    <div className="relative flex min-h-dvh min-h-screen flex-col">
      <FoggyBackdrop />

      {/* Back to home */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pt-5 sm:px-8 sm:pt-7">
        <Link
          to="/"
          className="press-soft active:scale-[0.98] glass-panel inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-[var(--color-deep-pine)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>

      {/* Glass auth card — full-width glass sheet on mobile, split card on desktop */}
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 items-center px-5 py-6 sm:px-8 sm:py-8">
        <div className="glass-panel animate-card-rise grid w-full max-w-md grid-cols-1 overflow-hidden rounded-3xl lg:w-full lg:max-w-none lg:grid-cols-[1.05fr_1fr]">
          {/* Brand pane — hidden on phones (compact header there) */}
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[var(--color-deep-pine)] to-[var(--color-deep-pine-soft)] p-8 pr-24 text-[var(--color-misty-alabaster)] sm:pr-28 lg:flex lg:p-10 lg:pr-32">
            {/* Sky-blue glow */}
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-60"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(56, 189, 248, 0.35), transparent 70%)",
              }}
            />
            {/* Rich sky glow keeps the deep-pine pane atmospheric; the full
                botanical backdrop lives in FoggyBackdrop behind the card */}

            <div className="relative pr-2">
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

            <ul className="relative mt-10 space-y-4 pr-2">
              {[
                { icon: Gauge, text: "Live CPCB & OpenAQ stations, mapped to your street" },
                { icon: Users, text: "Self, child & senior-parent exposure profiles" },
                { icon: Leaf, text: "Daily 0–100 exposure score with plain-English tips" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-[#F2F7F4]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Icon className="h-4 w-4 text-[var(--color-sky-accent)]" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            {/* Sculpted paper-cut wave edge — a glass sheet layered over the
                pine, with a soft shadow falling onto the dark pane */}
            <svg
              className="absolute inset-y-0 right-0 h-full w-14 sm:w-16 lg:w-20"
              viewBox="0 0 100 900"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <filter id="login-wave" x="-30%" y="-5%" width="160%" height="110%">
                  <feDropShadow dx="-8" dy="0" stdDeviation="12" floodColor="#0f1a14" floodOpacity="0.28" />
                </filter>
              </defs>
              <path
                d="M52 0 C 88 130, 14 262, 48 400 C 78 522, 22 680, 54 900 L100 900 L100 0 Z"
                fill="rgba(255,255,255,0.6)"
                filter="url(#login-wave)"
              />
            </svg>
          </aside>

          {/* Form pane */}
          <section className="flex flex-col p-6 sm:p-8 lg:p-10">
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

            <div className="mt-5 flex justify-center lg:justify-start">
              <span className="inline-flex items-center rounded-full bg-white/75 px-4 py-1.5 text-[11px] font-medium leading-relaxed text-[#1E2E24] shadow-sm backdrop-blur-md">
                Signing in routes you straight to your dashboard. New
                accounts land on the profile-builder setup.
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
