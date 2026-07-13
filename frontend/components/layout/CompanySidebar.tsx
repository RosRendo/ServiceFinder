"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, ListTodo, CalendarDays,
  Users, MapPin, Wrench, Wallet, MessageCircle, Star, Settings, Megaphone, LifeBuoy
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    group: "Overview",
    items: [
      { name: "Dashboard", href: "/company/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/company/analytics", icon: BarChart3 },
    ],
  },
  {
    group: "Operations",
    items: [
      { name: "Bookings", href: "/company/bookings", icon: ListTodo },
      { name: "Calendar", href: "/company/bookings/calendar", icon: CalendarDays },
      { name: "Staff", href: "/company/staff", icon: Users },
      { name: "Service Areas", href: "/company/areas", icon: MapPin },
    ],
  },
  {
    group: "Catalog",
    items: [
      { name: "Services", href: "/company/services", icon: Wrench },
    ],
  },
  {
    group: "Finance & Growth",
    items: [
      { name: "Payments", href: "/company/payments", icon: Wallet },
      { name: "Marketing", href: "/company/marketing", icon: Megaphone },
    ],
  },
  {
    group: "Communication",
    items: [
      { name: "Messages", href: "/company/messages", icon: MessageCircle },
      { name: "Reviews", href: "/company/reviews", icon: Star },
      { name: "Settings", href: "/company/settings", icon: Settings },
      { name: "Support", href: "/company/support", icon: LifeBuoy },
    ],
  },
];

export default function CompanySidebar({
  className = "",
  onItemClick,
}: {
  className?: string;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/company/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className={cn("h-screen flex flex-col bg-gray-950 text-white border-r border-gray-800", className)}>
      {/* Logo */}
      <div className="h-16 shrink-0 px-5 flex items-center border-b border-gray-800">
        <Link href="/company/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          <span className="font-semibold text-base text-white tracking-tight">
            Company Portal
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.group}>
            <p className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-100"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-blue-400" : "text-gray-500")} />
                    {item.name}
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">ServiceFinder &middot; Partner</p>
      </div>
    </div>
  );
}
