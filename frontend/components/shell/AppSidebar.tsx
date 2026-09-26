"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Bell, Mail, CalendarClock, Map, Users, CalendarDays,
  UserRound, Layers, Star, TrendingUp, CreditCard, Receipt, BarChart3, Settings,
  ShieldCheck, Wrench, ShieldAlert, FileText, Bot, Zap, PieChart, LifeBuoy, Building2, Tag,
  ChevronLeft, ChevronRight, Sparkles, MessageSquare, Percent, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useMessages } from "@/lib/hooks/useMessages";

type NavItem = { name: string; href: string; icon: React.ElementType; badge?: string };
type NavGroup = { group: string; items: NavItem[] };

function buildAdminNav(unreadCount: number, unreadMessagesCount: number): NavGroup[] {
  return [
    {
      group: "Overview",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { name: "Reports", href: "/admin/reports", icon: PieChart },
      ],
    },
    {
      group: "Operations",
      items: [
        { name: "Bookings", href: "/admin/bookings", icon: CalendarClock },
        { name: "Dispatch Engine", href: "/admin/settings?tab=general", icon: Bot },
        { name: "Service Areas", href: "/admin/service-areas", icon: Map },
      ],
    },
    {
      group: "Trust & Safety",
      items: [
        { name: "Verification Queue", href: "/admin/verification", icon: ShieldCheck },
        { name: "Compliance", href: "/admin/compliance", icon: FileText },
        { name: "Disputes", href: "/admin/disputes", icon: ShieldAlert },
        { name: "Fraud Monitoring", href: "/admin/moderation", icon: ShieldAlert },
        { name: "Support Desk", href: "/admin/support", icon: LifeBuoy },
      ],
    },
    {
      group: "Marketplace",
      items: [
        { name: "Companies", href: "/admin/companies", icon: Building2 },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Staff", href: "/admin/staff", icon: UserRound },
      ],
    },
    {
      group: "Catalog & Growth",
      items: [
        { name: "Categories", href: "/admin/categories", icon: Layers },
        { name: "Service Types", href: "/admin/service-types", icon: Wrench },
        { name: "Campaigns", href: "/admin/broadcasts", icon: Sparkles },
        { name: "Promo Codes", href: "/admin/promotions", icon: Tag },
        { name: "Featured Listings", href: "/admin/featured", icon: Star },
      ],
    },
    {
      group: "Finance",
      items: [
        { name: "Transactions Ledger", href: "/admin/transactions", icon: Receipt },
        { name: "Payouts", href: "/admin/payouts", icon: CreditCard },
        { name: "Refunds", href: "/admin/refunds", icon: CreditCard },
      ],
    },
    {
      group: "Platform Settings",
      items: [
        { name: "System Settings", href: "/admin/settings?tab=general", icon: Settings },
        { name: "System Monitoring", href: "/admin/monitoring", icon: Activity },
        { name: "Email Settings", href: "/admin/emails", icon: Mail },
        { name: "Integrations", href: "/admin/settings?tab=integrations", icon: Zap },
        { name: "Audit Logs", href: "/admin/audit", icon: FileText },
      ],
    },
  ];
}

function buildCompanyNav(unreadCount: number, unreadMessagesCount: number): NavGroup[] {
  return [
    {
      group: "Overview",
      items: [
        { name: "Dashboard", href: "/company/dashboard", icon: LayoutDashboard },
        { name: "Analytics", href: "/company/analytics", icon: BarChart3 },
        { name: "Reports", href: "/company/reports", icon: PieChart },
        { name: "Notifications", href: "/company/notifications", icon: Bell, badge: unreadCount > 0 ? unreadCount.toString() : undefined },
        { name: "Messages", href: "/company/messages", icon: Mail, badge: unreadMessagesCount > 0 ? unreadMessagesCount.toString() : undefined },
      ],
    },
    {
      group: "Operations",
      items: [
        { name: "Dispatch Center", href: "/company/dispatch", icon: Map },
        { name: "Bookings", href: "/company/bookings", icon: CalendarClock },
        { name: "Schedule", href: "/company/schedule", icon: CalendarDays },
        { name: "Staff Management", href: "/company/staff", icon: Users },
      ],
    },
    {
      group: "Business",
      items: [
        { name: "Services", href: "/company/services", icon: Layers },
        { name: "Customers", href: "/company/customers", icon: UserRound },
        { name: "Reviews", href: "/company/reviews", icon: Star },
        { name: "Disputes", href: "/company/disputes", icon: ShieldAlert },
      ],
    },
    {
      group: "Finance",
      items: [
        { name: "Wallet", href: "/company/wallet", icon: CreditCard },
        { name: "Transactions Ledger", href: "/company/transactions", icon: Receipt },
        { name: "Revenue", href: "/company/revenue", icon: TrendingUp },
        { name: "Commission Rules", href: "/company/commission-rules", icon: Percent },
        { name: "Payouts", href: "/company/payouts", icon: CreditCard },
      ],
    },
    {
      group: "Settings",
      items: [
        { name: "Profile & Configuration", href: "/company/settings", icon: Settings },
      ],
    },
  ];
}

interface AppSidebarProps {
  role: "admin" | "company";
  collapsed: boolean;
  onToggle: () => void;
  onItemClick?: () => void;
}

export function AppSidebar({ role, collapsed, onToggle, onItemClick }: AppSidebarProps) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { unreadCount: unreadMessagesCount } = useMessages();
  const groups = role === "admin" ? buildAdminNav(unreadCount, unreadMessagesCount) : buildCompanyNav(unreadCount, unreadMessagesCount);

  const isActive = (href: string) =>
    pathname === href || (href !== `/${role}/dashboard` && pathname.startsWith(href));

  return (
    <div
      className={cn(
        "h-screen flex flex-col bg-[#0a0f1e] border-r border-white/[0.06] transition-all duration-300 ease-in-out",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="h-14 shrink-0 flex items-center border-b border-white/[0.06] px-3 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm text-white tracking-tight truncate">
            ServiceFinder {role === "admin" ? "Admin" : "Company"}
          </span>
        )}
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1">
        {groups.map((group) => (
          <div key={group.group} className="px-2">
            {!collapsed && (
              <p className="px-2 py-1 text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                {group.group}
              </p>
            )}
            {collapsed && <div className="h-px bg-white/[0.06] my-2" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={`${group.group}-${item.name}-${item.href}`}
                    href={item.href}
                    onClick={onItemClick}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "group flex items-center gap-3 px-2 py-2 rounded-md text-[13px] font-medium transition-all duration-150 relative",
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:bg-white/[0.05] hover:text-white/80"
                    )}
                  >
                    {/* Active indicator */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-400 rounded-r-full" />
                    )}
                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        active ? "text-violet-400" : "text-white/30 group-hover:text-white/60"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.badge && (
                          <span className="text-[10px] font-bold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && item.badge && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-violet-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-white/[0.06]">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md text-white/30 hover:bg-white/[0.05] hover:text-white/60 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </div>
  );
}
