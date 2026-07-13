"use client";
import dynamic from "next/dynamic";
import { Company } from "@/types/company.types";

const DynamicCore = dynamic(() => import("./CompanyFullMapCore"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse rounded-2xl flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    </div>
  ),
});

interface Props {
  companies: Company[];
  selectedCompanyId?: string | null;
  onCompanySelect?: (id: string | null) => void;
  categorySlug?: string;
  serviceTypeSlug?: string;
}

export default function CompanyFullMap(props: Props) {
  return <DynamicCore {...props} />;
}
