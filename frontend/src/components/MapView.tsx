import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue in Vite builds
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

if (typeof L.Icon.Default !== "undefined") {
  const DefaultIcon = L.Icon.Default as unknown as { prototype: Record<string, unknown> };
  delete (DefaultIcon.prototype as Record<string, unknown>). _getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  });
}

export interface StationMarker {
  lat: number;
  lng: number;
  label: string;
  aqi?: number;
  distance_km?: number;
}

export interface MapViewProps {
  centerLat: number;
  centerLng: number;
  stations?: StationMarker[];
  /** Fired when the user clicks/drops a pin on the map background */
  onClick?: (lat: number, lng: number) => void;
  /** Fired when the user clicks the map background (not a station marker) */
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
}

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function getAQIColor(aqi: number | undefined): string {
  const n = aqi ?? NaN;
  if (!Number.isFinite(n)) return "#94a3b8";
  if (n <= 50) return "#22c55e";
  if (n <= 100) return "#eab308";
  if (n <= 200) return "#f97316";
  if (n <= 300) return "#ef4444";
  if (n <= 400) return "#7c3aed";
  return "#7f1d1d";
}

export const MapView: React.FC<MapViewProps> = ({
  centerLat,
  centerLng,
  stations = [],
  onClick,
  onMapClick,
  height = "480px",
  className = "",
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userPinRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the latest onMapClick in a ref so the "click" listener is bound
  // exactly once (in the init effect) without accumulating duplicates.
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Initialize the Leaflet map once; React owns the DOM hierarchy.
  // maxZoom is kept as default — we avoid passing the container here so
  // Leaflet does not hijack the ref'd div that React may re-attach.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!mapRef.current) {
      // Create the map targeting our container, but do NOT use the container
      // as the direct root — instead Leaflet will auto-create an inner layer.
      mapRef.current = L.map(container, {
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false, // SVG backend avoids canvas detach issues
      });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(mapRef.current);

      // Fire onMapClick when the user clicks anywhere on the map background
      // (not on a marker). Read via ref so the handler always stays current
      // without re-binding the listener.
      mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
        onMapClickRef.current?.(e.latlng.lat, e.latlng.lng);
      });
    }

    // Only update view — never touch the DOM hierarchy ourselves.
    mapRef.current.setView([centerLat, centerLng], 13, { animate: false });
  }, [centerLat, centerLng]);

  // Cleanup on unmount (critical for React StrictMode double-mount)
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
        userPinRef.current = null;
      }
    };
  }, []);

  // Single red pinpoint for the active query location.
  // Strictly one pin: the previous pin is always removed before adding a new
  // one, so map clicks / search selections can never stack markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    userPinRef.current?.remove();

    // Teardrop pin (44x44) with a soft pulse ring behind it. The ring class
    // comes from index.css and is static under prefers-reduced-motion.
    const pinIcon = L.divIcon({
      html: `<div style="position:relative;width:44px;height:44px;">
        <div class="pin-ring" style="position:absolute;left:10px;top:10px;width:24px;height:24px;"></div>
        <svg viewBox="0 0 24 24" style="position:absolute;left:0;top:0;width:44px;height:44px;overflow:visible;filter:drop-shadow(0 2px 4px rgba(30,46,36,0.35));">
          <path d="M2 21s1.9-5.6 3.9-8.5C7.9 8.7 9.3 6 12 6s4.1 2.7 6.1 6.5C20.1 15.4 22 21 22 21H2z" fill="#DC2626" stroke="#FFFFFF" stroke-width="1.6"/>
          <circle cx="12" cy="12" r="2.6" fill="#FFFFFF"/>
        </svg>
      </div>`,
      className: "",
      iconSize: [44, 44],
      iconAnchor: [22, 42], // tip of the teardrop
      popupAnchor: [0, -38],
    });

    const pin = L.marker([centerLat, centerLng], { icon: pinIcon }).addTo(map);
    pin.bindPopup(
      `<b>Query point</b><br/>${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`
    );
    userPinRef.current = pin;

    return () => {
      pin.remove();
      if (userPinRef.current === pin) userPinRef.current = null;
    };
  }, [centerLat, centerLng]);

  // Update markers when stations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Station markers (the single red pinpoint is managed separately above)
    stations.forEach((st) => {
      const color = getAQIColor(st.aqi);
      const icon = L.divIcon({
        html: `<div style="
          background: ${color};
          border: 3px solid #fff;
          border-radius: 50%;
          width: 12px; height: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        "></div>`,
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const marker = L.marker([st.lat, st.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${st.label}</b>${st.aqi != null ? `<br/>AQI: ${st.aqi}` : ""}${st.distance_km != null ? `<br/>Distance: ${st.distance_km.toFixed(1)} km` : ""}`);
      if (onClick) {
        marker.on("click", () => onClick(st.lat, st.lng));
      }
      markersRef.current.push(marker);
    });
  }, [stations, centerLat, centerLng, onClick]);

  return (
    <div
      className={`overflow-hidden border border-[#E6ECE7] bg-white/80 shadow-[0_8px_30px_rgb(30,46,36,0.06)] backdrop-blur-md rounded-2xl ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full" />
      {stations.length > 0 && (
        <div className="px-3 py-2 bg-[#F4F6F3]/90 border-t border-[#E6ECE7] text-xs text-[#1E2E24] flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-[#DC2626]" /> Your location
          </span>
          {[
            ["#22c55e", "Good"],
            ["#eab308", "Moderate"],
            ["#f97316", "Poor"],
            ["#ef4444", "Very Poor"],
            ["#7c3aed", "Severe"],
          ].map(([color, label]) => (
            <span key={label} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} /> {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
