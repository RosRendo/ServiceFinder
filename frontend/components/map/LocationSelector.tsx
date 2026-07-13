"use client";

import dynamic from "next/dynamic";
import { Loader2, MapPin } from "lucide-react";

// Dynamically import the Leaflet map component with SSR disabled
const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] sm:h-[400px] rounded-lg bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-gray-400">
      <Loader2 className="w-8 h-8 animate-spin mb-2" />
      <p className="text-sm font-medium">Loading map...</p>
    </div>
  ),
});

interface LocationSelectorProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  readOnly?: boolean;
}

export default function LocationSelector({ lat, lng, onChange, readOnly = false }: LocationSelectorProps) {
  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 text-blue-800 p-3 rounded-md">
          <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Drag the marker or click anywhere on the map to set the exact location for this service.
          </p>
        </div>
      )}
      
      <div className="relative">
        <LocationMap lat={lat} lng={lng} onChange={onChange} readOnly={readOnly} />
      </div>
      
      <div className="flex items-center gap-4 text-xs font-mono text-gray-500 bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
        <div><span className="font-semibold text-gray-700">Lat:</span> {lat.toFixed(6)}</div>
        <div><span className="font-semibold text-gray-700">Lng:</span> {lng.toFixed(6)}</div>
      </div>
    </div>
  );
}
