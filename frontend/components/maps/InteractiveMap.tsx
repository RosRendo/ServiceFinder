"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface MapMarker {
    lat: number;
    lng: number;
    type: "company" | "customer" | "staff";
    label?: string;
    popupHtml?: string;
    color?: string;
    icon?: string;
    rawPayload?: any;
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
    onMarkerClick?: (marker: MapMarker) => void;
}

export default function InteractiveMap({
    markers,
    center,
    zoom = 14,
    className = "",
    trackStaff = false,
    onStaffMoved,
    onMarkerClick,
}: InteractiveMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const watchIdRef = useRef<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [mapInstance, setMapInstance] = useState<any>(null);
    const leafletMarkersRef = useRef<any[]>([]);

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

    // 1. Initialize Map Instance once
    useEffect(() => {
        if (!isMounted || !mapRef.current) return;
        if (mapInstance) return;

        let activeMap: any;

        import("leaflet").then((L) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const defaultCenter = center ?? (markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : { lat: 11.5564, lng: 104.9282 });
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

            activeMap = map;
            setMapInstance(map);
        });

        return () => {
            if (activeMap) {
                activeMap.remove();
                setMapInstance(null);
            }
        };
    }, [isMounted]);

    // 2. Draw and update markers reactively
    useEffect(() => {
        if (!mapInstance) return;

        // Clear existing markers and paths
        leafletMarkersRef.current.forEach((m) => m.remove());
        leafletMarkersRef.current = [];

        import("leaflet").then((L) => {
            markers.forEach((m) => {
                const color = m.color || markerColors[m.type];
                const iconEmoji = m.icon || (m.type === "company" ? "🏢" : m.type === "staff" ? "👷" : "📍");
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
                ${iconEmoji}
              </div>
            </div>
          `,
                    className: "",
                    iconSize: [36, 36],
                    iconAnchor: [18, 36],
                    popupAnchor: [0, -36],
                });

                const marker = L.marker([m.lat, m.lng], { icon: svgIcon }).addTo(mapInstance);

                marker.on("click", () => {
                    if (onMarkerClick) {
                        onMarkerClick(m);
                    }
                });

                const popupContent = m.popupHtml || `
          <div style="font-family:Inter,sans-serif;padding:4px 2px">
            <p style="font-weight:600;margin:0 0 4px">${m.label || m.type}</p>
            <p style="font-size:12px;color:#6b7280;margin:0">${m.type === "company" ? "📍 Service Location" : m.type === "staff" ? "🚗 Staff Location" : "📍 Your Location"}</p>
          </div>
        `;
                marker.bindPopup(popupContent);
                leafletMarkersRef.current.push(marker);
            });

            // Draw route line if both company and customer exist
            const companyM = markers.find((m) => m.type === "company");
            const customerM = markers.find((m) => m.type === "customer");
            if (companyM && customerM) {
                const polyline = L.polyline([[customerM.lat, customerM.lng], [companyM.lat, companyM.lng]], {
                    color: "#7C3AED",
                    weight: 2.5,
                    dashArray: "8,6",
                    opacity: 0.6,
                }).addTo(mapInstance);
                leafletMarkersRef.current.push(polyline);
            }
        });
    }, [mapInstance, markers]);

    // 3. Geolocation watch for staff
    useEffect(() => {
        if (!mapInstance || !trackStaff || !("geolocation" in navigator)) return;

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                onStaffMoved?.(latitude, longitude);
                mapInstance.panTo([latitude, longitude]);
            },
            undefined,
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [mapInstance, trackStaff]);

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
