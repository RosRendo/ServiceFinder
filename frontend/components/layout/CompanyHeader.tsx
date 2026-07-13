"use client";
import { Menu } from "lucide-react";
import SharedHeader from "./SharedHeader";

export default function CompanyHeader({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle?: () => void;
}) {
  return (
    <SharedHeader
      homeHref="/company/dashboard"
      portalLabel="Company Admin"
      portalColor="blue"
      bgAccentClass="bg-blue-500"
      profileHref="/company/settings"
      messagesHref="/company/messages"
      mobileMenuButton={
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      }
    />
  );
}
