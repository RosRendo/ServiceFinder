"use client";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import SharedHeader from "./SharedHeader";

interface StaffHeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function StaffHeader({ onMobileMenuToggle }: StaffHeaderProps) {
  return (
    <SharedHeader
      homeHref="/staff/dashboard"
      portalLabel="Staff"
      portalColor="emerald"
      bgAccentClass="bg-emerald-500"
      profileHref="/staff/profile"
      messagesHref="/staff/messages"
      mobileMenuButton={
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="h-10 w-10 rounded-xl md:hidden"
        >
          <Menu size={20} />
        </Button>
      }
    />
  );
}
