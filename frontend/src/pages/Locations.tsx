import { useState } from "react";
import { SavedLocations } from "../components/SavedLocations";
import { useAuth } from "../App";
import type { AQResponse } from "../types/aq";

const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;

export function LocationsPage() {
  const { user } = useAuth();
  const [mapCenter, setMapCenter] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

  function handleLocationSelectFromList(lat: number, lng: number, _name: string) {
    setMapCenter({ lat, lng });
  }

  async function fetchAQI(lat: number, lng: number): Promise<AQResponse | null> {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787/api";
      const res = await fetch(`${apiUrl}/aqi?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`);
      if (!res.ok) return null;
      return (await res.json()) as AQResponse;
    } catch {
      return null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Saved Locations CRUD */}
      <SavedLocations
        userId={user?.id ?? ''}
        onLocationSelect={handleLocationSelectFromList}
        fetchAQI={fetchAQI}
        defaultLat={mapCenter.lat}
        defaultLng={mapCenter.lng}
      />
    </div>
  );
}