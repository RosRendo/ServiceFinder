"use client";

import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { AppTopBar } from "@/components/shell/AppTopBar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { AIAssistant } from "@/components/shell/AIAssistant";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen((o) => !o); }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <ProtectedRoute allowedRoles={['company_admin', 'admin']}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar role="company" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <AppTopBar role="company" onCommandPaletteOpen={() => setCmdOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-muted/20 relative">{children}</main>
        </div>
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} role="company" />
        <AIAssistant />
      </div>
    </ProtectedRoute>
  );
}
