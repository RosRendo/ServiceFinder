"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface StaffBookingMapCoreProps {
    latitude: number | null | undefined;
    longitude: number | null | undefined;
    customerName: string;
    serviceAddress: string;
}

function MapBounds({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], 14);
    }, [lat, lng, map]);
    return null;
}

export default function StaffBookingMapCore({
    latitude,
    longitude,
    customerName,
    serviceAddress,
}: StaffBookingMapCoreProps) {
    if (!latitude || !longitude) {
        return (
            <div className="h-64 w-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800 animate-bounce">
                        <MapPin className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md">
                        <p className="text-sm font-medium">{customerName}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-64 w-full overflow-hidden shadow-card">
            <MapContainer
                center={[latitude, longitude]}
                zoom={14}
                scrollWheelZoom={false}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapBounds lat={latitude} lng={longitude} />

                <Marker position={[latitude, longitude]}>
                    <Popup className="custom-popup">
                        <div className="font-semibold">{customerName}</div>
                        <div className="text-xs text-muted-foreground">
                            {serviceAddress}
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
