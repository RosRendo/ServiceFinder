"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CoverageMapProps {
  lat: number;
  lng: number;
  radiusKm: number;
  onChange?: (lat: number, lng: number) => void;
}

export default function CoverageMap({ lat, lng, radiusKm, onChange }: CoverageMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([lat, lng], 11);
      
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CartoDB</a>'
      }).addTo(map);

      const marker = L.marker([lat, lng], {
        draggable: !!onChange
      }).addTo(map);
      markerRef.current = marker;

      if (onChange) {
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          onChange(position.lat, position.lng);
        });
        
        map.on('click', (e) => {
          onChange(e.latlng.lat, e.latlng.lng);
        });
      }

      const circle = L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: "#8b5cf6",
        fillColor: "#8b5cf6",
        fillOpacity: 0.2,
        weight: 2
      }).addTo(map);
      circleRef.current = circle;

      // Handle resize observer to invalidate size (fixes container size issues in modals/tabs)
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);

      // Force layout recalculation multiple times to ensure it renders correctly after modal animation
      const timer1 = setTimeout(() => { map.invalidateSize(); }, 100);
      const timer2 = setTimeout(() => { map.invalidateSize(); }, 500);
      const timer3 = setTimeout(() => { map.invalidateSize(); }, 1000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        resizeObserver.disconnect();
        map.remove();
        mapRef.current = null;
      };
    }
  }, []);

  // Update map marker/circle when coordinates or radius change
  useEffect(() => {
    if (mapRef.current && markerRef.current && circleRef.current) {
      const newLatLng = new L.LatLng(lat, lng);
      markerRef.current.setLatLng(newLatLng);
      circleRef.current.setLatLng(newLatLng);
      circleRef.current.setRadius(radiusKm * 1000);
      mapRef.current.setView(newLatLng, mapRef.current.getZoom());
    }
  }, [lat, lng, radiusKm]);

  return (
    <div className="w-full h-full relative">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
    </div>
  );
}
