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
/*
 * Every silhouette is built from closed, filled paths that taper to
 * fine points — no blunt round-capped strokes, so leaf tips read as
 * graceful organic shapes instead of abruptly cut-off bars.
 */

type Pt = readonly [number, number];

/** Point on a quadratic Bézier at parameter t — seats pinnae on the fern's
    arched stem and leaves on the canopy limb. */
function qPoint(p0: Pt, c: Pt, p1: Pt, t: number): [number, number] {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
    u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
  ];
}

/** A closed lens-shaped leaf blade: two quadratic curves meeting at fine
    points at both ends. Filled, so it tapers gracefully. */
function TaperedLeaf({
  x,
  y,
  angle,
  len,
  width,
}: {
  x: number;
  y: number;
  angle: number;
  len: number;
  width: number;
}) {
  return (
    <path
      d={`M0 0 Q ${len * 0.5} ${-width / 2} ${len} 0 Q ${len * 0.5} ${
        width / 2
      } 0 0 Z`}
      transform={`translate(${x} ${y}) rotate(${angle})`}
      fill="currentColor"
    />
  );
}

/** A palm frond: a filled tapered rachis with lens-shaped leaflets splayed
    on both sides, shrinking toward a fine tip. */
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
    // Blades run down each side of the rachis, shrinking and flattening
    // toward the tip
    const t = i / 8;
    const lx = 10 + t * 134;
    const len = 54 * (1 - t * 0.64);
    const w = 12 * (1 - t * 0.58);
    const up = 30 - t * 10; // upper blades arch 30° → 20° above the rachis
    const down = 46 - t * 18; // lower blades sweep 46° → 28° below it
    return (
      <g key={i}>
        <TaperedLeaf x={lx} y={-1.5} angle={-up} len={len} width={w} />
        <TaperedLeaf
          x={lx}
          y={1.5}
          angle={down}
          len={len * 0.94}
          width={w * 0.9}
        />
      </g>
    );
  });
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
      style={{ color: fill, opacity }}
    >
      {/* Tapered rachis: thickest at the base, dissolving to a fine tip */}
      <path d="M0 -4 Q 88 -3.5 150 0 Q 88 3.5 0 4 Z" fill="currentColor" />
      {leaflets}
    </g>
  );
}

/** A fern: a gently arched stem with tapering filled pinnae, each pair
    shrinking toward the fine tip. */
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
  // Stem arches from base (0,130) through control (24,60) to tip (0,0)
  const p0: Pt = [0, 130];
  const c: Pt = [24, 60];
  const p1: Pt = [0, 0];
  const dir = flip ? -1 : 1;
  const pinnae = Array.from({ length: 10 }, (_, i) => {
    const t = 0.12 + i * 0.086;
    const [sx, sy] = qPoint(p0, c, p1, t);
    const len = 42 * (1 - t * 0.82);
    const w = 8 * (1 - t * 0.62);
    return (
      <TaperedLeaf
        key={i}
        x={sx}
        y={sy}
        angle={dir > 0 ? -38 + t * 16 : 218 - t * 16}
        len={len}
        width={w}
      />
    );
  });
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      style={{ color: fill, opacity }}
    >
      {/* Tapered stem: same arch as the Bézier above, thickest at the base */}
      <path
        d="M0 130 Q 24 60 0 0 Q 13 60 0 130 Z"
        fill="currentColor"
      />
      {pinnae}
    </g>
  );
}

/** A broad canopy branch: a filled limb with an arc of tapered leaf blades
    along it. */
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
  const p0: Pt = [0, 0];
  const c: Pt = [85, -26];
  const p1: Pt = [170, -18];
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const [lx, ly] = qPoint(p0, c, p1, t);
    const len = 30 * (0.7 + t * 0.5);
    return (
      <TaperedLeaf
        key={i}
        x={lx}
        y={ly}
        angle={-36 - t * 14}
        len={len}
        width={len * 0.42}
      />
    );
  });
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      style={{ color: fill, opacity }}
      fill="currentColor"
    >
      <path d="M0 -5 Q 85 -31 170 -23 Q 85 -21 0 5 Z" />
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
        <Fern x={-52} y={-30} scale={0.9} fill="var(--color-forest)" opacity={0.32} />
        <Fern x={48} y={-22} scale={0.8} flip fill="var(--color-sage-leaf)" opacity={0.28} />
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
        viewBox="-160 0 1760 560"
        preserveAspectRatio="xMidYMax slice"
        overflow="visible"
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
          d="M-160 360 L0 360 Q 180 320 340 348 T 680 340 T 1020 352 T 1440 336 L1600 336 L1600 560 L-160 560 Z"
          fill="var(--color-deep-pine)"
          opacity="0.10"
        />

        {/* Mid canopy — forest green with a soft drop shadow (paper-cut depth) */}
        <g filter="url(#wave-shadow-soft)">
          <path
            d="M-160 410 L0 410 Q 200 372 390 398 T 780 390 T 1160 402 T 1440 388 L1600 388 L1600 560 L-160 560 Z"
            fill="var(--color-forest)"
            opacity="0.20"
          />
        </g>

        {/* Near sculpted wave — sage, crispest shadow */}
        <g filter="url(#wave-shadow)">
          <path
            d="M-160 466 L0 466 Q 160 428 330 452 T 660 446 T 990 458 T 1320 444 T 1440 452 L1600 452 L1600 560 L-160 560 Z"
            fill="var(--color-sage-leaf)"
            opacity="0.30"
          />
        </g>

        {/* Ground mist band under the waves */}
        <rect x="-160" y="520" width="1760" height="40" fill="var(--color-canopy-mist)" opacity="0.5" />

        {/* Corner botanical silhouettes — arched behind the cards */}
        <FrondCluster x={-24} y={560} scale={3.4} />
        <FrondCluster x={1480} y={560} scale={3.0} />
        <FrondCluster x={560} y={572} scale={2.4} sway />
        <FrondCluster x={1010} y={576} scale={2.1} sway />

        {/* Canopy branches drooping from the top corners */}
        <g transform="translate(0 20)">
          <CanopyBranch x={-30} y={120} scale={1.7} fill="var(--color-forest)" opacity={0.16} />
          <CanopyBranch x={1470} y={130} scale={-1.5} fill="var(--color-sage-leaf)" opacity={0.14} />
        </g>
      </svg>
    </div>
  );
}
