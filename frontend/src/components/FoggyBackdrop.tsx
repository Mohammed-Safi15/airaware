/**
 * Foggy nature backdrop for public pages (Home + Login/Signup).
 *
 * A fixed, strictly non-interactive layer: a sky-blue wash with soft
 * radial glows, layered botanical silhouettes (palm fronds, ferns,
 * canopy branches in Deep Pine / Forest / Sage) and sculpted paper-cut
 * wave contours with soft drop shadows. Foliage and waves sit
 * directly behind the hero / auth cards so the frosted glass panels
 * visibly blur leaf shapes and sky gradients underneath.
 *
 * Rules honoured (airaware-ui skill):
 * - Entire subtree is `pointer-events-none` and `aria-hidden`
 * - Overlay opacities stay below 0.4
 * - Drift + sway animations are transform/opacity-only (GPU-composited)
 *   and disabled under `prefers-reduced-motion` in index.css
 */

/* ── Botanical silhouettes ─────────────────────────────────────── */

/** A palm frond: a central rachis with leaflets splayed on both sides. */
function PalmFrond({
  x,
  y,
  scale = 1,
  rotate = 0,
  fill,
  opacity,
}: {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  fill: string;
  opacity: number;
}) {
  const leaflets = Array.from({ length: 9 }, (_, i) => {
    // Leaflets run down each side of the rachis, shrinking toward the tip
    const t = i / 8;
    const lx = t * 150;
    const len = 46 * (1 - t * 0.72);
    return (
      <g key={i} transform={`translate(${lx} 0)`}>
        <path d={`M0 0 Q ${len * 0.4} -${len * 0.9} ${len} -${len}`} stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d={`M0 0 Q ${len * 0.4} ${len * 0.9} ${len} ${len}`} stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />
      </g>
    );
  });
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
      style={{ color: fill, opacity }}
    >
      <path d="M0 0 L150 0" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
      {leaflets}
    </g>
  );
}

/** A fern: a gently arched stem with tapering pinnae. */
function Fern({
  x,
  y,
  scale = 1,
  flip = false,
  fill,
  opacity,
}: {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  fill: string;
  opacity: number;
}) {
  const pinnae = Array.from({ length: 10 }, (_, i) => {
    const t = i / 9;
    const py = t * 120;
    const len = 40 * (1 - t * 0.8);
    const dir = flip ? -1 : 1;
    return (
      <g key={i}>
        <path
          d={`M0 ${py} Q ${dir * len * 0.5} ${py - 10} ${dir * len} ${py - 4}`}
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  });
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      style={{ color: fill, opacity }}
    >
      <path d="M0 130 Q 24 60 0 0" stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none" />
      {pinnae}
    </g>
  );
}

/** A broad canopy branch: an arc of simple leaf shapes along a limb. */
function CanopyBranch({
  x,
  y,
  scale = 1,
  fill,
  opacity,
}: {
  x: number;
  y: number;
  scale?: number;
  fill: string;
  opacity: number;
}) {
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const lx = t * 170;
    const ly = -Math.sin(t * Math.PI) * 34;
    const len = 26 * (0.7 + t * 0.5);
    return (
      <ellipse
        key={i}
        cx={lx}
        cy={ly - len * 0.4}
        rx={len * 0.42}
        ry={len}
        transform={`rotate(${18 - t * 40} ${lx} ${ly - len * 0.4})`}
      />
    );
  });
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      style={{ color: fill, opacity }}
      fill="currentColor"
    >
      <path
        d="M0 0 Q 85 -26 170 -18"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {leaves}
    </g>
  );
}

/**
 * A cluster of palm fronds arched from a corner — the lush corner
 * foliage visible through the frosted cards.
 */
