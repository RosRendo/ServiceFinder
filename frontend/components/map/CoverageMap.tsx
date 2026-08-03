"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface CoverageMapProps {
  lat: number;
  lng: number;
  radiusKm: number;
}

// Component to dynamically update map center/zoom when props change
function MapController({ lat, lng, radiusKm }: CoverageMapProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
    // Auto fit bounds based on radius could be added, but keeping it simple for now
  }, [lat, lng, map]);

  return null;
}

export default function CoverageMap({ lat, lng, radiusKm }: CoverageMapProps) {
  return (
    <MapContainer 
      center={[lat, lng]} 
      zoom={11} 
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle 
        center={[lat, lng]} 
        radius={radiusKm * 1000} // radius in meters
        pathOptions={{ 
          color: "#8b5cf6", // violet-500
          fillColor: "#8b5cf6",
          fillOpacity: 0.2,
          weight: 2
        }} 
      />
      <MapController lat={lat} lng={lng} radiusKm={radiusKm} />
    </MapContainer>
  );
}
