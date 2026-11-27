/**
 * Deterministic keyword-matched chat fallback for AirAware.
 * Answers core AQI/health/lifestyle/nature questions and returns a polite
 * off-topic refusal + AirAware topic suggestions for unmatched/off-topic queries.
 *
 * This mirrors the scope guardrails from advice.ts deterministic rules
 * but for free-form chat messages without NAQI data.
 */

// Core keyword sets for deterministic matching
const INDIAN_NAQI_KEYWORDS = [
  "indian", "cpcb", "naqi", "indian naqi", "national", "census air",
];

const US_EPA_KEYWORDS = [
  "us epa", "us aqi", "environmental protection", "epa aqi",
];

const POLLUTANT_KEYWORDS = [
  "pm2.5", "pm10", "no2", "o3", "co", "so2",
  "particulate", "nitrogen dioxide", "ozone", "carbon monoxide",
];

const HEALTH_KEYWORDS = [
  "asthma", "respiratory", "lung", "breathing", "health", "precaution", "precautions",
  "exercise", "outdoor", "indoor", "exertion", "cardio", "heart",
];

const LIFESTYLE_KEYWORDS = [
  "commute", "travel", "trip", "bike", "walk", "drive", "car", "transit",
  "mask", "respirator", "n95", "purifier", "air purifier", "hepa",
  "window", "ventilation", "indoor", "outdoor", "exposure",
];

const NATURE_KEYWORDS = [
  "reduce emissions", "urban green", "sustainable", "emission", "green cover",
  "plant tree", "eco-friendly", "climate", "carbon", "recycle",
];

// ---------------------------------------------------------------------------
// Response builders — each returns a well-formatted string for the UI.
// Using string concatenation (not single-line template literals) to avoid
// TypeScript parse issues with very long lines.
// ---------------------------------------------------------------------------

function indianNaqiResponse(): string {
  const lines = [
    "AirAware tracks Indian CPCB NAQI readings from neighborhood stations.",
    "The Air Quality Index in India ranges from 0–500:",
    "- 0–50: Good (green)",
    "- 51–100: Satisfactory (yellow)",
    "- 101–200: Poor–Unhealthy (orange)",
    "- 201–300: Very Poor (red)",
    "- 301–400: Severe (maroon)",
    "- 401+: Hazardary (maroon)",
    "",
    "For today's specific readings, use the AQI check feature with your location.",
  ];
  return lines.join("\n");
}

function usEpaAqiResponse(): string {
  const lines = [
    "AirAware also supports US EPA AQI (0–500 scale):",
    "- 0–50: Good (green)",
    "- 51–100: Moderate (yellow)",
    "- 101–150: Unhealthy for sensitive groups (orange)",
    "- 151–200: Unhealthy (red)",
    "- 201–300: Very Unhealthy (purple)",
    "- 301–500: Hazardous (maroon)",
    "",
    "US EPA focuses on PM2.5, PM10, O3, NO2, CO, and SO2.",
    "For Indian city readings, AirAware uses the CPCB NAQI standard.",
  ];
  return lines.join("\n");
}

function pollutantResponse(found: string[]): string {
  const list = found.slice(0, 3).join(", ");
  const lines = [
    "Key air pollutants tracked by AirAware:",
    "- **PM2.5**: Fine particulate matter (≤2.5 µm) — deepest health risk, penetrates deep into lungs",
    "- **PM10**: Coarser particulate matter (≤10 µm) — inhalable, causes irritation",
    "- **NO2**: Nitrogen dioxide — traffic-related, aggravates asthma",
    "- **O3**: Ozone — forms in sunlight, peaks in afternoons",
    "- **CO**: Carbon monoxide — odorless, reduces oxygen delivery",
    "- **SO2**: Sulfur dioxide — industrial, causes bronchoconstriction",
    "",
    `${list} are among the most monitored pollutants. Daily exposure depends on location, weather, and time of day.`,
  ];
  return lines.join("\n");
}

function healthPrecautionsResponse(): string {
  const lines = [
    "AirAware health guidance for air quality:",
    "",
    "**General precautions:**",
    "- Good days (NAQI ≤50): Normal outdoor activity is fine",
    "- Satisfactory days (NAQI 51–100): Limit heavy outdoor exertion to brief bursts",
    "- Poor days (NAQI 101–200): Keep outdoor time short and plan indoor breaks",
    "- Very Poor/Severe days (NAQI >200): Carry an N95 mask; defer non-essential outdoor activity",
    "",
    "**High-risk groups:** Children, seniors, and those with respiratory or cardiovascular",
    "conditions should be extra cautious even at moderate levels.",
    "",
    "**Protective gear:** A well-fitted N95 mask can substantially reduce inhaled PM2.5 dose.",
    "Indoor HEPA air purifiers help clean indoor air.",
    "",
    "For personalized advice, check your current NAQI reading and active lifestyle profile.",
  ];
  return lines.join("\n");
}

