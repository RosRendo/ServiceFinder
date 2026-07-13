"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ListTodo,
  Briefcase,
  Ruler,
  Calendar,
  MessageCircle,
  CircleDollarSign,
  Palmtree,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    group: "Daily Work",
    items: [
      { name: "Today's Agenda", href: "/staff/dashboard", icon: ListTodo },
      { name: "My Jobs", href: "/staff/bookings", icon: Briefcase },
      { name: "Measurement Tool", href: "/staff/measurement", icon: Ruler },
      { name: "My Schedule", href: "/staff/schedule", icon: Calendar },
    ],
  },
  {
    group: "Communication",
    items: [
      { name: "Messages", href: "/staff/messages", icon: MessageCircle },
    ],
  },
  {
    group: "Personal",
    items: [
      { name: "My Earnings", href: "/staff/earnings", icon: CircleDollarSign },
      { name: "Time Off Requests", href: "/staff/availability", icon: Palmtree },
      { name: "My Performance", href: "/staff/profile", icon: Activity },
    ],
  },
];

export default function StaffSidebar({
  className = "",
  onItemClick,
}: {
  className?: string;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/staff/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div
      className={cn(
        "h-screen flex flex-col bg-white border-r border-gray-100 transition-all",
        className
      )}
    >
      <div className="h-[72px] shrink-0 px-6 flex items-center border-b border-gray-100 bg-gray-50/50">
        <Link href="/staff/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
            S
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">
            Staff Portal
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.group}>
            <h3 className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm w-full group",
                      active
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <item.icon
                      size={18}
                      className={cn(
                        "flex-shrink-0 transition-colors",
                        active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                      )}
                    />
                    <span>{item.name}</span>
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
