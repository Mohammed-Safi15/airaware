import type { Env } from "./bindings.js";
import { fetchCPCBRecords, buildCPCBStation } from "./lib/fetchers/cpcb.js";
import { fetchOpenAQLocations, buildOpenAQStation } from "./lib/fetchers/openaq.js";
import { toNAQI, category } from "./lib/nqi.js";
import type { AQResponse, StationObservation, Reliability } from "./types/aq.js";

// ---------------------------------------------------------------------------
// Tuning constants
// ---------------------------------------------------------------------------

/** How long we keep a successful API response in the edge cache. */
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Oldest acceptable age of a measurement's own timestamp. Anything older is
 * demoted Measured -> Estimated (still returned, but flagged).
 */
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Beyond this distance a station is a rough proxy, demoted to Estimated. */
const ESTIMATE_DISTANCE_KM = 50;

// ---------------------------------------------------------------------------
// Edge cache (Cloudflare Cache API)
// ---------------------------------------------------------------------------

async function cacheGet(key: string): Promise<Response | undefined> {
  try {
    return await caches.default.match(key);
  } catch {
    return undefined;
  }
}

async function cachePut(key: string, body: string): Promise<void> {
  try {
    const res = new Response(body, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${Math.floor(CACHE_TTL_MS / 1000)}`,
      },
    });
    await caches.default.put(key, res);
  } catch (err) {
    console.warn("[cache] put failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Reliability classification
// ---------------------------------------------------------------------------

/**
 * Apply the three-state reliability model.
 *  - Measured   : fresh reading from a nearby station.
 *  - Estimated  : reading exists but is stale (>2h) or the station is far away.
 *  - Unavailable: no usable readings at all (station then omitted entirely).
 */
function classifyReliability(station: StationObservation): StationObservation {
  let reliability: Reliability = "Measured";

  const ageMs = Date.now() - Date.parse(station.measurement_timestamp);
  if (!Number.isFinite(ageMs) || ageMs > STALE_THRESHOLD_MS) {
    reliability = "Estimated";
  } else if (station.distance_km > ESTIMATE_DISTANCE_KM) {
    reliability = "Estimated";
  }

  return reliability === station.reliability ? station : { ...station, reliability };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return Response.json(data, { status, headers: { ...corsHeaders, ...extraHeaders } });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    switch (url.pathname) {
      case "/api/health":
        return json({
          status: "healthy",
          service: "airaware-worker",
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT || "production",
        });
      case "/api/aqi":
        return handleAQI(url, env, ctx);
      default:
        return json({ error: "Not Found", endpoint: url.pathname }, 404);
    }
  },
};

async function handleAQI(url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const lat = parseFloat(url.searchParams.get("lat") ?? "");
  const lng = parseFloat(url.searchParams.get("lng") ?? "");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return json({ error: "Invalid coordinates. Provide ?lat=...&lng=..." }, 400);
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return json({ error: "Coordinates out of range." }, 400);
  }

  // Cache key: rounded ~4 decimal places is ~10 m resolution, plenty for AQI.
  const cacheKey = `/api/aqi?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  // --- Gather observations, CPCB first, OpenAQ as fallback. ---
  const alternatives: StationObservation[] = [];

  if (env.CPCB_API_KEY) {
    const records = await fetchCPCBRecords(env.CPCB_API_KEY);
    for (const rec of records) {
      const obs = buildCPCBStation(rec, lat, lng);
      if (obs) alternatives.push(obs);
    }
  }

  if (alternatives.length === 0 && env.OPENAQ_API_KEY) {
    const locations = await fetchOpenAQLocations(env.OPENAQ_API_KEY, lat, lng);
    for (const loc of locations) {
      const obs = buildOpenAQStation(loc, lat, lng);
      if (obs) alternatives.push(obs);
    }
  }

  // Sort by proximity, take the nearest as primary, classify reliability.
  alternatives.sort((a, b) => a.distance_km - b.distance_km);
  const classified = alternatives.map(classifyReliability);
  const primary = classified[0] ?? null;
  const rest = classified.slice(1);

  // NAQI summary from the primary station's own concentrations (never an
  // average across stations — PRD guardrail).
  let meta = {
    naqi: -1,
    subIndices: {} as Record<string, number>,
    category: { label: "Unknown", color: "#808080" },
  };
  if (primary) {
    const result = toNAQI(primary.concentrations);
    meta = { naqi: result.naqi, subIndices: result.subIndices, category: category(result.naqi) };
  }

  const response: AQResponse = {
    latitude: lat,
    longitude: lng,
    fetched_at: new Date().toISOString(),
    primary,
    alternatives: rest,
    _meta: meta,
  };

  const body = JSON.stringify(response);
  // Populate the cache without blocking the response.
  ctx.waitUntil(cachePut(cacheKey, body));
  return json(response, 200, { "Cache-Control": `public, max-age=${Math.floor(CACHE_TTL_MS / 1000)}` });
}
