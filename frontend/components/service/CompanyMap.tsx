"use client";
import dynamic from "next/dynamic";
import { Company } from "@/types/company.types";

const DynamicCompanyMapCore = dynamic(
  () => import("./CompanyMapCore"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full bg-muted animate-pulse rounded-2xl flex items-center justify-center" style={{ minHeight: "400px" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading map…</p>
        </div>
      </div>
    ),
  }
);

interface CompanyMapProps {
  companies: Company[];
  categorySlug?: string;
  serviceTypeSlug?: string;
  selectedCompanyId?: string | null;
  onCompanySelect?: (id: string | null) => void;
  variant?: "full" | "side";
}

export default function CompanyMap({
  companies,
  categorySlug,
  serviceTypeSlug,
  selectedCompanyId,
  onCompanySelect,
  variant = "full",
}: CompanyMapProps) {
  return (
    <DynamicCompanyMapCore
      companies={companies}
      categorySlug={categorySlug}
      serviceTypeSlug={serviceTypeSlug}
      selectedCompanyId={selectedCompanyId}
      onCompanySelect={onCompanySelect}
      variant={variant}
    />
  );
}