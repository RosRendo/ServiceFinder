"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon missing issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  readOnly?: boolean;
}

function MapEvents({ onChange, readOnly }: { onChange: (lat: number, lng: number) => void, readOnly: boolean }) {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        onChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function LocationMap({ lat, lng, onChange, readOnly = false }: LocationMapProps) {
  const [position, setPosition] = useState<[number, number]>([lat, lng]);

  useEffect(() => {
    setPosition([lat, lng]);
  }, [lat, lng]);

  return (
    <div className="w-full h-[300px] sm:h-[400px] rounded-lg overflow-hidden border border-gray-200 shadow-inner z-0">
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={!readOnly} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={position}
          draggable={!readOnly}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              onChange(pos.lat, pos.lng);
            },
          }}
        />
        <MapEvents onChange={onChange} readOnly={readOnly} />
      </MapContainer>
    </div>
  );
}
