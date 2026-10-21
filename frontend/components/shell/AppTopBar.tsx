"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Search, Bell, Command, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/hooks/useNotifications";

interface AppTopBarProps {
  onCommandPaletteOpen: () => void;
  role: "admin" | "company";
}

const BREADCRUMB_MAP: Record<string, string> = {
  // Admin Routes
  "/admin/dashboard": "Dashboard",
  "/admin/analytics": "Analytics",
  "/admin/reports": "Reports",
  "/admin/bookings": "Bookings",
  "/admin/service-areas": "Service Areas",
  "/admin/verification": "Verification Queue",
  "/admin/compliance": "Compliance",
  "/admin/disputes": "Disputes",
  "/admin/reviews": "Reviews Audit",
  "/admin/moderation": "Content Moderation",
  "/admin/support": "Support Desk",
  "/admin/companies": "Companies",
  "/admin/users": "Users",
  "/admin/staff": "Staff",
  "/admin/categories": "Categories",
  "/admin/service-types": "Service Types",
  "/admin/broadcasts": "Campaigns",
  "/admin/promotions": "Promo Codes",
  "/admin/featured": "Featured Listings",
  "/admin/transactions": "Transactions Ledger",
  "/admin/payouts": "Payouts",
  "/admin/emails": "Email Templates",
  "/admin/audit": "Audit Logs",
  "/admin/settings": "Settings",

  // Company Routes
  "/company/dashboard": "Dashboard",
  "/company/analytics": "Analytics",
  "/company/reports": "Reports",
  "/company/notifications": "Notifications",
  "/company/messages": "Messages",
  "/company/dispatch": "Dispatch Center",
  "/company/bookings": "Bookings",
  "/company/schedule": "Schedule",
  "/company/staff": "Staff Management",
  "/company/areas": "Coverage Areas",
  "/company/services": "Services",
  "/company/customers": "Customers",
  "/company/pricing": "Pricing Rules",
  "/company/marketing": "Marketing & Promos",
  "/company/reviews": "Reviews",
  "/company/disputes": "Disputes",
  "/company/transactions": "Transactions Ledger",
  "/company/revenue": "Revenue & Analytics",
  "/company/commission-rules": "Commission Rules",
  "/company/payouts": "Payouts & Wallet",
  "/company/support": "Help & Support",
  "/company/settings": "Settings",
};

const SECTION_MAP: Record<string, string> = {
  // Admin Sections
  "/admin/dashboard": "Overview",
  "/admin/analytics": "Overview",
  "/admin/reports": "Overview",
  "/admin/bookings": "Operations",
  "/admin/service-areas": "Operations",
  "/admin/verification": "Trust & Safety",
  "/admin/compliance": "Trust & Safety",
  "/admin/disputes": "Trust & Safety",
  "/admin/reviews": "Trust & Safety",
  "/admin/moderation": "Trust & Safety",
  "/admin/support": "Trust & Safety",
  "/admin/companies": "Marketplace",
  "/admin/users": "Marketplace",
  "/admin/staff": "Marketplace",
  "/admin/categories": "Catalog & Growth",
  "/admin/service-types": "Catalog & Growth",
  "/admin/broadcasts": "Catalog & Growth",
  "/admin/promotions": "Catalog & Growth",
  "/admin/featured": "Catalog & Growth",
  "/admin/transactions": "Finance",
  "/admin/payouts": "Finance",
  "/admin/settings": "Platform Settings",
  "/admin/emails": "Platform Settings",
  "/admin/audit": "Platform Settings",

  // Company Sections
  "/company/dashboard": "Overview",
  "/company/analytics": "Overview",
  "/company/reports": "Overview",
  "/company/notifications": "Overview",
  "/company/messages": "Overview",
  "/company/dispatch": "Operations",
  "/company/bookings": "Operations",
  "/company/schedule": "Operations",
  "/company/staff": "Operations",
  "/company/areas": "Operations",
  "/company/services": "Business",
  "/company/customers": "Business",
  "/company/pricing": "Business",
  "/company/marketing": "Business",
  "/company/reviews": "Business",
  "/company/disputes": "Business",
  "/company/transactions": "Finance",
  "/company/revenue": "Finance",
  "/company/commission-rules": "Finance",
  "/company/payouts": "Finance",
  "/company/support": "Help & Settings",
  "/company/settings": "Help & Settings",
};

export function AppTopBar({ onCommandPaletteOpen, role }: AppTopBarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const section = SECTION_MAP[pathname] ?? "";
  const page = BREADCRUMB_MAP[pathname] ?? pathname.split("/").pop();

  const isDark = theme === "dark";

  return (
    <div className="h-14 shrink-0 flex items-center gap-4 px-6 border-b border-border/50 bg-background/80 backdrop-blur-md z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {section && <span>{section}</span>}
        {section && <span className="text-border">/</span>}
        <span className="text-foreground font-medium">{page}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Command Palette Trigger */}
      <button
        onClick={onCommandPaletteOpen}
        className={cn(
          "hidden md:flex items-center gap-2 h-9 px-3 rounded-lg border border-border/60",
          "bg-muted/40 text-muted-foreground text-sm hover:bg-muted/80 transition-colors cursor-pointer"
        )}
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden lg:block">Search anything...</span>
        <span className="hidden lg:flex items-center gap-1 ml-2 text-[11px] font-medium border border-border/40 rounded px-1.5 py-0.5 bg-background">
          <Command className="w-2.5 h-2.5" /> K
        </span>
      </button>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Notifications */}
      <Link href={role === "admin" ? "/admin/broadcasts" : "/company/notifications"}>
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </button>
      </Link>
    </div>
  );
}
