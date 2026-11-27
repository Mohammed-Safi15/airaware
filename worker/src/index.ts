import type { Env } from "./bindings.js";
import { fetchCPCBRecords, buildCPCBStation, groupByStation } from "./lib/fetchers/cpcb.js";
import { fetchOpenAQLocations, buildOpenAQStation } from "./lib/fetchers/openaq.js";
import { fetchOpenMeteo, buildOpenMeteoStation } from "./lib/fetchers/open-meteo.js";
import { toNAQI, category, toUSAQI, usaCategory } from "./lib/nqi.js";
import { buildAdvice, type AdviceRequest } from "./lib/advice.js";
import { getChatResponse } from "./lib/chat.js";
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

/**
 * Browser origin always permitted so local dev (Vite on 5173) works out of
 * the box, in addition to whatever production origin(s) the operator sets via
 * the `ALLOWED_ORIGIN` env var (comma-separated).
 */
const DEV_ORIGIN = "http://localhost:5173";

/**
 * Build the CORS headers for a response. The `Origin` request header is echoed
 * back (with `Vary: Origin` so caches don't leak one origin's header to
 * another) only when it's on the allowlist; otherwise no
 * `Access-Control-Allow-Origin` is emitted and the browser blocks the read.
 * A wildcard `*` is intentionally NOT used: with credentials or a strict
 * allowlist, echoing a validated origin is the safer, standards-compliant
 * behavior.
 */
function buildCorsHeaders(request: Request, env: Env): Record<string, string> {
  const requested = request.headers.get("Origin") ?? "";

  const allow = new Set<string>([DEV_ORIGIN]);
  if (env.ALLOWED_ORIGIN) {
    for (const o of env.ALLOWED_ORIGIN.split(",")) {
      const trimmed = o.trim();
      if (trimmed) allow.add(trimmed);
    }
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };

  if (allow.has(requested)) {
    headers["Access-Control-Allow-Origin"] = requested;
  } else if (requested === "") {
    // Non-browser / same-origin request (no Origin header): nothing to gate.
    headers["Access-Control-Allow-Origin"] = "*";
  }
  // else: unlisted origin → omit the header so the browser blocks the request.

  return headers;
}

function json(
  data: unknown,
  status = 200,
  request: Request | undefined,
  env: Env | undefined,
  extraHeaders: Record<string, string> = {},
): Response {
  const cors = request && env ? buildCorsHeaders(request, env) : { "Access-Control-Allow-Origin": "*" };
  return Response.json(data, { status, headers: { ...cors, ...extraHeaders } });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: buildCorsHeaders(request, env) });
    }

    switch (url.pathname) {
      case "/api/health":
        return json(
          {
            status: "healthy",
            service: "airaware-worker",
            timestamp: new Date().toISOString(),
            environment: env.ENVIRONMENT || "production",
          },
          200,
          request,
          env,
        );
      case "/api/aqi":
        if (request.method !== "GET") return json({ error: "Method Not Allowed" }, 405, request, env);
        return handleAQI(url, env, ctx, request);
      case "/api/advice":
        if (request.method !== "POST")
          return json({ error: "Method Not Allowed. POST with JSON body." }, 405, request, env);
        return handleAdvice(request, env, ctx);
      case "/api/chat":
        if (request.method !== "POST")
          return json({ error: "Method Not Allowed. POST with JSON body." }, 405, request, env);
        return handleChat(request, env, ctx);
      default:
        return json({ error: "Not Found", endpoint: url.pathname }, 404, request, env);
    }
  },
};

// ---------------------------------------------------------------------------
// POST /api/advice — hybrid deterministic + Workers AI routine tips
// ---------------------------------------------------------------------------