function lifestyleCommuteResponse(): string {
  const lines = [
    "AirAware lifestyle and commute adjustments:",
    "",
    "**Commute choices:**",
    "- Metro/Bus: Cuts roadside pollutant inhalation by ~50–60% vs. walking or two-wheeler",
    "- Car (AC): Sealed cabin reduces exposure vs. open vehicles",
    "- Two-wheeler/Auto (no AC): Highest roadside pollutant exposure",
    "- Walking: Good exercise but direct roadside pollutant inhalation",
    "",
    "**Timing matters:** Rush-hour windows (7:00–9:30 AM and 5:00–8:00 PM) have peak roadside",
    "PM/NO2. Consider shifting travel outside these windows.",
    "",
    "**Protective habits:**",
    "- Wear N95 on outdoor segments during poor air quality",
    "- Keep windows closed on high-pollution days",
    "- Use HEPA purifier before arriving home from a routine",
    "- Ventilate indoor spaces when outdoor air is cleaner",
    "",
    "**Daily tips:** Plan outdoor exercise for early morning or evening when pollutant levels",
    "are typically lower; choose green routes away from major roads.",
  ];
  return lines.join("\n");
}

function protectiveGearResponse(): string {
  const lines = [
    "N95 / Protective Gear guidance from AirAware:",
    "",
    "**N95 masks:** A well-fitted N95 can filter ~95% of fine particulate matter (PM2.5),",
    "substantially reducing inhaled dose. Effectiveness depends on proper fit — seal check is essential.",
    "",
    "**When to wear:** On days with NAQI >150 (Poor–Unhealthy and above), especially for outdoor",
    "segments of routines. Also recommended for sensitive groups (children, seniors, respiratory",
    "conditions) at NAQI >100.",
    "",
    "**Types:** N95 (NIOSH-certified) offers the best protection. Surgical masks provide basic",
    "droplet protection but much less PM2.5 filtration. Reusable respirators with P100 filters",
    "offer highest protection but are less convenient.",
    "",
    "**Limitations:** N95 effectiveness drops if wet, damaged, or poorly fitted. Replace when",
    "breathing becomes difficult or the mask is damaged.",
    "",
    "For routine-specific advice, check your current NAQI and profile settings.",
  ];
  return lines.join("\n");
}

function natureResponse(): string {
  const lines = [
    "AirAware nature and environmental actions:",
    "",
    "**Reduce emissions:**",
    "- Avoid unnecessary vehicle trips, especially during rush hour",
    "- Combine errands into single trips to minimize total driving time",
    "- Consider carpooling or trip consolidation",
    "",
    "**Urban green cover:**",
    "- Urban trees and green spaces can locally reduce PM2.5 by 7–24%",
    "- Support city urban forestry and tree-planting initiatives",
    "- Parks and green corridors provide cleaner air micro-environments",
    "",
    "**Sustainable habits:**",
    "- Choose public transit, cycling, or walking for short trips",
    "- Reduce energy consumption at home (reduces power-plant emissions)",
    "- Recycle and reduce waste to lower overall emissions",
    "- Support local clean-air policies and regulations",
    "",
    "**Individual impact:** While one person's actions seem small, collective lifestyle changes",
    "drive significant air quality improvements over time. AirAware's My Impact Calculator",
    "tracks your protective actions and estimates CO₂e avoided.",
  ];
  return lines.join("\n");
}

function offTopicResponse(): string {
  const lines = [
    "I'm sorry, but that topic is outside AirAware's focus. AirAware is designed to help you",
    "with air quality awareness, health precautions, lifestyle adjustments, protective gear",
    "guidance, and nature/environmental actions related to air quality.",
    "",
    "Here are 2–3 relevant AirAware topics you might find helpful:",
    "",
    "1. **Check current NAQI** — Get live air quality readings for your location",
    "2. **Health precautions** — Guidance based on air quality levels and your profile",
    "3. **Daily lifestyle tips** — Commute adjustments and protective habits for cleaner air",
    "",
    "Would you like to explore any of these instead?",
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main match + response
// ---------------------------------------------------------------------------

export interface ChatResult {
  response: string;
  suggestions: string[];
  source: "deterministic" | "off-topic";
}

function findBestMatch(message: string): string | null {
  const lower = message.toLowerCase().trim();

  if (INDIAN_NAQI_KEYWORDS.some(k => lower.includes(k))) return indianNaqiResponse();
  if (US_EPA_KEYWORDS.some(k => lower.includes(k))) return usEpaAqiResponse();

  const found = POLLUTANT_KEYWORDS.filter(k => lower.includes(k));
  if (found.length > 0) return pollutantResponse(found);

  if (HEALTH_KEYWORDS.some(k => lower.includes(k))) return healthPrecautionsResponse();
  if (LIFESTYLE_KEYWORDS.some(k => lower.includes(k))) return lifestyleCommuteResponse();

  if (lower.includes("n95") || lower.includes("mask") || lower.includes("respirator"))
    return protectiveGearResponse();

  if (NATURE_KEYWORDS.some(k => lower.includes(k))) return natureResponse();

  return null;
}

const DEFAULT_SUGGESTIONS: string[] = [
  "Check current NAQI",
  "Health precautions for my area",
  "Daily lifestyle tips",
];

export function getChatResponse(message: string): ChatResult {
  const matched = findBestMatch(message);
  if (matched !== null) {
    return { response: matched, suggestions: DEFAULT_SUGGESTIONS, source: "deterministic" };
  }
  return { response: offTopicResponse(), suggestions: DEFAULT_SUGGESTIONS, source: "off-topic" };
}