function FrondCluster({
  x,
  y,
  scale = 1,
  sway = false,
}: {
  x: number;
  y: number;
  scale?: number;
  sway?: boolean;
}) {
  return (
    <g className={sway ? "leaf-sway" : undefined} style={{ transformOrigin: `${x}px ${y}px` }}>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <PalmFrond x={0} y={0} rotate={-58} fill="var(--color-deep-pine)" opacity={0.28} />
        <PalmFrond x={0} y={6} rotate={-34} fill="var(--color-forest)" opacity={0.34} />
        <PalmFrond x={0} y={12} rotate={-10} fill="var(--color-sage-leaf)" opacity={0.3} />
        <Fern x={-40} y={30} scale={0.9} fill="var(--color-forest)" opacity={0.32} />
        <Fern x={44} y={34} scale={0.8} flip fill="var(--color-sage-leaf)" opacity={0.28} />
      </g>
    </g>
  );
}

export function FoggyBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Sky-blue → alabaster → canopy-mist vertical wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #bae6fd 0%, var(--color-sky-soft) 26%, var(--color-misty-alabaster) 55%, var(--color-canopy-mist) 100%)",
        }}
      />

      {/* Soft sky-blue radial glows — GPU-cheap, static */}
      <div
        className="absolute -top-[12%] left-[-6%] h-[560px] w-[560px] max-w-[80vw] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(56, 189, 248, 0.32), transparent 72%)",
        }}
      />
      <div
        className="absolute right-[-8%] top-[14%] h-[480px] w-[480px] max-w-[70vw] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(186, 230, 253, 0.55), transparent 70%)",
        }}
      />

      {/* Drifting fog — GPU transform-only; still under reduced motion */}
      <div
        className="mist-layer absolute left-[10%] top-[30%] h-[280px] w-[520px] max-w-[80vw] rounded-full opacity-30 blur-3xl"
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

      {/* Botanical foliage + sculpted paper-cut waves.
          Positioned across the lower half so the frosted hero / auth
          cards blur leaf shapes and wave contours directly beneath. */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[58vh] min-h-[300px] w-full"
        viewBox="0 0 1440 560"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <defs>
          <filter id="wave-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="-6" stdDeviation="14" floodColor="#1e2e24" floodOpacity="0.10" />
          </filter>
          <filter id="wave-shadow-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="-4" stdDeviation="10" floodColor="#1e2e24" floodOpacity="0.07" />
          </filter>
        </defs>

        {/* Far canopy — deep pine, soft */}
        <path
          d="M0 360 Q 180 320 340 348 T 680 340 T 1020 352 T 1440 336 L1440 560 L0 560 Z"
          fill="var(--color-deep-pine)"
          opacity="0.10"
        />

        {/* Mid canopy — forest green with a soft drop shadow (paper-cut depth) */}
        <g filter="url(#wave-shadow-soft)">
          <path
            d="M0 410 Q 200 372 390 398 T 780 390 T 1160 402 T 1440 388 L1440 560 L0 560 Z"
            fill="var(--color-forest)"
            opacity="0.20"
          />
        </g>

        {/* Near sculpted wave — sage, crispest shadow */}
        <g filter="url(#wave-shadow)">
          <path
            d="M0 466 Q 160 428 330 452 T 660 446 T 990 458 T 1320 444 T 1440 452 L1440 560 L0 560 Z"
            fill="var(--color-sage-leaf)"
            opacity="0.30"
          />
        </g>

        {/* Ground mist band under the waves */}
        <rect x="0" y="520" width="1440" height="40" fill="var(--color-canopy-mist)" opacity="0.5" />

        {/* Corner botanical silhouettes — arched behind the cards */}
        <FrondCluster x={-40} y={560} scale={3.4} />
        <FrondCluster x={1480} y={560} scale={3.0} />
        <FrondCluster x={560} y={572} scale={2.4} sway />
        <FrondCluster x={1010} y={576} scale={2.1} sway />

        {/* Canopy branches drooping from the top corners */}
        <g transform="translate(0 -60)">
          <CanopyBranch x={-30} y={120} scale={1.7} fill="var(--color-forest)" opacity={0.16} />
          <CanopyBranch x={1470} y={130} scale={-1.5} fill="var(--color-sage-leaf)" opacity={0.14} />
        </g>
      </svg>
    </div>
  );
}