function parseAdviceRequest(body: unknown): AdviceRequest | string {
  if (!body || typeof body !== "object") return "Body must be a JSON object.";
  const b = body as Record<string, unknown>;
  const stopsIn = Array.isArray(b.stops) ? b.stops : null;
  if (!stopsIn || stopsIn.length === 0) return "Field 'stops' must be a non-empty array of routine stops.";

  const stops: AdviceRequest["stops"] = [];
  for (const [i, raw] of stopsIn.entries()) {
    const s = raw as Record<string, unknown>;
    if (!s || typeof s.label !== "string" || s.label.length === 0) {
      return `stops[${i}].label must be a non-empty string.`;
    }
    const naqi = typeof s.naqi === "number" && Number.isFinite(s.naqi) ? s.naqi : null;
    if (naqi !== null && (naqi < 0 || naqi > 500)) return `stops[${i}].naqi out of plausible range (0–500).`;
    stops.push({
      label: s.label.slice(0, 120),
      naqi,
      usAqi: typeof s.usAqi === "number" && Number.isFinite(s.usAqi) ? s.usAqi : null,
      categoryLabel: typeof s.categoryLabel === "string" ? s.categoryLabel.slice(0, 40) : undefined,
      hours: typeof s.hours === "number" && Number.isFinite(s.hours) ? Math.min(Math.max(s.hours, 0), 24) : undefined,
      environmentType: typeof s.environmentType === "string" ? s.environmentType.slice(0, 40) : undefined,
    });
  }

  let profile: AdviceRequest["profile"] = null;
  if (b.profile && typeof b.profile === "object") {
    const p = b.profile as Record<string, unknown>;
    profile = {
      name: typeof p.name === "string" ? p.name.slice(0, 80) : "You",
      age: typeof p.age === "number" && Number.isFinite(p.age) ? Math.min(Math.max(p.age, 0), 120) : 35,
      lifestyle: typeof p.lifestyle === "string" ? p.lifestyle.slice(0, 60) : "Other",
      health_conditions: Array.isArray(p.health_conditions) ? p.health_conditions.map((c) => String(c)).slice(0, 12) : [],
      has_air_purifier: p.has_air_purifier === true,
      uses_n95_mask: p.uses_n95_mask === true,
      ventilates_windows: p.ventilates_windows === true,
    };
  }

  const exposureScore =
    typeof b.exposureScore === "number" && Number.isFinite(b.exposureScore)
      ? Math.min(Math.max(b.exposureScore, 0), 100)
      : null;

  return {
    profile,
    stops,
    exposureScore,
    departureTime: typeof b.departureTime === "string" ? b.departureTime.slice(0, 5) : undefined,
    transitMode: typeof b.transitMode === "string" ? b.transitMode.slice(0, 30) : undefined,
  };
}

async function handleAdvice(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400, request, env);
  }

  const parsed = parseAdviceRequest(body);
  if (typeof parsed === "string") return json({ error: parsed }, 400, request, env);

  const startedAt = Date.now();
  const outcome = await buildAdvice(parsed, env.AI);
  ctx.waitUntil(
    (async () => {
      console.log(`[advice] source=${outcome.source} tips=${outcome.tips.length} ${outcome.ai_error ? `ai_error=${outcome.ai_error} ` : ""}took=${Date.now() - startedAt}ms`);
    })(),
  );
  return json(outcome, 200, request, env, { "Cache-Control": "no-store" });
}

