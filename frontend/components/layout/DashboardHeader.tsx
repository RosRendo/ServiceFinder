"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  MapPin,
  Plus,
  Power,
  ChevronRight,
  LogOut,
  Settings,
  User as UserIcon,
  Menu,
} from "lucide-react";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DashboardHeader({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(true);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <header className="h-[72px] bg-white border-b border-gray-100 z-40 sticky top-0" />;

  // Dynamic breadcrumbs based on pathname
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs = paths.map((p, i) => {
    const isLast = i === paths.length - 1;
    const label = p.charAt(0).toUpperCase() + p.slice(1).replace("-", " ");
    return {
      label,
      href: "/" + paths.slice(0, i + 1).join("/"),
      isLast,
    };
  });

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : user?.email?.[0].toUpperCase() || "U";

  return (
    <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 transition-shadow w-full">
      
      {/* Left side: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:flex items-center text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.href} className="flex items-center">
              {idx > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
              {crumb.isLast ? (
                <span className="font-bold text-gray-800">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="font-medium text-gray-500 hover:text-gray-900 transition">
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-xl mx-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search records, users, settings (Cmd + K)"
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
        </div>
      </div>

      {/* Right side: Role Widgets & Profile */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Role-Specific Switch Statement */}
        {user?.role === "customer" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden lg:flex items-center gap-1.5 rounded-xl border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Phnom Penh</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="font-semibold text-blue-600">Phnom Penh</DropdownMenuItem>
              <DropdownMenuItem>Siem Reap</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {user?.role === "staff" && (
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
            <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? "bg-red-500" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
            <span className="text-xs font-bold text-gray-700 mr-2">{isOffline ? "Offline" : "Actively Taking Jobs"}</span>
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isOffline ? "bg-gray-200" : "bg-emerald-500"}`}
            >
              <span className={`pointer-events-none absolute left-0.5 inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${isOffline ? "translate-x-0" : "translate-x-4"}`} />
            </button>
          </div>
        )}

        {user?.role === "company_admin" && (
          <Button size="sm" className="hidden sm:flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            <span className="font-semibold">Create</span>
          </Button>
        )}

        {user?.role === "admin" && (
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Systems Operational
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 bg-red-50 border border-red-100 text-red-600 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5" />
              3 Verification Queue
            </div>
          </div>
        )}

        {/* Missing AlertCircle - we'll inline a simple SVG if not imported properly */}
        {user?.role === "admin" && (
            <svg style={{display:'none'}} />
        )}

        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full cursor-pointer hover:bg-transparent hover:ring-2 hover:ring-gray-200 p-0 border border-gray-200">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs font-bold bg-blue-50 text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 font-sans">
            <DropdownMenuLabel className="font-normal py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-gray-900 leading-none">{user?.fullName || "User"}</p>
                <p className="text-xs text-gray-500 leading-none mt-1">{user?.email}</p>
                <Badge variant="outline" className="mt-2 w-fit text-[10px] uppercase text-gray-500 bg-gray-50">
                  {user?.role?.replace("_", " ")}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${user?.role === "company_admin" ? "company" : user?.role}/profile`} className="cursor-pointer py-2">
                <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                My Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${user?.role === "company_admin" ? "company" : user?.role}/settings`} className="cursor-pointer py-2">
                <Settings className="w-4 h-4 mr-2 text-gray-500" />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer py-2 font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}

// Inline alert circle icon since it wasn't imported at top
function AlertCircle(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
