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
  const map = useMapEvents({
    click(e) {
      if (!readOnly) {
        onChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  useEffect(() => {
    // Force recalculation of map size via a ResizeObserver to catch any CSS animation or flexbox changes
    const container = map.getContainer();
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(container);

    // Initial force
    setTimeout(() => { map.invalidateSize(); }, 100);
    setTimeout(() => { map.invalidateSize(); }, 500);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

export default function LocationMap({ lat, lng, onChange, readOnly = false }: LocationMapProps) {
  const [position, setPosition] = useState<[number, number]>([lat, lng]);

  useEffect(() => {
    setPosition([lat, lng]);
  }, [lat, lng]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="w-full h-[300px] sm:h-[400px] rounded-lg overflow-hidden border border-gray-200 shadow-inner">
        <MapContainer 
          center={position} 
          zoom={13} 
          scrollWheelZoom={!readOnly} 
          style={{ height: '100%', width: '100%' }}
        >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
    </>
  );
}
