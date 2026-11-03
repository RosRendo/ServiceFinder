"use client";

import { Star } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

export default function AdminFeaturedListingsPage() {
  return (
    <div className="h-full flex items-center justify-center p-4 sm:p-6 bg-background">
      <EmptyState
        icon={Star}
        title="Featured Listings not yet implemented"
        description="Sponsored placements and priority ranking require backend support that is not available yet. This module is under development."
      />
    </div>
  );
}
