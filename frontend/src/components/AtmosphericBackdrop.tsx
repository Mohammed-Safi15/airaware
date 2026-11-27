/**
 * Scientific atmospheric backdrop (Phase 6 prep).
 *
 * Fixed, strictly non-interactive layer behind the main workspace:
 * a soft sky → misty-canopy gradient, subtle topographic / wind-stream
 * contour lines, a particulate altitude-scale tick on the right edge,
 * and two slow-drifting mist layers.
 *
 * Rules honoured (airaware-ui skill):
 * - Entire subtree is `pointer-events-none` and `aria-hidden`
 * - Overlay opacities stay below 0.4
 * - Drift animation (`.mist-layer`) is disabled under
 *   `prefers-reduced-motion` in index.css — the layer stays visible,
 *   just still
 */
export function AtmosphericBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Sky → alabaster → canopy-mist vertical wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #bae6fd 0%, var(--color-sky-soft) 22%, var(--color-misty-alabaster) 52%, var(--color-canopy-mist) 100%)",
        }}
      />

      {/* Soft sky-blue atmospheric bands — horizontal washes of altitude */}
      <div
        className="absolute inset-x-0 top-0 h-[34%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(56, 189, 248, 0.14), rgba(56, 189, 248, 0.04) 70%, transparent)",
        }}
      />
      <div
        className="absolute inset-x-0 top-[30%] h-[30%]"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(186, 230, 253, 0.12) 50%, transparent)",
        }}
      />

      {/* Topographic contours + wind-stream traces (dashed = particle flow) */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Contour lines — topographic, sage */}
        <g stroke="var(--color-sage-border)" strokeWidth="1" opacity="0.7">
          <path d="M -40 140 C 240 100, 420 180, 720 150 S 1180 110, 1480 160" />
          <path d="M -40 260 C 260 300, 480 230, 760 270 S 1200 320, 1480 250" />
          <path d="M -40 430 C 220 390, 500 470, 780 430 S 1220 400, 1480 450" />
          <path d="M -40 620 C 260 660, 520 590, 800 630 S 1240 680, 1480 610" />
          <path d="M -40 780 C 240 750, 480 810, 760 780 S 1180 740, 1480 790" />
        </g>

        {/* Wind-stream traces — sky accent, dashed for particle flow */}
        <g
          stroke="#0EA5E9"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="2 8"
          opacity="0.14"
        >
          <path d="M -40 330 C 300 300, 600 360, 900 320 S 1300 300, 1480 340" />
          <path d="M -40 520 C 320 550, 640 490, 960 530 S 1320 560, 1480 520" />
          <path d="M -40 200 C 280 180, 560 220, 880 195 S 1280 175, 1480 210" />
          <path d="M -40 660 C 300 640, 620 700, 940 665 S 1320 640, 1480 675" />
        </g>

        {/* One deep-pine streamline for depth */}
        <path
          d="M -40 690 C 300 720, 620 660, 940 700 S 1340 730, 1480 690"
          stroke="var(--color-deep-pine)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="1 10"
          opacity="0.08"
        />

        {/* Subtle corner botanical silhouettes — very low opacity so the
            frosted panels and AQI badges keep full contrast over them */}
        <g stroke="var(--color-forest)" fill="none" opacity="0.10">
          {/* Top-left frond arch */}
          <path d="M 30 -20 Q 90 120 40 260" strokeWidth="5" strokeLinecap="round" />
          <path d="M 30 -20 Q 150 80 190 210" strokeWidth="4" strokeLinecap="round" />
          <path d="M 30 -20 Q 210 40 300 110" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g stroke="var(--color-sage-leaf)" fill="none" opacity="0.09">
          {/* Bottom-right fern cluster */}
          <path d="M 1420 920 Q 1380 780 1430 660" strokeWidth="5" strokeLinecap="round" />
          <path d="M 1420 920 Q 1300 800 1270 700" strokeWidth="4" strokeLinecap="round" />
          <path d="M 1420 920 Q 1240 840 1180 790" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g stroke="var(--color-deep-pine)" fill="none" opacity="0.06">
          {/* Bottom-left ground frond */}
          <path d="M -20 880 Q 140 800 320 830" strokeWidth="4" strokeLinecap="round" />
          <path d="M -20 920 Q 160 860 360 880" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>

      {/* Particulate / altitude scale ticks — right edge, hidden on phones */}
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-[18px] text-[var(--color-pine-mist)] sm:flex">
        <span className="mb-2 text-[9px] font-medium uppercase tracking-[0.2em] opacity-70">
          altitude · µg/m³
        </span>
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span
              className={`block rounded-full bg-current ${
                i % 3 === 0 ? "h-1 w-1 opacity-70" : "h-0.5 w-0.5 opacity-40"
              }`}
            />
            <span
              className={`block h-px bg-current opacity-50 ${
                i % 3 === 0 ? "w-4" : "w-2.5"
              }`}
            />
          </span>
        ))}
      </div>

      {/* Slow-drifting mist (GPU transform-only; still under reduced motion) */}
      <div
        className="mist-layer absolute -top-24 left-[8%] h-[420px] w-[640px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(14, 165, 233, 0.18), transparent 70%)",
        }}
      />
      <div
        className="mist-layer absolute bottom-[6%] left-[38%] h-[380px] w-[720px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(45, 62, 51, 0.14), transparent 70%)",
          animationDuration: "58s",
          animationDelay: "-14s",
        }}
      />
    </div>
  );
}
