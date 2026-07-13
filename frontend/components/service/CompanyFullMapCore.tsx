"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Company } from "@/types/company.types";
import { Star, Shield, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Fix default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom pin icon ─────────────────────────────────────────────────────────
function createPulsingPin(index: number, selected: boolean) {
  const size = selected ? 46 : 36;
  const bg = selected
    ? "linear-gradient(135deg,#7C3AED,#4F46E5)"
    : "linear-gradient(135deg,#fff,#f3f4f6)";
  const color = selected ? "#fff" : "#7C3AED";
  const shadow = selected
    ? "0 6px 24px rgba(124,58,237,0.6)"
    : "0 2px 10px rgba(0,0,0,0.25)";
  const border = selected ? "none" : "2.5px solid #7C3AED";

  return L.divIcon({
    html: `
      <div style="
        position:relative;
        width:${size}px; height:${size}px;
        border-radius:50% 50% 50% 0;
        background:${bg};
        border:${border};
        box-shadow:${shadow};
        transform:rotate(-45deg);
        display:flex; align-items:center; justify-content:center;
        transition:all 0.25s ease;
      ">
        <span style="
          transform:rotate(45deg);
          font-size:${selected ? 15 : 12}px;
          font-weight:800;
          color:${color};
          line-height:1;
          user-select:none;
        ">${index + 1}</span>
      </div>
      ${selected ? `<div style="
        position:absolute; top:50%; left:50%;
        transform:translate(-50%,-50%);
        width:${size + 20}px; height:${size + 20}px;
        border-radius:50%;
        border:2px solid rgba(124,58,237,0.4);
        animation:ping 1.5s infinite;
        pointer-events:none;
      "></div>` : ""}
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size - 4],
  });
}

// ── Fly to selected ──────────────────────────────────────────────────────────
function FlyToSelected({
  companies,
  selectedId,
}: {
  companies: Company[];
  selectedId?: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const c = companies.find((cc) => cc.id === selectedId);
    if (c?.coordinates?.latitude && c?.coordinates?.longitude) {
      map.flyTo([c.coordinates.latitude, c.coordinates.longitude], 15, {
        duration: 0.8,
      });
    }
  }, [selectedId, companies, map]);
  return null;
}

// ── Auto-fit bounds ──────────────────────────────────────────────────────────
function MapBounds({ companies }: { companies: Company[] }) {
  const map = useMap();
  const fittedRef = useRef<string>("");

  useEffect(() => {
    const key = companies.map((c) => c.id).join(",");
    if (fittedRef.current === key) return;
    fittedRef.current = key;

    const coords = companies
      .filter((c) => c.coordinates?.latitude && c.coordinates?.longitude)
      .map((c) => [c.coordinates.latitude, c.coordinates.longitude] as [number, number]);

    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 14 });
    }
  }, [companies, map]);
  return null;
}

// ── Main export ──────────────────────────────────────────────────────────────
interface CompanyFullMapCoreProps {
  companies: Company[];
  selectedCompanyId?: string | null;
  onCompanySelect?: (id: string | null) => void;
  categorySlug?: string;
  serviceTypeSlug?: string;
}

