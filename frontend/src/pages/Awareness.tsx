/**
 * AQI Awareness & Health Guide (Phase 5B)
 * Editorial guide styled in AirAware's Deep Pine & Frosted Glass palette.
 *
 * Design: Deep Pine (#1E2E24), Misty Alabaster (#F4F6F3), Sage Border (#E6ECE7),
 * Warm Dawn accent (#C89666); CPCB NAQI semantic colors for tier pills.
 */

import { useEffect } from "react";

export function AwarenessPage() {
  useEffect(() => {
    // No external init needed; page is static editorial content.
    // Could later hook into GA or focus-return handling.
  }, []);

  return (
    <div className="prose lg:prose-xl max-w-2xl mx-auto p-6">
      <h1 className="text-4xl font-display font-bold tracking-tight mb-6 text-[var(--color-deep-pine)]">
        AirAware: AQI & Health Guide
      </h1>

      {/* ── CPCB NAQI vs. US EPA AQI Reference ───────────────────── */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[var(--color-deep-pine)] mb-4">
          CPCB NAQI vs. US EPA AQI & Tier Reference
        </h2>
        <p className="text-slate-600 mb-4">
          Indian National Air Quality Index (NAQI) and US EPA AQI both measure air
          quality, but they use different breakpoints, pollutant weightings, and
          index scales. The same air sample can produce different numbers because
          CPCB India adapts the EPA framework to local monitoring data and
          commonly encountered pollutants (e.g., CO as a pre-computed 0–500
          sub-index). This guide uses CPCB semantic colors throughout.
        </p>

        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(30,46,36,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Indian NAQI Tier Table (0–500)
          </p>
          <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[320px] text-xs caption-side table-auto">
            <thead>
              <tr>
                <th className="text-left text-slate-500">Tier</th>
                <th className="text-left text-slate-500">NAQI Range</th>
                <th className="text-left text-slate-500">Label</th>
                <th className="text-left text-slate-500">Color</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Good</td>
                <td>0–50</td>
                <td>Good</td>
                <td>
                  <div
                    className="w-8 h-2 rounded-full"
                    style={{ background: "#16a34a" }}
                  ></div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Satisfactory</td>
                <td>51–100</td>
                <td>Satisfactory</td>
                <td>
                  <div
                    className="w-8 h-2 rounded-full"
                    style={{ background: "#ca8a04" }}
                  ></div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Moderate</td>
                <td>101–200</td>
                <td>Moderate</td>
                <td>
                  <div
                    className="w-8 h-2 rounded-full"
                    style={{ background: "#ea580c" }}
                  ></div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Poor</td>
                <td>201–300</td>
                <td>Poor</td>
                <td>
                  <div
                    className="w-8 h-2 rounded-full"
                    style={{ background: "#dc2626" }}
                  ></div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Very Poor</td>
                <td>301–400</td>
                <td>Very Poor</td>
                <td>
                  <div
                    className="w-8 h-2 rounded-full"
                    style={{ background: "#7c3aed" }}
                  ></div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Severe</td>
                <td>401–500</td>
                <td>Severe</td>
                <td>
                  <div
                    className="w-8 h-2 rounded-full"
                    style={{ background: "#7f1d1d" }}
                  ></div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            US EPA AQI uses analogous breakpoints but maps pollutants and color
            codes through the federal EPA scheme. CPCB NAQI retains the Indian
            color palette above for all status pills and station indicators.
          </p>
        </div>
      </section>

      {/* ── Key Pollutants Breakdown ──────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-[var(--color-deep-pine)] mb-6">
          Key Pollutants Breakdown
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* PM2.5 */}
          <div
            className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-[0_4px_12px_rgb(30,46,36,0.05)]"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#16a34a20", color: "#16a34a" }}>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">PM2.5</p>
                <p className="text-slate-500 text-sm">
                  Fine particulate matter (≤2.5μm). Penetrates deep into lungs and
                  enters the bloodstream. Sources: vehicle exhaust, construction
                  dust, industrial emissions, wood burning. In Indian cities, PM2.5
                  is the dominant driver of poor NAQI readings, especially in
                  winter when temperature inversions trap pollutants close to the
                  ground.
                </p>
              </div>
            </div>
          </div>

          {/* PM10 */}
          <div
            className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-[0_4px_12px_rgb(30,46,36,0.05)]"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#ca8a0420", color: "#ca8a04" }}>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5M12 22l10 5 10-5M2 7l10 5 10-5"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">PM10</p>
                <p className="text-slate-500 text-sm">
                  Respirable particulate matter (≤10μm). Irritates eyes, nose, and
                  throat. Sources: road dust, construction, mining, agricultural
                  burning. PM10 is often elevated in Indian urban areas due to
                  heavy dust loading from unpaved roads and seasonal farm burning.
                </p>
              </div>
            </div>
          </div>

          {/* NO2 */}
          <div
            className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-[0_4px_12px_rgb(30,46,36,0.05)]"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#ea580c20", color: "#ea580c" }}>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5M12 22l10 5 10-5M12 2L2 12l10 5 10-5 5-5v5l-5 5-5-5zM2 7l 5 5v5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">NO2</p>
                <p className="text-slate-500 text-sm">
                  Nitrogen dioxide. Irritates lungs, reduces immunity to respiratory
                  infections. Sources: vehicle exhaust (especially diesel), power
                  plants, industrial boilers. Peak near roadways during rush hour;
                  a key contributor to the "Poor" and "Very Poor" NAQI tiers in
                  Indian metros.
                </p>
              </div>
            </div>
          </div>

          {/* O3 */}
          <div
            className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-[0_4px_12px_rgb(30,46,36,0.05)]"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#7c3aed20", color: "#7c3aed" }}>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M12 17l-5 5 5 5M12 22l5-5 5 5M2 17l 5 5v5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">O3</p>
                <p className="text-slate-500 text-sm">
                  Ground-level ozone. Forms when NOx and VOCs react in sunlight.
                  Causes chest pain, throat irritation, and reduced lung function.
                  Highest in afternoon summer hours; typically worst in urban
                  corridors with heavy traffic and intense sunlight.
                </p>
              </div>
            </div>
          </div>

          {/* CO */}
          <div
            className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-[0_4px_12px_rgb(30,46,36,0.05)]"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#7f1d1d20", color: "#7f1d1d" }}>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5M12 22l10 5 10-5M12 2L2 12l10 5 10-5 5-5v5l-5 5-5-5zM2 7l 5 5v5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">CO</p>
                <p className="text-slate-500 text-sm">
                  Carbon monoxide. Odorless, colorless gas that reduces oxygen
                  carrying capacity of blood. Sources: incomplete combustion from
                  vehicles (especially petrol), poorly vented heaters, indoor
                  cooking fires. CO spikes are short-lived but dangerous during
                  rush hour near busy corridors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How Personal Exposure Is Calculated ─────────────────── */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-[var(--color-deep-pine)] mb-4">
          How AirAware Calculates Your Personal Exposure
        </h2>
        <p className="text-slate-600 mb-4">
          A city's NAQI describes the air around a monitoring station — not the
          air you actually breathe. AirAware turns each stop in your routine into
          a personal estimate using five simple steps:
        </p>

        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(30,46,36,0.06)]">
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E2E24] text-xs font-semibold text-white">1</span>
              <span>
                <strong className="text-slate-900">Read the live NAQI</strong> at each stop. If a stop
                has no nearby reading, AirAware marks it unavailable instead of
                guessing with zeros.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E2E24] text-xs font-semibold text-white">2</span>
              <span>
                <strong className="text-slate-900">Multiply by time.</strong> A longer stop means more
                inhaled air — a 30-minute walk contributes far less than a
                full workday at the same NAQI.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E2E24] text-xs font-semibold text-white">3</span>
              <span>
                <strong className="text-slate-900">Adjust for setting.</strong> Indoors or in a sealed
                vehicle cabin, you inhale less outdoor particle than outdoors —
                AirAware lowers the dose accordingly.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E2E24] text-xs font-semibold text-white">4</span>
              <span>
                <strong className="text-slate-900">Account for protection.</strong> Wearing an N95 or
                keeping a purifier running cuts the particles that actually reach
                your lungs.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E2E24] text-xs font-semibold text-white">5</span>
              <span>
                <strong className="text-slate-900">Weight for you.</strong> Your age, health
                conditions, and activity level scale the total — the same air
                matters more for a child with asthma than for a healthy adult.
              </span>
            </li>
          </ol>
          <p className="mt-4 text-xs text-slate-500">
            The result is a 0–100 personal exposure score: how hard the day's
            air is on <em>you</em>, across all stops, not just a snapshot of
            one street.
          </p>
        </div>

        {/* NAQI vs US EPA callout */}
        <div className="mt-4 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-[0_4px_12px_rgb(30,46,36,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            NAQI vs US EPA AQI — a quick note
          </p>
          <p className="mt-2 text-sm text-slate-600">
            AirAware displays the Indian <strong>NAQI</strong> (0–500 scale, CPCB
            tiers) as its primary number. The US EPA AQI is a separate index
            for the same air: it uses different breakpoints, pollutant
            weightings, and monitoring conventions, so the two don't always
            agree on a given day.
          </p>
        </div>
      </section>

      {/* ── Why Cumulative Daily Exposure Matters ───────────────────── */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-[var(--color-deep-pine)] mb-4">
          Why Cumulative Daily Exposure Matters
        </h2>
        <p className="text-slate-600 mb-4">
          Air quality varies minute by minute, but what matters most for health
          is the total inhaled dose over a full day. Two scenarios illustrate
          why:
        </p>

        <ul className="list-disc list-inside text-slate-600 space-y-2">
          <li>
            <strong>Roadside traffic exposure:</strong> A 30-minute commute on a
            busy road during rush hour can inhale as many particulates as 2–3
            hours of outdoor activity in average air. The combination of high
            NAQI, high breathing rate, and minimal attenuation (roadside)
            concentrates dose rapidly.
          </li>
          <li>
            <strong>Filtered indoor spaces:</strong> Time spent in a home or
            office with a running HEPA purifier or closed, filtered windows can
            reduce inhaled PM2.5 by 50–70% compared with the same duration
            outdoors. Even on a day that "looks clear," indoor particles from
            outdoor infiltration accumulate.
          </li>
        </ul>

        <p className="text-slate-600 mt-4">
          This is why AirAware tracks exposure cumulatively across every stop in
          your routine — a "Good" NAQI at one stop doesn't offset a "Poor" NAQI
          at another if the total dose pushes your daily score into the
          "Moderate," "High," or "Very High" zone.
        </p>
      </section>

      {/* ── Vulnerable Group Guidance ──────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-[var(--color-deep-pine)] mb-4">
          Vulnerable Group Guidance
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Children */}
          <div
            className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-[0_4px_12px_rgb(30,46,36,0.06)]"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#16a34a20", color: "#16a34a" }}>
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15.57c-.83-.62-1.73-1.12-2.67-1.43 1.16.38 2.29.74 3.3 1.24-.96.06-1.82.06-2.78 0-1.01-.49-1.96-1.18-2.67-1.43.09.52.14 1.09.14 1.68 0 6.03 3.5 11 6.55 11 6.55-.34 1.27-.7 2.26-1.19 3.23-1.38-.24-2.72-1.76-2.72-3.35 0-1.64.88-2.91 2.28-3.35.16-.57.22-1.2.22-1.85 0-.55-.13-1.08-.33-1.6 1.35.98-.07 1.94-.33 2.83-.78.92.55 1.97 1.17 2.94 1.94-1.18 1.84-2.8 3.08-4.72 3.86-1.18.5-2.41.72-3.64.72-1.65 0-3.14-.53-4.28-1.58C7.83 20.3 5. 19.53 2 17.05zM12 5.88c2.01 0 3.65.88 4.78 2.2 h-1.55c-.18.77-.33 1.63-.33 2.53 0 1.36.7 2.53 1.89 2.86-.08.06-.17.1-.25.12h-1.55C15.65 8.51 13.97 5.88 12 5.88z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Children</p>
                <p className="text-slate-500 text-sm">
                  Children inhale more air per kg of body weight than adults, and
                  their respiratory systems are still developing. On days with NAQI
                  {'>'}100, keep outdoor play to brief intervals with N95 masks if
                  prolonged activity is unavoidable. Prioritize indoor time with
                  HEPA filtration when AQI enters the "Moderate" tier or higher.
                </p>
              </div>
            </div>
          </div>

          {/* Older Adults */}
          <div
            className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-[0_4px_12px_rgb(30,46,36,0.06)]"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#ca8a0420", color: "#ca8a04" }}>
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-3 10c5.523 0 10 4.477 10 10s-4.477 10-10 10-10-4.477-10-10 4.477-10 10-10zm3.5 1.5c-.83-.62-1.73-1.12-2.67-1.43 1.16.38 2.29.74 3.3 1.24-.96.06-1.82.06-2.78 0-1.01-.49-1.96-1.18-2.67-1.43-.09.52-.14 1.09-.14 1.68 0 6.03 3.5 11 6.55 11 6.55-.34 1.27-.7 2.26-1.19 3.23-1.38-.24-2.72-1.76-2.72-3.35 0-1.64.88-2.91 2.28-3.35.16-.57.22-1.2.22-1.85 0-.55-.13-1.08-.33-1.6 1.35.98-.07 1.94-.33 2.83-.78.92.55 1.97 1.17 2.94 1.94-1.18 1.84-2.8 3.08-4.72 3.86-1.18.5-2.41.72-3.64.72-1.65 0-3.14-.53-4.28-1.58c2.17 1.28 4.08 2.18 5.66 2.86-.24.13-.49.22-.74.22-.59 0-1.13-.1-.17-.33.26-.62.54-1.46 1.37-2.59 2.5-3.37 3.28-1.44 1.16-3.08 1.85-5.15 1.85-2.19 0-4.12-.77-5.62-2.23-.08-.06-.15-.1-.21-.13h-1.31c1.46 1.32 3.2 2.26 5.2 3.16-.68.23-1.41.35-2.19.35-1.66 0-3.19-.5-4.46-1.53-.93.56-1.95.93-3.12.93-1.49 0-2.74-.62-3.76-1.83.96.37 2.01.66 3.22.94 2.52.54 5.09 1.09 7.25 2.09-4.39-1.56-7.78-4.66-9.67-8.97.41.62.82 1.36 1.12 2.22.52 1.37 1.1 2.83 1.82 4.33.73 1.51 1.38 3.05 2.09 4.63.89 1.76 1.59 3.55 2.34 5.45 1.65 2.16-1.4 3.82-3.71 4.78-6.38.61-1.67.87-3.52.87-5.48 0-2.61-.89-4.92-2.67-6.68 1.78.22 3.58.22 5.35 0 1.96.66 3.73 1.99 5.09 3.88.64 1.01.95 2.09.95 3.35 0 1.27-.23 2.47-.68 3.57-1.16.68-1.42 1.25-2.93 1.83-4.48.57-1.65 1.04-3.44 1.36-5.36.25-1.72.46-3.47.58-5.25.12-1.72-.58-3.56-1.81-4.89-4.67z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Older Adults (≥65)</p>
                <p className="text-slate-500 text-sm">
                  Reduced respiratory reserve and decreased lung elasticity make
                  older adults more sensitive to pollutant overload. On days with
                  NAQI {'>'}100, avoid prolonged outdoor exertion. If outdoors, a
                  well-fitted N95 mask is strongly recommended. Keep rescue
                  medications handy and monitor for breathing discomfort, even on
                  days when AQI appears only "Moderate."
                </p>
              </div>
            </div>
          </div>

          {/* Asthma & Allergies */}
          <div
            className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-[0_4px_12px_rgb(30,46,36,0.06)]"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#ea580c20", color: "#ea580c" }}>
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15.57c-.83-.62-1.73-1.12-2.67-1.43 1.16.38 2.29.74 3.3 1.24-.96.06-1.82.06-2.78 0-1.01-.49-1.96-1.18-2.67-1.43.09.52.14 1.09.14 1.68 0 6.03 3.5 11 6.55 11 6.55-.34 1.27-.7 2.26-1.19 3.23-1.38-.24-2.72-1.76-2.72-3.35 0-1.64.88-2.91 2.28-3.35.16-.57.22-1.2.22-1.85 0-.55-.13-1.08-.33-1.6 1.35.98-.07 1.94-.33 2.83-.78.92.55 1.97 1.17 2.94 1.94-1.18 1.84-2.8 3.08-4.72 3.86-1.18.5-2.41.72-3.64.72-1.65 0-3.14-.53-4.28-1.58C7.83 20.3 5. 19.53 2 17.05zM12 5.88c2.01 0 3.65.88 4.78 2.2 h-1.55c-.18.77-.33 1.63-.33 2.53 0 1.36.7 2.53 1.89 2.86-.08.06-.17.1-.25.12h-1.55C15.65 8.51 13.97 5.88 12 5.88zM12 9.5c1.38 0 2.5.96 2.5 2.5s-.96 2.5-2.5 2.5S9.5 13.38 9.5 11.88 10.46 9.5 11.88 9.5zm0 4c1.93 0 3.5 1.57 3.5 3.5s-1.57 3.5-3.5 3.5S8.5 14.93 8.5 13 6.97 10.5 6.5 10 4.98 7 3.5 7 1.98 7zM7 4c1.38 0 2.5.96 2.5 2.5s-.96 2.5-2.5 2.5S4.5 7.5 4.5 6 5.42 4 7 4zm3.5-.5c-.83-.62-1.73-1.12-2.67-1.43 1.16.38 2.29.74 3.3 1.24-.96.06-1.82.06-2.78 0-1.01-.49-1.96-1.18-2.67-1.43.09.52.14 1.09.14 1.68 0 6.03 3.5 11 6.55 11 6.55-.34 1.27-.7 2.26-1.19 3.23-1.38-.24-2.72-1.76-2.72-3.35 0-1.64.88-2.91 2.28-3.35.16-.57.22-1.2.22-1.85 0-.55-.13-1.08-.33-1.6 1.35.98-.07 1.94-.33 2.83-.78.92.55 1.97 1.17 2.94 1.94-1.18 1.84-2.8 3.08-4.72 3.86-1.18.5-2.41.72-3.64.72-1.65 0-3.14-.53-4.28-1.58c2.17 1.28 4.08 2.18 5.66 2.86-.24.13-.49.22-.74.22-.59 0-1.13-.1-.17-.33.26-.62.54-1.46 1.37-2.59 2.5-3.37 3.28-1.44 1.16-3.08 1.85-5.15 1.85-2.19 0-4.12-.77-5.62-2.23-.08-.06-.15-.1-.21-.13h-1.31c1.46 1.32 3.2 2.26 5.2 3.16-.68.23-1.41.35-2.19.35-1.66 0-3.19-.5-4.46-1.53-.93.56-1.95.93-3.12.93-1.49 0-2.74-.62-3.76-1.83.96.37 2.01.66 3.22.94 2.52.54 5.09 1.09 7.25 2.09-4.39-1.56-7.78-4.66-9.67-8.97.41.62.82 1.36 1.12 2.22.52 1.37 1.1 2.83 1.82 4.33.73 1.51 1.38 3.05 2.09 4.63.89 1.76 1.59 3.55 2.34 5.45 1.65 2.16-1.4 3.82-3.71 4.78-6.38.61-1.67.87-3.52.87-5.48 0-2.61-.89-4.92-2.67-6.68 1.78.22 3.58.22 5.35 0 1.96.66 3.73 1.99 5.09 3.88.64 1.01.95 2.09.95 3.35 0 1.27-.23 2.47-.68 3.57-1.16.68-1.42 1.25-2.93 1.83-4.48.57-1.65 1.04-3.44 1.36-5.36.25-1.72.46-3.47.58-5.25"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Asthma, Allergies,&nbsp;Cardiovascular</p>
                <p className="text-slate-500 text-sm">
                  Individuals with asthma, allergies, or cardiovascular conditions
                  (hypertension, diabetes, coronary disease) have heightened
                  reactivity to air pollution. Triggers: NO2 and O3 can provoke
                  asthma attacks; PM2.5 can enter the bloodstream and stress the
                  heart. Practical precautions:
                  <ul className="list-disc list-inside text-slate-500 text-sm mt-1">
                    <li>Carry a rescue inhaler when outdoors on NAQI {'>'} 100</li>
                    <li>Use N95 masks during roadside or traffic exposure</li>
                    <li>Keep windows closed and HEPA purifier running when indoor NAQI approaches "Moderate"</li>
                    <li>Plan outdoor activities for early morning or evening when traffic-related pollutants are lower</li>
                  </ul>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}