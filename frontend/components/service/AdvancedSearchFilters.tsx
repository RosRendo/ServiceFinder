"use client";

import { useState } from "react";
import { Filter, Star, MapPin, DollarSign, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { Badge } from "@/components/ui/badge";


interface AdvancedSearchFiltersProps {
  onFilterChange?: (filters: any) => void;
  className?: string;
}

export function AdvancedSearchFilters({ onFilterChange, className = "" }: AdvancedSearchFiltersProps) {
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [availableNow, setAvailableNow] = useState(false);
  const [distance, setDistance] = useState(25); // km

  const applyFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        priceRange,
        minRating,
        availableNow,
        distance
      });
    }
  };

  const clearFilters = () => {
    setPriceRange([0, 500]);
    setMinRating(null);
    setAvailableNow(false);
    setDistance(25);
    applyFilters();
  };

  return (
    <div className={`bg-white border border-border rounded-xl shadow-sm overflow-hidden ${className}`}>
      <div className="p-4 border-b border-border bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Filter className="w-4 h-4" />
          Filter Results
        </div>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 text-muted-foreground">
          Clear All
        </Button>
      </div>

      <div className="w-full">
        {/* Price Range */}
        <details open className="border-b border-border px-4 group">
          <summary className="hover:no-underline py-4 list-none cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Price Range
            </div>
          </summary>
          <div className="pb-4">
            <div className="space-y-6 pt-2">

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Min ($)</Label>
                  <Input 
                    type="number" 
                    value={priceRange[0]} 
                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Max ($)</Label>
                  <Input 
                    type="number" 
                    value={priceRange[1]} 
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* Rating */}
        <details open className="border-b border-border px-4 group">
          <summary className="hover:no-underline py-4 list-none cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Star className="w-4 h-4 text-muted-foreground" />
              Minimum Rating
            </div>
          </summary>
          <div className="pb-4">
            <div className="space-y-2 pt-1">
              {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                <label 
                  key={rating} 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="rating" 
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                      <span className="text-sm font-medium">{rating} & Up</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </details>

        {/* Availability */}
        <details open className="border-b border-border px-4 group">
          <summary className="hover:no-underline py-4 list-none cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Availability
            </div>
          </summary>
          <div className="pb-4">
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="available-now" className="text-sm cursor-pointer flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Available Today
                </Label>
                <Switch 
                  id="available-now" 
                  checked={availableNow}
                  onCheckedChange={setAvailableNow}
                />
              </div>
              
              {availableNow && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal">
                  Showing only immediate availability
                </Badge>
              )}
            </div>
          </div>
        </details>

        {/* Location Distance */}
        <details open className="border-none px-4 group">
          <summary className="hover:no-underline py-4 list-none cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Maximum Distance
            </div>
          </summary>
          <div className="pb-4">
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span>Any</span>
                <span className="text-primary">{distance} km</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary mt-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>0</span>
                <span>50</span>
                <span>100+</span>
              </div>
            </div>
          </div>
        </details>
      </div>

      <div className="p-4 border-t border-border bg-slate-50/50">
        <Button className="w-full" onClick={applyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
