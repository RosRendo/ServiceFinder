"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Search, Bell, ChevronDown, Command, Sun, Moon, User, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { useNotifications } from "@/lib/hooks/useNotifications";

interface AppTopBarProps {
  onCommandPaletteOpen: () => void;
  role: "admin" | "company";
}

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/bookings": "Booking Queue",
  "/admin/dispatch": "Dispatch Center",
  "/admin/staff": "Staff Management",
  "/admin/schedule": "Schedule Center",
  "/admin/customers": "Customers",
  "/admin/companies": "Companies",
  "/admin/services": "Services",
  "/admin/reviews": "Reviews",
  "/admin/revenue": "Revenue",
  "/admin/payouts": "Payouts",
  "/admin/transactions": "Transactions",
  "/admin/invoices": "Invoices",
  "/admin/reports": "Reports",
  "/admin/automation": "Automation",
  "/admin/settings": "Settings",
  "/company/dashboard": "Dashboard",
  "/company/bookings": "Booking Queue",
  "/company/dispatch": "Dispatch Center",
  "/company/schedule": "Schedule Center",
  "/company/staff": "Staff Management",
  "/company/customers": "Customers",
  "/company/services": "Services",
  "/company/reviews": "Reviews",
  "/company/revenue": "Revenue",
  "/company/payouts": "Payouts",
  "/company/settings": "Settings",
};

const SECTION_MAP: Record<string, string> = {
  "/admin/dashboard": "Overview",
  "/admin/notifications": "Overview",
  "/admin/messages": "Overview",
  "/admin/bookings": "Operations",
  "/admin/dispatch": "Operations",
  "/admin/staff": "Operations",
  "/admin/schedule": "Operations",
  "/admin/customers": "Business",
  "/admin/companies": "Business",
  "/admin/services": "Business",
  "/admin/reviews": "Business",
  "/admin/revenue": "Finance",
  "/admin/payouts": "Finance",
  "/admin/transactions": "Finance",
  "/admin/invoices": "Finance",
  "/admin/reports": "System",
  "/admin/automation": "System",
  "/admin/settings": "System",
};

export function AppTopBar({ onCommandPaletteOpen, role }: AppTopBarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuthContext();
  const { unreadCount } = useNotifications();
  const [profileOpen, setProfileOpen] = useState(false);

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
          "bg-muted/40 text-muted-foreground text-sm hover:bg-muted/80 transition-colors"
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
        className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Notifications */}
      {/* Admin has no dedicated notifications page; broadcasts is the comms center */}
      <Link href={role === "admin" ? "/admin/broadcasts" : "/company/notifications"}>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 ring-2 ring-background" />
          )}
        </button>
      </Link>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-muted/60 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {role === "admin" ? "A" : "C"}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {profileOpen && <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />}
        {profileOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-popover shadow-elevated z-50 py-1">
            <button
              onClick={() => { setProfileOpen(false); window.location.href = role === "admin" ? "/admin/settings" : "/company/settings"; }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/50"
            >
              <User className="w-3.5 h-3.5 text-muted-foreground" /> Profile & Settings
            </button>
            <div className="h-px bg-border mx-2 my-1" />
            <button 
              onClick={() => logout()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
