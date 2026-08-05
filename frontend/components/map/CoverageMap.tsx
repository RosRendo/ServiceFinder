"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Circle, useMap, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon missing issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CoverageMapProps {
  lat: number;
  lng: number;
  radiusKm: number;
  onChange?: (lat: number, lng: number) => void;
}

// Component to dynamically update map center/zoom when props change
function MapController({ lat, lng, radiusKm }: CoverageMapProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);

  useEffect(() => {
    // Fix leaflet grey block issue inside tabs
    const container = map.getContainer();
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    setTimeout(() => { map.invalidateSize(); }, 100);
    setTimeout(() => { map.invalidateSize(); }, 500);

    return () => resizeObserver.disconnect();
  }, [map]);

  return null;
}

export default function CoverageMap({ lat, lng, radiusKm, onChange }: CoverageMapProps) {
  const markerRef = useRef<any>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null && onChange) {
          const position = marker.getLatLng();
          onChange(position.lat, position.lng);
        }
      },
    }),
    [onChange],
  );

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <MapContainer 
        center={[lat, lng]} 
        zoom={11} 
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
        <Marker 
          draggable={!!onChange}
          eventHandlers={eventHandlers}
          position={[lat, lng]}
          ref={markerRef}
        />
        <MapController lat={lat} lng={lng} radiusKm={radiusKm} />
      </MapContainer>
    </>
  );
}
