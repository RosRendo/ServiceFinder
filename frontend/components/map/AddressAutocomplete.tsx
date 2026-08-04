"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AddressAutocompleteProps {
  onSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
}

export default function AddressAutocomplete({ onSelect, placeholder = "Search for an address or place..." }: AddressAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 2) {
        setLoading(true);
        try {
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          console.log("Geocode results:", data);
          if (Array.isArray(data)) {
            setResults(data);
            setIsOpen(true);
          } else {
            setResults([]);
          }
        } catch (error) {
          console.error("Geocoding error", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (result: any) => {
    setQuery(result.display_name);
    setIsOpen(false);
    onSelect(result.display_name, parseFloat(result.lat), parseFloat(result.lon));
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className="pl-9 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-2xl z-[9999] max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0"
              onClick={() => handleSelect(r)}
            >
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{r.display_name.split(",")[0]}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{r.display_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
