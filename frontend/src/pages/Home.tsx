import { Link } from "react-router-dom";
import { ArrowRight, Gauge, Users, Wind } from "lucide-react";
import { FoggyBackdrop } from "../components/FoggyBackdrop";

/**
 * Public landing homepage — unauthenticated visitors only.
 * Signed-in users are redirected to /dashboard (App.tsx route guard).
 */

const FEATURES = [
  {
    icon: Gauge,
    title: "Hyperlocal India AQI",
    body: "Live CPCB & OpenAQ station data, mapped to your exact corner of the city. See both the Indian NAQI and US AQI — never averaged across stations.",
    delay: "0ms",
  },
  {
    icon: Users,
    title: "Family & Lifestyle Profiles",
    body: "Score each person in your household — self, child, senior parent — with their own age, lifestyle and health sensitivities, so one reading stops being everyone's reading.",
    delay: "60ms",
  },
  {
    icon: Wind,
    title: "Routine Exposure & AI Tips",
    body: "Model your daily routine across multiple stops and time windows. A personal 0–100 exposure score plus hybrid AI + rule-based routine tips, every day.",
    delay: "120ms",
  },
];

export function Home() {
  return (
    <div className="relative min-h-screen">
      <FoggyBackdrop />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 backdrop-blur-md">
            <Wind className="h-[18px] w-[18px] text-[var(--color-deep-pine)]" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-[var(--color-deep-pine)]">
            AirAware
          </span>
        </div>
        <Link
          to="/login"
          className="press-soft active:scale-[0.98] rounded-full border border-[var(--color-sage-border)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--color-deep-pine)] backdrop-blur-md hover:bg-white"
        >
          Log In
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-4xl px-5 pt-14 pb-20 text-center sm:px-8 sm:pt-20">
        <h1 className="font-display text-4xl leading-tight font-bold text-[var(--color-deep-pine)] sm:text-5xl md:text-6xl">
          Know the air you{" "}
          <em className="text-[var(--color-warm-dawn)] italic">actually</em> breathe.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          AirAware maps hyperlocal Indian air-quality stations to your exact
          neighbourhood, scores the exposure of everyone in your household, and
          turns routine after routine into plain-English tips — from CPCB data
          to hybrid AI advice.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/login?mode=signup"
            className="press-soft active:scale-[0.98] inline-flex items-center gap-2 rounded-full bg-[var(--color-deep-pine)] px-7 py-3.5 text-sm font-semibold text-[var(--color-misty-alabaster)] shadow-[0_8px_30px_rgb(30,46,36,0.18)] hover:bg-[var(--color-deep-pine-soft)]"
          >
            Get Started (Sign Up)
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="press-soft active:scale-[0.98] inline-flex items-center gap-2 rounded-full border border-[var(--color-sage-border)] bg-white/80 px-7 py-3.5 text-sm font-semibold text-[var(--color-deep-pine)] backdrop-blur-md hover:bg-white"
          >
            Log In
          </Link>
        </div>
      </main>

      {/* ── Feature cards ───────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {FEATURES.map(({ icon: Icon, title, body, delay }) => (
            <article
              key={title}
              className="animate-card-rise rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_8px_30px_rgb(30,46,36,0.06)] backdrop-blur-md sm:p-6"
              style={{ animationDelay: delay }}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-sky-soft)]">
                <Icon className="h-5 w-5 text-[var(--color-sky-accent)]" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-[var(--color-deep-pine)]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[var(--color-sage-border)] bg-white/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:px-8">
          <span className="font-display text-base font-bold text-[var(--color-deep-pine)]">
            AirAware
          </span>
          <p>
            Data: CPCB · OpenAQ · Open-Meteo — built for India's air, for
            everyone's lungs.
          </p>
          <Link to="/login" className="font-medium text-[var(--color-deep-pine)] hover:underline">
            Create your account →
          </Link>
        </div>
      </footer>
    </div>
  );
}
