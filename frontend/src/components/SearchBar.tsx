import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, MapPin } from "lucide-react";

export interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  importance?: number;
}

interface SearchBarProps {
  onSelect: (lat: number, lng: number, name: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

async function searchPlaces(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 3) return [];

  const trimmed = query.trim();

  // Try Photon first with countrycode=IN and India bounding box (approx lat 8-35, lng 68-97)
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=8&countrycode=in`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      const features = Array.isArray(data.features) ? data.features : [];
      const hits = features
        .map((f: { geometry?: { coordinates?: [number, number] }; properties?: Record<string, unknown>; display_name?: string }) => {
          const coords = f.geometry?.coordinates as [number, number] | undefined;
          const props = f.properties ?? {};
          if (!coords || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) return null;
          // Restrict strictly to India bbox: lat 8-35, lng 68-97
          if (coords[1] < 8 || coords[1] > 35 || coords[0] < 68 || coords[0] > 35 + 62 /* 97 */) return null;
          return {
            place_id: (props.place_id as number) ?? Math.random() * 1e9,
            lat: String(coords[1]),
            lon: String(coords[0]),
            display_name: [props.name, props.city || props.state, props.country].filter(Boolean).join(", ") || String(props.name ?? f.display_name ?? trimmed),
            type: String(props.type ?? "locality"),
            importance: Number(props.importance ?? 0),
          } satisfies SearchResult;
        })
        .filter(Boolean) as SearchResult[];

      if (hits.length > 0) return hits;
    }
  } catch {
    // Fall through to Nominatim
  }

  // Fallback to Nominatim with countrycodes=in and viewbox for India
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=8&countrycodes=in&viewbox=68,35,97,8&bounded=1&addressdetails=1`;
    const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "AirAware/1.0" } });
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    const raw = await res.json() as Array<{ lat: string; lon: string; display_name: string }>;

    // If fewer than 2 results and query has specific suffixes (gate, entrance, etc.), retry with stripped query
    if (raw.length < 2 && /(gate|entrance|rd|road|block|sec|sector)/i.test(trimmed)) {
      const cleaned = trimmed.replace(/(gate|entrance|block|sec|sector)\s*[\w-]*/gi, "").trim();
      if (cleaned.length >= 3 && cleaned !== trimmed) {
        return searchPlaces(cleaned);
      }
    }

    return raw
      .map((r) => ({
        place_id: Math.random() * 1e9,
        lat: r.lat,
        lon: r.lon,
        display_name: r.display_name,
        type: "search_result",
      }))
      .filter((r) => {
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 8 && lat <= 35 && lng >= 68 && lng <= 97;
      });
  } catch {
    return [];
  }
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelect, placeholder = "Search city or area…", debounceMs = 400, className = "" }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback((val: string) => {
    setQuery(val);
    setError(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const hits = await searchPlaces(val);
        setResults(hits);
        setOpen(hits.length > 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(r: SearchResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    onSelect(lat, lng, r.display_name);
    setQuery("");
    setResults([]);
    setOpen(false);
    setError(null);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          aria-label="Search location"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      {open && results.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {results.map((r, i) => (
            <li key={r.place_id ?? i}>
              <button
                type="button"
                onClick={() => handleSelect(r)}
                className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-sky-50 transition-colors"
                role="option"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{r.display_name}</p>
                  <p className="truncate text-xs text-slate-400">{r.type}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && error && (
        <p className="mt-1 text-xs text-red-500" role="alert">{error}</p>
      )}
    </div>
  );
};
