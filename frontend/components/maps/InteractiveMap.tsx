"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface MapMarker {
    lat: number;
    lng: number;
    type: "company" | "customer" | "staff";
    label?: string;
    popupHtml?: string;
}

interface InteractiveMapProps {
    markers: MapMarker[];
    /** Center override – defaults to first marker */
    center?: { lat: number; lng: number };
    zoom?: number;
    className?: string;
    /** If true, the staff marker position will be watched via geolocation (staff navigation mode) */
    trackStaff?: boolean;
    onStaffMoved?: (lat: number, lng: number) => void;
}

export default function InteractiveMap({
    markers,
    center,
    zoom = 14,
    className = "",
    trackStaff = false,
    onStaffMoved,
}: InteractiveMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const watchIdRef = useRef<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Color palette for different marker types
    const markerColors: Record<MapMarker["type"], string> = {
        company: "#7C3AED",
        customer: "#0EA5E9",
        staff: "#F59E0B",
    };

    useEffect(() => {
        setIsMounted(true);
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isMounted || !mapRef.current) return;
        if (mapInstanceRef.current) return; // already initialised

        // Lazy-import leaflet (SSR safe)
        import("leaflet").then((L) => {
            // Fix broken default icon paths in webpack builds
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const defaultCenter = center ?? (markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : { lat: 11.5564, lng: 104.9282 }); // fallback: Phnom Penh
            const map = L.map(mapRef.current!, {
                center: [defaultCenter.lat, defaultCenter.lng],
                zoom,
                zoomControl: true,
                scrollWheelZoom: false,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map);

            // Draw markers
            markers.forEach((m) => {
                const color = markerColors[m.type];
                const svgIcon = L.divIcon({
                    html: `
            <div style="
              width:36px;height:36px;border-radius:50% 50% 50% 0;
              background:${color};border:3px solid white;
              box-shadow:0 4px 14px rgba(0,0,0,0.3);
              transform:rotate(-45deg);
              display:flex;align-items:center;justify-content:center;
            ">
              <div style="transform:rotate(45deg);color:white;font-size:13px;font-weight:bold;">
                ${m.type === "company" ? "🏢" : m.type === "staff" ? "👷" : "📍"}
              </div>
            </div>
          `,
                    className: "",
                    iconSize: [36, 36],
                    iconAnchor: [18, 36],
                    popupAnchor: [0, -36],
                });

                const marker = L.marker([m.lat, m.lng], { icon: svgIcon }).addTo(map);

                const popupContent = m.popupHtml || `
          <div style="font-family:Inter,sans-serif;padding:4px 2px">
            <p style="font-weight:600;margin:0 0 4px">${m.label || m.type}</p>
            <p style="font-size:12px;color:#6b7280;margin:0">${m.type === "company" ? "📍 Service Location" : m.type === "staff" ? "🚗 Staff Location" : "📍 Your Location"}</p>
          </div>
        `;
                marker.bindPopup(popupContent);
                markersRef.current.set(m.type, marker);
            });

            // Draw route line between customer & company if both present
            const companyM = markers.find((m) => m.type === "company");
            const customerM = markers.find((m) => m.type === "customer");
            if (companyM && customerM) {
                L.polyline([[customerM.lat, customerM.lng], [companyM.lat, companyM.lng]], {
                    color: "#7C3AED",
                    weight: 2.5,
                    dashArray: "8,6",
                    opacity: 0.6,
                }).addTo(map);
            }

            mapInstanceRef.current = map;

            // Staff real-time tracking
            if (trackStaff && "geolocation" in navigator) {
                watchIdRef.current = navigator.geolocation.watchPosition(
                    (pos) => {
                        const { latitude, longitude } = pos.coords;
                        onStaffMoved?.(latitude, longitude);

                        const staffMarker = markersRef.current.get("staff");
                        if (staffMarker) {
                            staffMarker.setLatLng([latitude, longitude]);
                            map.panTo([latitude, longitude]);
                        }
                    },
                    undefined,
                    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
                );
            }
        });

        // Add Leaflet CSS dynamically
        if (!document.getElementById("leaflet-css")) {
            const link = document.createElement("link");
            link.id = "leaflet-css";
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }
    }, [isMounted]);

    if (!isMounted) {
        return (
            <div className={`flex items-center justify-center bg-muted rounded-2xl ${className}`} style={{ minHeight: "240px" }}>
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            className={`rounded-2xl overflow-hidden shadow-soft border border-border ${className}`}
            style={{ minHeight: "240px" }}
        />
    );
}
