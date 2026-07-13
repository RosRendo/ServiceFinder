"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Users, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ role }: { role: "company" | "admin" }) {
  const pathname = usePathname();

  const companyLinks = [
    { name: "Home", href: "/company/dashboard", icon: Home },
    { name: "Bookings", href: "/company/bookings", icon: Calendar },
    { name: "Staff", href: "/company/staff", icon: Users },
    { name: "Messages", href: "/company/messages", icon: MessageSquare },
    { name: "Settings", href: "/company/settings", icon: Settings },
  ];

  const adminLinks = [
    { name: "Home", href: "/admin/dashboard", icon: Home },
    { name: "Companies", href: "/admin/companies", icon: Users },
    { name: "Verify", href: "/admin/verification", icon: Calendar },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const links = role === "company" ? companyLinks : adminLinks;

  const isActive = (href: string) => {
    if (href === `/${role}/dashboard`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around z-50 px-2 pb-safe">
      {links.map((link) => {
        const active = isActive(link.href);
        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              active ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <div className={cn(
              "p-1 rounded-full transition-all",
              active ? "bg-blue-50" : "bg-transparent"
            )}>
              <link.icon className={cn("w-5 h-5", active ? "text-blue-600" : "")} />
            </div>
            <span className="text-[10px] font-medium">{link.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
