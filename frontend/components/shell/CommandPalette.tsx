"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Command, Hash, User, Building2, CalendarClock, Settings, TrendingUp, Zap, Map, Scale, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  group: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  role: "admin" | "company";
}

function buildCommands(router: ReturnType<typeof useRouter>, role: string, onClose: () => void): CommandItem[] {
  const base = role === "admin" ? "/admin" : "/company";
  const navigate = (path: string) => { router.push(path); onClose(); };

  return [
    // Navigation
    { id: "dashboard", label: "Dashboard", icon: Hash, group: "Navigate", action: () => navigate(`${base}/dashboard`), keywords: ["home", "overview"] },
    { id: "bookings", label: "Booking Queue", description: "View all bookings", icon: CalendarClock, group: "Navigate", action: () => navigate(`${base}/bookings`), keywords: ["jobs", "orders"] },
    { id: "staff", label: "Staff Management", icon: User, group: "Navigate", action: () => navigate(`${base}/staff`), keywords: ["employees", "workers"] },
    { id: "customers", label: "Customers", icon: User, group: "Navigate", action: () => navigate(`${base}/customers`), keywords: ["clients", "users"] },
    { id: "companies", label: "Companies", icon: Building2, group: "Navigate", action: () => navigate(`${base}/companies`) },
    { id: "revenue", label: "Revenue & Financials", icon: TrendingUp, group: "Navigate", action: () => navigate(`${base}/revenue`), keywords: ["money", "finance", "earnings", "payouts"] },
    { id: "disputes", label: "Disputes & Mediation", description: "Arbitration & customer conflict claims", icon: Scale, group: "Navigate", action: () => navigate(`${base}/disputes`), keywords: ["disputes", "claims", "refunds", "arbitration"] },
    ...(role === "admin"
      ? [{ id: "reviews", label: "Reviews Audit", description: "Audit customer ratings & reviews", icon: Star, group: "Navigate", action: () => navigate("/admin/reviews"), keywords: ["reviews", "ratings", "feedback"] }]
      : [{ id: "dispatch", label: "Dispatch Center", description: "Live GPS fleet dispatch console", icon: Map, group: "Navigate", action: () => navigate("/company/dispatch"), keywords: ["dispatch", "map", "radar"] }]),
    { id: "settings", label: "Settings", icon: Settings, group: "Navigate", action: () => navigate(`${base}/settings`) },
    // Quick Actions
    { id: "new-booking", label: "Create New Booking", icon: CalendarClock, group: "Quick Actions", action: () => navigate(`${base}/bookings?new=true`), keywords: ["add", "create"] },
    { id: "export-report", label: "Export Today's Report", icon: TrendingUp, group: "Quick Actions", action: () => navigate(`${base}/reports?export=today`) },
    { id: "run-automation", label: "Manage Automation Rules", icon: Zap, group: "Quick Actions", action: () => navigate(`${base}/automation`) },
  ];
}

export function CommandPalette({ open, onClose, role }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const commands = buildCommands(router, role, onClose);

  const filtered = query.trim()
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.keywords?.some((k) => k.includes(q))
        );
      })
    : commands;

  // Group results
  const groups = Array.from(new Set(filtered.map((c) => c.group)));

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { setSelected((s) => Math.min(s + 1, filtered.length - 1)); e.preventDefault(); }
    if (e.key === "ArrowUp") { setSelected((s) => Math.max(s - 1, 0)); e.preventDefault(); }
    if (e.key === "Enter" && filtered[selected]) { filtered[selected].action(); }
  }, [open, filtered, selected, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (open) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  if (!open) return null;

  let itemIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[600px] mx-4 bg-background border border-border rounded-2xl shadow-elevated overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search or run a command..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No results for "{query}"</p>
          ) : (
            groups.map((group) => {
              const groupItems = filtered.filter((c) => c.group === group);
              return (
                <div key={group}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                    {group}
                  </p>
                  {groupItems.map((item) => {
                    itemIndex++;
                    const idx = itemIndex;
                    const isSelected = selected === idx;
                    return (
                      <button
                        key={item.id}
                        onMouseEnter={() => setSelected(idx)}
                        onClick={() => item.action()}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected ? "bg-muted/80 text-foreground" : "text-muted-foreground hover:bg-muted/40"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          isSelected ? "bg-violet-500/20" : "bg-muted"
                        )}>
                          <item.icon className={cn("w-3.5 h-3.5", isSelected ? "text-violet-400" : "text-muted-foreground")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium truncate", isSelected && "text-foreground")}>
                            {item.label}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                          )}
                        </div>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
