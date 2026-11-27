import { Link } from "react-router-dom";
import {
  ArrowRight,
  Gauge,
  GraduationCap,
  House,
  MapPin,
  Train,
  Users,
  Wind,
} from "lucide-react";
import { FoggyBackdrop } from "../components/FoggyBackdrop";

/**
 * Public landing homepage — unauthenticated visitors only.
 * Signed-in users are redirected to /dashboard (App.tsx route guard).
 *
 * Instant-Clarity split hero: left column carries the message + the only
 * two CTAs on the page; right column shows three staggered frosted-glass
 * preview cards floating over the botanical backdrop. Feature cards and a
 * minimal footer sit below the fold. Responsive 360px → 1440px.
 */

const FEATURES = [
  {
    icon: Gauge,
    num: "01",
    title: "Exact Neighbourhood Stations",
    body: "Live CPCB & OpenAQ readings mapped to your exact corner of the city — never averaged across stations, in Indian NAQI and US AQI.",
    delay: "0ms",
  },
  {
    icon: Users,
    num: "02",
    title: "Household Health Profiles",
    body: "Score self, child and senior-parent profiles with their own age, lifestyle and health sensitivities, so one reading stops being everyone's reading.",
    delay: "60ms",
  },
  {
    icon: Wind,
    num: "03",
    title: "Multi-Stop Routine & AI Tips",
    body: "Model your day across multiple stops with a personal 0–100 exposure score and hybrid AI + rule-based tips, every single day.",
    delay: "120ms",
  },
];

/** A stop chip in the 3-stop routine route bar. */
function StopChip({
  icon: Icon,
  label,
}: {
  icon: typeof House;
  label: string;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl border border-white/60 bg-white/50 px-2 py-2">
      <Icon className="h-4 w-4 text-[var(--color-deep-pine)]" />
      <span className="truncate text-[10px] font-semibold text-slate-600">
        {label}
      </span>
    </span>
  );
}

export function Home() {
  return (
    <div className="relative min-h-screen">
      <FoggyBackdrop />

      {/* ── Top bar — brand only (CTAs live once, in the hero) ───── */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="glass-panel flex h-9 w-9 items-center justify-center rounded-full">
            <Wind className="h-[18px] w-[18px] text-[var(--color-deep-pine)]" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-[var(--color-deep-pine)]">
            AirAware
          </span>
        </div>
      </header>

      {/* ── Instant-Clarity split hero ───────────────────────────── */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        {/* Left — message + CTAs */}
        <div className="text-center lg:text-left">
          <span className="glass-panel inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-deep-pine)]">
            <MapPin className="h-3.5 w-3.5 text-[var(--color-sky-accent)]" />
            Hyperlocal Indian AQI · Personal Exposure
          </span>

          <h1 className="mt-5 font-display text-4xl leading-[1.08] font-bold text-[var(--color-deep-pine)] sm:text-5xl xl:text-6xl">
            Know the air you{" "}
            <em className="text-[var(--color-warm-dawn)] italic">
              actually
            </em>{" "}
            breathe.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
            AirAware maps live Indian air-quality stations to your
            neighbourhood and scores the exposure of everyone at home — then
            turns your daily routine into plain-English tips.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link
              to="/login?mode=signup"
              className="press-soft active:scale-[0.98] inline-flex items-center gap-2 rounded-full bg-[var(--color-deep-pine)] px-7 py-3.5 text-sm font-semibold text-[var(--color-misty-alabaster)] shadow-[0_8px_30px_rgb(30,46,36,0.18)] hover:bg-[var(--color-deep-pine-soft)]"
            >
              Get Started (Sign Up)
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="press-soft active:scale-[0.98] glass-panel inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-[var(--color-deep-pine)]"
            >
              Log In
            </Link>
          </div>
        </div>

        {/* Right — three staggered frosted-glass preview cards */}
        <div className="mx-auto flex w-full max-w-sm flex-col gap-4 lg:max-w-md">
          {/* (a) Neighbourhood station card */}
          <div
            className="animate-card-rise lg:-rotate-[1.2deg]"
            style={{ animationDelay: "60ms" }}
          >
            <article className="glass-panel press-soft rounded-2xl p-5 hover:-translate-y-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Nearest station
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-[var(--color-deep-pine)]">
                    Indiranagar, Bengaluru
                  </p>
                </div>
                {/* High-contrast warm gold badge — Satisfactory tier */}
                <span className="inline-flex shrink-0 items-center rounded-full border border-[#FBBF24] bg-[#FDE047] px-2.5 py-1 text-xs font-bold tabular-nums text-[#713F12]">
                  74 · Satisfactory
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-sage-border)] bg-white/60 px-2.5 py-1 text-xs font-medium text-slate-600">
                  <MapPin className="h-3 w-3 text-[var(--color-sky-accent)]" />
                  1.4 km away
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  NAQI · CPCB
                </span>
              </div>
            </article>
          </div>

          {/* (b) Personal sensitivity card */}
          <div
            className="animate-card-rise lg:ml-6 lg:rotate-[0.8deg]"
            style={{ animationDelay: "140ms" }}
          >
            <article className="glass-panel press-soft rounded-2xl p-5 hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-deep-pine)] font-display text-sm font-bold text-[var(--color-misty-alabaster)]">
                  A
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-deep-pine)]">
                    Aarav, 21
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    Student · N95 mask + HEPA filter
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Personal exposure
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-950">
                  Low Exposure
                </span>
              </div>
            </article>
          </div>

          {/* (c) 3-stop routine exposure preview */}
          <div
            className="animate-card-rise lg:ml-12 lg:-rotate-[0.6deg]"
            style={{ animationDelay: "220ms" }}
          >
            <article className="glass-panel press-soft rounded-2xl p-5 hover:-translate-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Today's routine
              </p>
              <div className="mt-3 flex items-center gap-2">
                <StopChip icon={House} label="Home" />
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <StopChip icon={Train} label="Metro" />
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <StopChip icon={GraduationCap} label="Campus" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Exposure score
                </span>
                <span className="text-sm font-bold tabular-nums text-emerald-700">
                  31 · Low
                </span>
              </div>
            </article>
          </div>
        </div>
      </main>

      {/* ── Feature cards (below the fold) ───────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <h2 className="mb-6 text-center font-display text-lg font-bold text-[var(--color-deep-pine)]/70 lg:text-left">
          Why AirAware
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {FEATURES.map(({ icon: Icon, num, title, body, delay }) => (
            <article
              key={title}
              className="glass-panel animate-card-rise press-soft relative rounded-2xl p-5 hover:-translate-y-1.5 sm:p-6"
              style={{ animationDelay: delay }}
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-sky-soft)]">
                  <Icon className="h-5 w-5 text-[var(--color-sky-accent)]" />
                </span>
                <span
                  aria-hidden="true"
                  className="font-display text-3xl font-bold text-[var(--color-deep-pine)]/10 tabular-nums"
                >
                  {num}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-[var(--color-deep-pine)]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Minimal footer ───────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[var(--color-sage-border)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-5 py-6 text-center sm:px-8">
          <div className="flex items-center gap-2 font-display text-sm font-bold text-[var(--color-deep-pine)]">
            <Wind className="h-4 w-4 text-[var(--color-warm-dawn)]" />
            AirAware
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Data: CPCB · OpenAQ · Open-Meteo — built for India's air, for
            everyone's lungs.
          </p>
        </div>
      </footer>
    </div>
  );
}
