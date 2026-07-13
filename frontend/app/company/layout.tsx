"use client";
import { useState } from "react";
import CompanySidebar from "@/components/layout/CompanySidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={["company_admin"]}>
      <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Left Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <CompanySidebar className="w-[260px] h-full" onItemClick={() => setSidebarOpen(false)} />
        </div>

        {/* Right Side Wrapping Column */}
        <div className="flex flex-col flex-1 overflow-hidden relative pb-16 lg:pb-0">
          
          <DashboardHeader onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto w-full p-6 lg:p-8 bg-gray-50 custom-scrollbar">
            <div className="max-w-6xl mx-auto w-full">
               {children}
            </div>
          </main>

        </div>
        
        <MobileBottomNav role="company" />
      </div>
    </ProtectedRoute>
  );
}
