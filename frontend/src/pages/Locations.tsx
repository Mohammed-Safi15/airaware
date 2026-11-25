import { useState } from "react";
import { MapView } from "../components/MapView";
import { SearchBar } from "../components/SearchBar";
import { SavedLocations } from "../components/SavedLocations";
import { MapPin } from "lucide-react";

interface LocationsPageProps {
  userId: string;
  onLocationSelect: (lat: number, lng: number, name: string) => void;
}

const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;

export function LocationsPage({ userId, onLocationSelect }: LocationsPageProps) {
  const [selectedLoc, setSelectedLoc] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

  function handleSearchSelect(lat: number, lng: number, name: string) {
    setSelectedLoc({ lat, lng, name });
    setMapCenter({ lat, lng });
    onLocationSelect(lat, lng, name);
  }

  function handleLocationSelectFromList(lat: number, lng: number, name: string) {
    setSelectedLoc({ lat, lng, name });
    setMapCenter({ lat, lng });
    onLocationSelect(lat, lng, name);
  }

  function useMyLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const name = "My Location";
          setSelectedLoc({ lat: latitude, lng: longitude, name });
          setMapCenter({ lat: latitude, lng: longitude });
          onLocationSelect(latitude, longitude, name);
        },
        (err) => {
          console.error("Geolocation error:", err);
          alert("Unable to get your location. Please enable location access.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Locations</h1>
        <button
          type="button"
          onClick={useMyLocation}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Use My Location
        </button>
      </div>

      {/* Search Bar */}
      <SearchBar onSelect={handleSearchSelect} placeholder="Search city or area…" />

      {/* Selected Location Badge */}
      {selectedLoc && (
        <div className="flex items-center gap-2 rounded-lg bg-sky-50 border border-sky-200 px-3 py-2">
          <MapPin className="h-4 w-4 text-sky-600" />
          <span className="text-sm font-medium text-slate-900">{selectedLoc.name}</span>
          <span className="text-xs text-slate-500 font-mono">
            {selectedLoc.lat.toFixed(4)}, {selectedLoc.lng.toFixed(4)}
          </span>
        </div>
      )}

      {/* Map */}
      <MapView
        centerLat={mapCenter.lat}
        centerLng={mapCenter.lng}
        stations={[]}
        height="400px"
      />

      {/* Saved Locations CRUD */}
      <SavedLocations userId={userId} onLocationSelect={handleLocationSelectFromList} />
    </div>
  );
}
