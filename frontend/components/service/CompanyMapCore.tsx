"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Company } from "@/types/company.types";
import { Badge } from "@/components/ui/badge";
import { Star, Shield } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Fix default icon paths in bundled environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface CompanyMapCoreProps {
    companies: Company[];
    categorySlug?: string;
    serviceTypeSlug?: string;
    selectedCompanyId?: string | null;
    onCompanySelect?: (id: string | null) => void;
    /** full = standalone 600px tall page; side = compact panel */
    variant?: "full" | "side";
}

function createNumberedIcon(index: number, selected: boolean) {
    const size = selected ? 42 : 34;
    const bg = selected ? "#7C3AED" : "#ffffff";
    const color = selected ? "#ffffff" : "#7C3AED";
    const border = selected ? "none" : "2px solid #7C3AED";
    const shadow = selected ? "0 4px 20px rgba(124,58,237,0.55)" : "0 2px 8px rgba(0,0,0,0.22)";
    return L.divIcon({
        html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50% 50% 50% 0;
      background:${bg};
      border:${border};
      box-shadow:${shadow};
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      transition:all 0.2s;
    ">
      <span style="transform:rotate(45deg);font-size:${selected ? 14 : 12}px;font-weight:700;color:${color};">${index + 1}</span>
    </div>`,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
}

// Fly to selected company marker
function FlyToSelected({ companies, selectedId }: { companies: Company[]; selectedId?: string | null }) {
    const map = useMap();
    useEffect(() => {
        if (!selectedId) return;
        const c = companies.find((cc) => cc.id === selectedId);
        if (c?.coordinates?.latitude && c?.coordinates?.longitude) {
            map.flyTo([c.coordinates.latitude, c.coordinates.longitude], 15, { duration: 0.8 });
        }
    }, [selectedId, companies, map]);
    return null;
}

// Auto-fit bounds to all markers on load
function MapBounds({ companies }: { companies: Company[] }) {
    const map = useMap();
    const fitted = useRef(false);
    useEffect(() => {
        if (fitted.current) return;
        const coords = companies
            .filter((c) => c.coordinates?.latitude && c.coordinates?.longitude)
            .map((c) => [c.coordinates.latitude, c.coordinates.longitude] as [number, number]);
        if (coords.length > 0) {
            map.fitBounds(L.latLngBounds(coords), { padding: [50, 50], maxZoom: 14 });
            fitted.current = true;
        }
    }, [companies, map]);
    return null;
}

export default function CompanyMapCore({
    companies,
    categorySlug,
    serviceTypeSlug,
    selectedCompanyId,
    onCompanySelect,
    variant = "full",
}: CompanyMapCoreProps) {
    const companiesWithCoords = companies.filter(
        (c) => c.coordinates?.latitude != null && c.coordinates?.longitude != null
    );

    // Default center: average of all markers, fallback to Phnom Penh
    const center: [number, number] =
        companiesWithCoords.length > 0
            ? [
                companiesWithCoords.reduce((s, c) => s + (c.coordinates.latitude ?? 0), 0) / companiesWithCoords.length,
                companiesWithCoords.reduce((s, c) => s + (c.coordinates.longitude ?? 0), 0) / companiesWithCoords.length,
            ]
            : [11.5564, 104.9282];

    const height = variant === "side" ? "100%" : "600px";

    if (companiesWithCoords.length === 0) {
        return (
            <div className="rounded-2xl bg-card border-2 border-dashed border-border flex items-center justify-center" style={{ height: variant === "side" ? "400px" : "600px" }}>
                <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🗺️</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-1">No Locations Yet</h3>
                    <p className="text-muted-foreground text-sm">Companies haven't set their map coordinates yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative rounded-2xl overflow-hidden shadow-card border border-border" style={{ height }}>
            <MapContainer center={center} zoom={11} scrollWheelZoom={false} className="w-full h-full" style={{ minHeight: "300px" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapBounds companies={companiesWithCoords} />
                <FlyToSelected companies={companiesWithCoords} selectedId={selectedCompanyId} />

                {companiesWithCoords.map((company, idx) => {
                    const isSelected = company.id === selectedCompanyId;
                    return (
                        <Marker
                            key={company.id}
                            position={[company.coordinates.latitude, company.coordinates.longitude]}
                            icon={createNumberedIcon(idx, isSelected)}
                            eventHandlers={{
                                click: () => onCompanySelect?.(isSelected ? null : company.id),
                            }}
                            zIndexOffset={isSelected ? 1000 : 0}
                        >
                            <Popup className="custom-company-popup" minWidth={280} maxWidth={320}>
                                {/* Popup card */}
                                <div className="font-sans">
                                    {company.coverImageUrl && (
                                        <div className="relative -mx-3 -mt-3 mb-3 h-28 overflow-hidden rounded-t-lg">
                                            <Image src={company.coverImageUrl} alt={company.name} fill className="object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                        </div>
                                    )}
                                    <div className="flex gap-3 items-start">
                                        {company.logoUrl ? (
                                            <Image src={company.logoUrl} alt={company.name} width={40} height={40} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                                                <span className="text-violet-700 font-bold text-base">{company.name.charAt(0)}</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{company.name}</p>
                                                {(company.verified || company.verificationStatus === "verified") && (
                                                    <Shield className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {company.rating && (
                                                    <span className="flex items-center gap-0.5 text-xs text-gray-700">
                                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                        <span className="font-medium">{typeof company.rating === "number" ? company.rating.toFixed(1) : company.rating}</span>
                                                        {company.reviewCount && <span className="text-gray-400">({company.reviewCount})</span>}
                                                    </span>
                                                )}
                                                {company.priceRange?.min > 0 && (
                                                    <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                                                        From ${company.priceRange.min}
                                                    </span>
                                                )}
                                            </div>
                                            {company.city && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">📍 {company.city}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button asChild className="w-full mt-3 h-8 text-xs bg-violet-600 hover:bg-violet-700">
                                        <Link href={
                                            categorySlug && serviceTypeSlug
                                                ? `/customer/services/${categorySlug}/${serviceTypeSlug}/company/${company.id}`
                                                : `/company/${company.id}`
                                        }>
                                            View Services →
                                        </Link>
                                    </Button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Selected glow ring */}
                {selectedCompanyId && (() => {
                    const sel = companiesWithCoords.find((c) => c.id === selectedCompanyId);
                    if (!sel) return null;
                    return (
                        <CircleMarker
                            center={[sel.coordinates.latitude, sel.coordinates.longitude]}
                            radius={22}
                            pathOptions={{ color: "#7C3AED", weight: 2, fillColor: "#7C3AED", fillOpacity: 0.12 }}
                        />
                    );
                })()}
            </MapContainer>

            {/* Floating count badge */}
            <div className="absolute top-3 left-3 z-[400]">
                <span className="flex items-center gap-1.5 bg-white shadow-md border border-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    🏢 {companiesWithCoords.length} {companiesWithCoords.length === 1 ? "company" : "companies"}
                </span>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[400]">
                <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur shadow text-gray-500 text-xs px-3 py-1.5 rounded-full">
                    Click a pin to see details
                </span>
            </div>
        </div>
    );
}
