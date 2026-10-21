"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Bell, Mail, CalendarClock, Map, Users, CalendarDays,
  UserRound, Layers, Star, TrendingUp, CreditCard, Receipt, BarChart3, Settings,
  ShieldCheck, Wrench, ShieldAlert, FileText, Bot, Zap, PieChart, LifeBuoy, Building2, Tag,
  ChevronDown, Sparkles, MessageSquare, Percent, Activity, ChevronsUpDown,
  LogOut, User as UserIcon, PanelLeftClose, PanelLeft, Flag, Wallet, Scale, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/BrandLogo";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useMessages } from "@/lib/hooks/useMessages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  exact?: boolean;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

function buildAdminNav(unreadCount: number, unreadMessagesCount: number): NavGroup[] {
  return [
    {
      group: "Overview",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, exact: true },
      ],
    },
    {
      group: "Operations",
      items: [
        { name: "Bookings", href: "/admin/bookings", icon: CalendarClock },
        { name: "Service Areas", href: "/admin/service-areas", icon: Map },
      ],
    },
    {
      group: "Trust & Safety",
      items: [
        { name: "Verification Queue", href: "/admin/verification", icon: ShieldCheck },
        { name: "Compliance", href: "/admin/compliance", icon: FileText },
        { name: "Disputes", href: "/admin/disputes", icon: Scale },
        { name: "Reviews Audit", href: "/admin/reviews", icon: Star },
        { name: "Content Moderation", href: "/admin/moderation", icon: Flag },
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
      ],
    },
    {
      group: "Platform Settings",
      items: [
        { name: "System Settings", href: "/admin/settings", icon: Settings },
        { name: "System Monitoring", href: "/admin/monitoring", icon: Activity },
        { name: "Email Templates", href: "/admin/emails", icon: Mail },
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
        { name: "Dashboard", href: "/company/dashboard", icon: LayoutDashboard, exact: true },
        {
          name: "Notifications",
          href: "/company/notifications",
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount.toString() : undefined,
        },
        {
          name: "Messages",
          href: "/company/messages",
          icon: MessageSquare,
          badge: unreadMessagesCount > 0 ? unreadMessagesCount.toString() : undefined,
        },
      ],
    },
    {
      group: "Operations",
      items: [
        { name: "Dispatch Center", href: "/company/dispatch", icon: Map },
        { name: "Bookings", href: "/company/bookings", icon: CalendarClock },
        { name: "Schedule", href: "/company/schedule", icon: CalendarDays },
        { name: "Staff Management", href: "/company/staff", icon: Users },
        { name: "Coverage Areas", href: "/company/areas", icon: MapPin },
      ],
    },
    {
      group: "Business",
      items: [
        { name: "Services", href: "/company/services", icon: Layers },
        { name: "Customers", href: "/company/customers", icon: UserRound },
        { name: "Pricing Rules", href: "/company/pricing", icon: Tag },
        { name: "Marketing & Promos", href: "/company/marketing", icon: Sparkles },
        { name: "Reviews", href: "/company/reviews", icon: Star },
        { name: "Disputes", href: "/company/disputes", icon: Scale },
      ],
    },
    {
      group: "Finance",
      items: [
        { name: "Revenue & Analytics", href: "/company/revenue", icon: TrendingUp },
        { name: "Payouts & Wallet", href: "/company/payouts", icon: Wallet },
        { name: "Transactions Ledger", href: "/company/transactions", icon: Receipt },
        { name: "Commission Rules", href: "/company/commission-rules", icon: Percent },
      ],
    },
    {
      group: "Help & Settings",
      items: [
        { name: "Help & Support", href: "/company/support", icon: LifeBuoy },
        { name: "Profile & Settings", href: "/company/settings", icon: Settings },
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
  const { user, logout } = useAuthContext();
  const { unreadCount } = useNotifications();
  const { unreadCount: unreadMessagesCount } = useMessages();

  const groups = useMemo(
    () => (role === "admin" ? buildAdminNav(unreadCount, unreadMessagesCount) : buildCompanyNav(unreadCount, unreadMessagesCount)),
    [role, unreadCount, unreadMessagesCount]
  );

  // Collapsible section accordions state with local storage persistence
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sf_sidebar_collapsed_${role}`);
      if (saved) {
        setCollapsedGroups(JSON.parse(saved));
      }
    } catch {
      // ignore JSON / storage errors
    }
  }, [role]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupName]: !prev[groupName] };
      try {
        localStorage.setItem(`sf_sidebar_collapsed_${role}`, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    const [itemPath, itemQuery] = item.href.split("?");

    // 1. If this item has a specific query (like ?tab=integrations)
    if (itemQuery) {
      if (typeof window !== "undefined") {
        const currentParams = new URLSearchParams(window.location.search);
        const itemParams = new URLSearchParams(itemQuery);
        return pathname === itemPath && currentParams.get("tab") === itemParams.get("tab");
      }
      return false;
    }

    // 2. Exact pathname match
    if (pathname === itemPath) {
      // If user is on /admin/settings?tab=integrations, don't activate the plain /admin/settings
      if (typeof window !== "undefined" && itemPath === "/admin/settings") {
        const currentTab = new URLSearchParams(window.location.search).get("tab");
        if (currentTab && currentTab !== "general") {
          return false;
        }
      }
      return true;
    }

    // 3. Nested child route matching (e.g. /admin/bookings/123 -> /admin/bookings)
    return (
      itemPath !== `/${role}` &&
      itemPath !== `/${role}/dashboard` &&
      pathname.startsWith(itemPath + "/")
    );
  };

  // Derive user info
  const displayName = user?.fullName || (role === "admin" ? "Platform Admin" : "Company Partner");
  const displayEmail = user?.email || (role === "admin" ? "admin@servicefinder.com" : "partner@servicefinder.com");
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const companyName = user?.ownedCompanies?.[0]?.name || "ProService Partner";

  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-card/95 dark:bg-[#090d16]/98 backdrop-blur-md border-r border-border/60 transition-all duration-200 ease-in-out select-none relative z-30 shrink-0",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* ─── Header: Workspace Switcher ────────────────────────────────────── */}
      <div className="h-16 shrink-0 flex items-center px-3 border-b border-border/50">
        {!collapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center gap-3 p-1.5 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/40 transition-colors text-left group cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs tracking-wider shadow-xs transition-transform group-hover:scale-102",
                    role === "admin"
                      ? "bg-slate-950 dark:bg-slate-900 border border-slate-800 p-1"
                      : "bg-primary/10 text-primary border border-primary/20"
                  )}
                >
                  {role === "admin" ? <BrandMark className="w-6 h-6" /> : <Building2 className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground tracking-tight truncate">
                      {role === "admin" ? "ServiceFinder HQ" : companyName}
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider shrink-0",
                        role === "admin"
                          ? "bg-foreground/10 text-foreground"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {role === "admin" ? "Admin" : "Verified"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {role === "admin" ? "Global Operations" : "Service Provider Hub"}
                  </p>
                </div>

                <ChevronsUpDown className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground shrink-0 transition-colors mr-0.5" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-[236px] p-1.5">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground tracking-wider uppercase">
                Active Workspace
              </DropdownMenuLabel>
              <div className="px-2 py-1.5 text-xs">
                <p className="font-semibold text-foreground">{role === "admin" ? "ServiceFinder HQ" : companyName}</p>
                <p className="text-[11px] text-muted-foreground">{displayEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={role === "admin" ? "/admin/settings" : "/company/settings"} className="cursor-pointer text-xs">
                  <Settings className="w-3.5 h-3.5 mr-2" />
                  Workspace Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="w-full flex items-center justify-center">
            <button
              onClick={onToggle}
              title="Expand Sidebar"
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold shadow-xs hover:scale-105 transition-all cursor-pointer",
                role === "admin"
                  ? "bg-slate-950 dark:bg-slate-900 border border-slate-800 p-1"
                  : "bg-primary/10 text-primary border border-primary/20"
              )}
            >
              {role === "admin" ? <BrandMark className="w-6 h-6" /> : <Building2 className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>

      {/* ─── Nav Groups with Collapsible Accordions ───────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-3.5 scrollbar-thin scrollbar-thumb-muted">
        {groups.map((group) => {
          const isGroupCollapsed = !!collapsedGroups[group.group];
          const hasActiveChild = group.items.some((item) => isActive(item));

          return (
            <div key={group.group} className="space-y-1">
              {/* Group Accordion Header */}
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.group)}
                  className="w-full flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] font-semibold text-muted-foreground/70 hover:text-foreground tracking-wider uppercase transition-colors group cursor-pointer"
                >
                  <span className={cn(hasActiveChild && "text-foreground font-bold")}>
                    {group.group}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-transform duration-200",
                      isGroupCollapsed && "-rotate-90"
                    )}
                  />
                </button>
              ) : (
                <div className="h-px bg-border/40 my-2 mx-1" />
              )}

              {/* Group Items (Hidden if accordion collapsed, unless collapsed sidebar mode) */}
              {(!isGroupCollapsed || collapsed) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item);

                    return (
                      <Link
                        key={`${group.group}-${item.name}-${item.href}`}
                        href={item.href}
                        onClick={onItemClick}
                        title={collapsed ? item.name : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                          active
                            ? "bg-muted text-foreground font-semibold shadow-xs"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                          collapsed && "justify-center px-0 py-2.5"
                        )}
                      >
                        {/* Active vertical hairline pill indicator */}
                        {active && !collapsed && (
                          <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-4.5 bg-foreground rounded-full" />
                        )}

                        <item.icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors duration-150",
                            active
                              ? "text-foreground"
                              : "text-muted-foreground/70 group-hover:text-foreground"
                          )}
                        />

                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate tracking-tight">{item.name}</span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                  active
                                    ? "bg-foreground/15 text-foreground"
                                    : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}

                        {/* Collapsed dot badge */}
                        {collapsed && item.badge && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Footer: User Profile & Collapse Toggle ───────────────────────── */}
      <div className="shrink-0 border-t border-border/50 p-2 space-y-1.5 bg-card/60">
        <div className="flex items-center justify-between gap-1.5">
          {!collapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex-1 flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-muted/60 transition-colors text-left group cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring min-w-0"
                >
                  <Avatar className="w-8 h-8 rounded-lg shrink-0 border border-border/60">
                    <AvatarImage src={user?.avatar} alt={displayName} />
                    <AvatarFallback className="rounded-lg text-xs font-semibold bg-muted text-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate tracking-tight">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {displayEmail}
                    </p>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground shrink-0 transition-colors" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-[220px] p-1.5">
                <DropdownMenuLabel className="text-xs font-semibold">My Account</DropdownMenuLabel>
                <div className="px-2 py-1 text-[11px] text-muted-foreground truncate">{displayEmail}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={role === "admin" ? "/admin/settings" : "/company/settings"} className="cursor-pointer text-xs">
                    <UserIcon className="w-3.5 h-3.5 mr-2" />
                    Profile & Preferences
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="cursor-pointer text-xs text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400 focus:bg-rose-500/10"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="w-full flex flex-col items-center gap-2 py-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title={displayName}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="w-9 h-9 rounded-lg border border-border/60">
                      <AvatarImage src={user?.avatar} alt={displayName} />
                      <AvatarFallback className="rounded-lg text-xs font-semibold bg-muted text-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right" className="w-[200px] p-1.5">
                  <DropdownMenuLabel className="text-xs font-semibold">{displayName}</DropdownMenuLabel>
                  <div className="px-2 py-0.5 text-[11px] text-muted-foreground truncate">{displayEmail}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={role === "admin" ? "/admin/settings" : "/company/settings"} className="cursor-pointer text-xs">
                      <UserIcon className="w-3.5 h-3.5 mr-2" />
                      Profile & Preferences
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="cursor-pointer text-xs text-rose-600 dark:text-rose-400"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Sidebar Collapse Toggle Button */}
          {!collapsed && (
            <button
              type="button"
              onClick={onToggle}
              title="Collapse sidebar"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed expansion button */}
        {collapsed && (
          <button
            type="button"
            onClick={onToggle}
            title="Expand sidebar"
            className="w-full py-1.5 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
