/**
 * Foggy nature backdrop for public pages (Home + Login/Signup).
 *
 * A fixed, strictly non-interactive layer: a soft sky → alabaster →
 * canopy-mist gradient, layered deep-pine mountain/canopy silhouettes
 * along the bottom, and two slow-drifting fog blobs.
 *
 * Rules honoured (airaware-ui skill):
 * - Entire subtree is `pointer-events-none` and `aria-hidden`
 * - Overlay opacities stay below 0.4
 * - Drift animation (`.mist-layer`) is disabled under
 *   `prefers-reduced-motion` in index.css — blobs stay visible, just still
 */
export function FoggyBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Sky → alabaster → canopy-mist vertical wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, var(--color-sky-soft) 0%, var(--color-misty-alabaster) 42%, var(--color-canopy-mist) 100%)",
        }}
      />

      {/* Layered mountain / canopy silhouettes — Deep Pine base, low opacity */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[42vh] min-h-[220px] w-full"
        viewBox="0 0 1440 420"
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Far ridge */}
        <path
          d="M0 300 L180 210 L360 260 L560 170 L760 240 L980 150 L1200 230 L1440 180 L1440 420 L0 420 Z"
          fill="var(--color-deep-pine)"
          opacity="0.10"
        />
        {/* Mid ridge */}
        <path
          d="M0 340 L220 260 L430 310 L640 240 L860 300 L1080 230 L1300 300 L1440 270 L1440 420 L0 420 Z"
          fill="var(--color-deep-pine)"
          opacity="0.16"
        />
        {/* Near scalloped canopy */}
        <path
          d="M0 380 Q 120 340 240 368 T 480 362 T 720 372 T 960 356 T 1200 372 T 1440 360 L1440 420 L0 420 Z"
          fill="var(--color-deep-pine)"
          opacity="0.24"
        />
      </svg>

      {/* Drifting fog — GPU transform-only; still under reduced motion */}
      <div
        className="mist-layer absolute left-[10%] top-[28%] h-[280px] w-[520px] max-w-[80vw] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(14, 165, 233, 0.20), transparent 70%)",
        }}
      />
      <div
        className="mist-layer absolute right-[8%] top-[46%] h-[260px] w-[480px] max-w-[80vw] rounded-full opacity-25 blur-3xl"
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