export default function CompanyFullMapCore({
  companies,
  selectedCompanyId,
  onCompanySelect,
  categorySlug,
  serviceTypeSlug,
}: CompanyFullMapCoreProps) {
  const companiesWithCoords = companies.filter(
    (c) => c.coordinates?.latitude != null && c.coordinates?.longitude != null
  );

  const center: [number, number] =
    companiesWithCoords.length > 0
      ? [
          companiesWithCoords.reduce((s, c) => s + (c.coordinates.latitude ?? 0), 0) /
            companiesWithCoords.length,
          companiesWithCoords.reduce((s, c) => s + (c.coordinates.longitude ?? 0), 0) /
            companiesWithCoords.length,
        ]
      : [11.5564, 104.9282]; // Default: Phnom Penh

  const buildLink = (company: Company) => {
    if (categorySlug && serviceTypeSlug) {
      return `/customer/services/${categorySlug}/${serviceTypeSlug}/company/${company.id}`;
    }
    return `/customer/services`;
  };

  if (companiesWithCoords.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 rounded-2xl gap-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <MapPin className="w-10 h-10 text-muted-foreground opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">No map locations</p>
          <p className="text-sm text-muted-foreground mt-1">
            {companies.length > 0
              ? "These companies haven't set their coordinates yet."
              : "No companies found with the current filters."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl border border-border">
      {/* Inject ping animation */}
      <style>{`
        @keyframes ping {
          0% { transform: translate(-50%,-50%) scale(1); opacity:0.8; }
          100% { transform: translate(-50%,-50%) scale(1.8); opacity:0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18) !important;
          padding: 0 !important;
          overflow: hidden !important;
          border: 1px solid #e5e7eb !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: 300px !important;
        }
        .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-popup-close-button {
          top: 8px !important;
          right: 8px !important;
          z-index: 10 !important;
          background: rgba(255,255,255,0.8) !important;
          border-radius: 50% !important;
          width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 16px !important;
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        {/* CartoDB Voyager – free, no API key */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
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
              icon={createPulsingPin(idx, isSelected)}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => onCompanySelect?.(isSelected ? null : company.id),
              }}
            >
              <Popup minWidth={300} maxWidth={300}>
                <div className="font-sans overflow-hidden rounded-2xl">
                  {/* Cover image */}
                  {company.coverImageUrl ? (
                    <div className="relative h-32 w-full bg-gradient-to-br from-violet-100 to-indigo-50 overflow-hidden">
                      <Image
                        src={company.coverImageUrl}
                        alt={company.name}
                        fill
                        className="object-cover"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {/* Number badge */}
                      <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                        {idx + 1}
                      </div>
                      {(company.verified || company.verificationStatus === "verified") && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 text-violet-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          <Shield className="w-3 h-3" /> Verified
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-20 w-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                      <span className="text-4xl font-black text-violet-300">
                        {company.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Body */}
                  <div className="p-4 bg-white">
                    <div className="flex items-start gap-3 mb-3">
                      {company.logoUrl ? (
                        <Image
                          src={company.logoUrl}
                          alt={company.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100 shadow"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 shadow">
                          <span className="text-violet-700 font-black text-lg">
                            {company.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm leading-tight truncate">
                          {company.name}
                        </p>
                        {company.city && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {company.city}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {company.rating != null && (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {typeof company.rating === "number"
                            ? company.rating.toFixed(1)
                            : company.rating}
                          {company.reviewCount
                            ? ` (${company.reviewCount})`
                            : ""}
                        </span>
                      )}
                      {company.priceRange?.min > 0 && (
                        <span className="bg-violet-50 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          From ${company.priceRange.min}
                        </span>
                      )}
                    </div>

                    {company.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                        {company.description}
                      </p>
                    )}

                    {/* CTA */}
                    <a
                      href={buildLink(company)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-200"
                    >
                      View Services <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Glow ring on selected */}
        {selectedCompanyId && (() => {
          const sel = companiesWithCoords.find((c) => c.id === selectedCompanyId);
          if (!sel) return null;
          return (
            <CircleMarker
              center={[sel.coordinates.latitude, sel.coordinates.longitude]}
              radius={28}
              pathOptions={{
                color: "#7C3AED",
                weight: 2.5,
                fillColor: "#7C3AED",
                fillOpacity: 0.1,
                dashArray: "6 4",
              }}
            />
          );
        })()}
      </MapContainer>

      {/* Floating badges */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
        <span className="flex items-center gap-2 bg-white/95 shadow-lg border border-white text-gray-700 text-xs font-semibold px-3 py-2 rounded-full backdrop-blur-sm">
          🏢 {companiesWithCoords.length}{" "}
          {companiesWithCoords.length === 1 ? "company" : "companies"} on map
        </span>
      </div>
      <div className="absolute bottom-8 left-4 z-[400] pointer-events-none">
        <span className="flex items-center gap-1.5 bg-white/90 shadow text-gray-500 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
          🖱️ Click a pin to see details
        </span>
      </div>
    </div>
  );
}