async function handleAQI(url: URL, env: Env, ctx: ExecutionContext, request: Request): Promise<Response> {
  const lat = parseFloat(url.searchParams.get("lat") ?? "");
  const lng = parseFloat(url.searchParams.get("lng") ?? "");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return json({ error: "Invalid coordinates. Provide ?lat=...&lng=..." }, 400, request, env);
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return json({ error: "Coordinates out of range." }, 400, request, env);
  }

  // India bounding box: lat 8-35, lng 68-97
  if (lat < 8 || lat > 35 || lng < 68 || lng > 97) {
    return json(
      { error: "Coordinates must be within India (approx. bounding box 68°E–97°E, 8°N–35°N)." },
      400,
      request,
      env,
    );
  }

  // Cache key: rounded ~4 decimal places is ~10 m resolution, plenty for AQI.
  const cacheKey = `/api/aqi?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  // --- Gather observations, CPCB first, OpenAQ as fallback. ---
  const alternatives: StationObservation[] = [];

  if (env.CPCB_API_KEY) {
    const records = await fetchCPCBRecords(env.CPCB_API_KEY);
    console.log(`[aqi] cpcb fetched ${records.length} raw rows`);
    // CPCB returns one row per pollutant; group-then-pivot into stations.
    const buckets = groupByStation(records);
    console.log(`[aqi] cpcb grouped into ${buckets.length} station-buckets`);
    for (const bucket of buckets) {
      const obs = buildCPCBStation(bucket, lat, lng);
      if (obs) {
        console.log(`[aqi]   station: ${obs.station_name} dist=${obs.distance_km}km polls=${Object.keys(obs.concentrations).join(',')}`);
        alternatives.push(obs);
      }
    }
    if (alternatives.length === 0) console.log("[aqi]   → no CPCB stations passed validation");
  } else {
    console.log("[aqi] CPCB_API_KEY not set — skipping CPCB");
  }

  console.log(`[aqi] alternatives so far: ${alternatives.length}`);
  if (alternatives.length === 0 && env.OPENAQ_API_KEY) {
    console.log("[aqi] falling back to OpenAQ v3");
    const locations = await fetchOpenAQLocations(env.OPENAQ_API_KEY, lat, lng);
    console.log(`[aqi] openaq returned ${locations.length} locations`);
    for (const loc of locations) {
      const obs = buildOpenAQStation(loc);
      if (obs) {
        console.log(`[aqi]   station: ${obs.station_name} dist=${obs.distance_km}km polls=${Object.keys(obs.concentrations).join(',')}`);
        alternatives.push(obs);
      }
    }
    if (locations.length > 0 && alternatives.length === 0) console.log("[aqi]   → all openaq locations had zero measurements");
  } else if (env.OPENAQ_API_KEY) {
    console.log("[aqi] skipping OpenAQ — already have CPCB stations");
  }

  // Neighborhood fallback: Add Open-Meteo if we still have no CPCB stations.
  if (alternatives.length === 0) {
    console.log("[aqi] falling back to Open-Meteo neighborhood keyword API (zero-key)");
    const records = await fetchOpenMeteo(lat, lng);
    console.log(`[aqi] open-meteo returned ${records.length} record(s)`);
    const obs = buildOpenMeteoStation(lat, lng, records);
    if (obs) {
      console.log(`[aqi]   station: ${obs.station_name} dist=${obs.distance_km}km polls=${Object.keys(obs.concentrations).join(',')}`);
      // Open-Meteo is always Estimated since it's not a station-specific reading.
    } else {
      console.log("[aqi]   → open-meteo returned no pollutant data");
    }
  }

  // Sort by proximity, take the nearest as primary, classify reliability.
  alternatives.sort((a, b) => a.distance_km - b.distance_km);
  const classified = alternatives.map(classifyReliability);
  const primary = classified[0] ?? null;
  const rest = classified.slice(1);

  // NAQI summary from the primary station's own concentrations (never an
  // average across stations — PRD guardrail).
  let meta: AQResponse["_meta"] = {
    naqi: -1,
    subIndices: {} as Record<string, number>,
    category: { label: "Unknown", color: "#808080" },
  };
  if (primary) {
    const result = toNAQI(primary.concentrations, primary.concentrationMeta);
    const usResult = toUSAQI(primary.concentrations, primary.concentrationMeta);
    meta = {
      naqi: result.naqi,
      subIndices: result.subIndices,
      category: category(result.naqi),
      usAqi: usResult.usAqi,
      usAqiCategory: usaCategory(usResult.usAqi),
    };
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
  return json(response, 200, request, env, {
    "Cache-Control": `public, max-age=${Math.floor(CACHE_TTL_MS / 1000)}`,
  });
}

interface ChatProfile {
  name?: string;
  age?: number;
  lifestyle?: string;
  health_conditions?: string[];
}

function parseChatProfile(b: Record<string, unknown>): ChatProfile | null {
  if (!b.profile || typeof b.profile !== "object") return null;
  const p = b.profile as Record<string, unknown>;
  return {
    name: typeof p.name === "string" ? p.name.slice(0, 80) : undefined,
    age: typeof p.age === "number" && Number.isFinite(p.age) ? p.age : undefined,
    lifestyle: typeof p.lifestyle === "string" ? p.lifestyle.slice(0, 60) : undefined,
    health_conditions: Array.isArray(p.health_conditions)
      ? p.health_conditions.map((c) => String(c)).slice(0, 12)
      : undefined,
  };
}

async function handleChat(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400, request, env);
  }

  if (!body || typeof body !== "object")
    return json({ error: "Body must be a JSON object." }, 400, request, env);
  const b = body as Record<string, unknown>;
  const message = typeof b.message === "string" ? b.message.trim().slice(0, 2000) : "";
  const profile = parseChatProfile(b);

  if (message.length === 0) {
    return json({ error: "Field 'message' must be a non-empty string." }, 400, request, env);
  }

  // Deterministic keyword-matched fallback — always available, no binding needed.
  const det = getChatResponse(message);

  // No AI binding → deterministic answer (or polite off-topic refusal).
  if (!env.AI) {
    return json(
      {
        response: det.response,
        suggestions: det.suggestions,
        source: "deterministic",
      },
      200,
      request,
      env,
      { "Cache-Control": "no-store" },
    );
  }

  const profileContext = profile
    ? [
        `Profile: ${profile.name || "You"},`,
        `age: ${profile.age ?? "adult"},`,
        `lifestyle: ${profile.lifestyle || "Other"},`,
        `health conditions: ${profile.health_conditions?.length ? profile.health_conditions.join(", ") : "none"}`,
      ].join(" ")
    : "";

  const systemPrompt =
    "You are AirAware's chat assistant. Answer ONLY questions about air quality, air pollutants, " +
    "health precautions, lifestyle adjustments, protective gear, and nature/environmental actions " +
    "related to air quality. " +
    "Ground every claim in air quality data; never invent measurements, stations, forecasts or weather. " +
    "Never substitute zero for missing readings — say data is unavailable. " +
    "Keep responses concise and practical, plain text, no markdown.\n" +
    (profileContext ? `${profileContext}.\n` : "") +
    "Scope guardrail: if the question is unrelated to air quality, politely say it is outside AirAware's " +
    "focus and suggest 2–3 relevant AirAware topics (AQI, health precautions, daily lifestyle habits, " +
    "protective gear, eco-friendly actions for nature).";

  const aiMessages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ];

  // llama-3.2-3b primary (per spec) with the larger fast model as secondary.
  const modelSequence = ["@cf/meta/llama-3.2-3b-instruct", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"];
  let lastError: string | undefined;

  for (const model of modelSequence) {
    try {
      const started = Date.now();
      const aiAttempt = (async () => {
        const race: Promise<{ response: string } | { timedOut: true }> = env.AI.run(model, {
          raw: true,
          messages: aiMessages,
          temperature: 0.3,
          max_tokens: 400,
        }) as Promise<{ response: string } | { timedOut: true }>;
        const timeout = new Promise<{ timedOut: true }>((resolve) =>
          setTimeout(() => resolve({ timedOut: true }), 30_000),
        );
        const rawRes = await Promise.race([race, timeout]);
        if ("timedOut" in rawRes) throw new Error(`AI timeout after 30s`);
        if (typeof rawRes.response !== "string" || rawRes.response.trim().length === 0) {
          throw new Error("AI returned no text payload");
        }
        return rawRes.response.trim();
      })();
      const aiOut = await aiAttempt;

      ctx.waitUntil(
        (async () => {
          console.log(`[chat] source=ai model=${model} took=${Date.now() - started}ms`);
        })(),
      );

      // AI went off-scope (hallucinated beyond AirAware topics) → use the
      // polite refusal instead, keeping the deterministic guardrail intact.
      const inScope = isInScopeAirQualityReply(aiOut);
      return json(
        {
          response: inScope ? aiOut : det.response,
          suggestions: det.suggestions,
          source: inScope ? "ai" : "deterministic",
        },
        200,
        request,
        env,
        { "Cache-Control": "no-store" },
      );
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[chat] AI model ${model} failed: ${lastError}`);
      continue;
    }
  }

  // All AI models failed — degrade to the deterministic answer.
  ctx.waitUntil(
    (async () => {
      console.log(`[chat] source=deterministic-fallback ai_error=${lastError}`);
    })(),
  );
  return json(
    {
      response: det.response,
      suggestions: det.suggestions,
      source: "deterministic-fallback",
      ai_error: lastError || "AI model failed",
    },
    200,
    request,
    env,
    { "Cache-Control": "no-store" },
  );
}

/**
 * Heuristic scope check on an AI reply: flag it as off-scope when it clearly
 * abandons the air-quality context (e.g. answers a politics or cooking question).
 * The deterministic off-topic refusal is used instead in that case.
 */
function isInScopeAirQualityReply(reply: string): boolean {
  const lower = reply.toLowerCase();
  const inScopeSignals = [
    "air quality", "aqi", "naqi", "pollutant", "pm2.5", "pm10", "ozone",
    "mask", "n95", "purifier", "hepa", "precaution", "health", "breathing",
    "respiratory", "outdoor", "indoor", "emission", "green", "sustainab",
    "airaware", "out of scope", "outside airaware", "air quality focus",
  ];
  return inScopeSignals.some((s) => lower.includes(s));
}
