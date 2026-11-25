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
  const containerRef = useRef<HTMLDivElement>(null);

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
      // (not on a marker). Using 'mousedown' + 'mouseup' avoids the popup
      // steal that 'click' sometimes does on the same element.
      mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
        onMapClick?.(e.latlng.lat, e.latlng.lng);
      });
    }

    // Only update view — never touch the DOM hierarchy ourselves.
    mapRef.current.setView([centerLat, centerLng], 13, { animate: false });
  }, [centerLat, centerLng, onMapClick]);

  // Cleanup on unmount (critical for React StrictMode double-mount)
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  // Update markers when stations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Query point marker
    const queryIcon = L.divIcon({
      html: `<div style="
        background: #6366f1;
        border: 3px solid #fff;
        border-radius: 50%;
        width: 14px; height: 14px;
        box-shadow: 0 0 0 4px rgba(99,102,241,0.3);
      "></div>`,
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    L.marker([centerLat, centerLng], { icon: queryIcon })
      .addTo(map)
      .bindPopup(`<b>Query point</b><br/>${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`);

    // Station markers
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
    <div className={`rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm ${className}`} style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
      {stations.length > 0 && (
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-indigo-500" /> Your location
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
