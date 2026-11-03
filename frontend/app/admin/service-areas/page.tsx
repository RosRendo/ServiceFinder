"use client";

import { MapPin } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

export default function AdminServiceAreasPage() {
  return (
    <div className="h-full flex items-center justify-center p-4 sm:p-6 bg-background">
      <EmptyState
        icon={MapPin}
        title="Service areas not yet implemented"
        description="Platform-wide territory and zone management requires backend support that is not available yet. Companies currently manage their own coverage areas."
      />
    </div>
  );
}
