"use client";
import { Menu } from "lucide-react";
import SharedHeader from "./SharedHeader";

export default function AdminHeader({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle?: () => void;
}) {
  return (
    <SharedHeader
      homeHref="/admin/dashboard"
      portalLabel="Admin"
      portalColor="violet"
      bgAccentClass="bg-violet-500"
      profileHref="/admin/settings"
      messagesHref="/admin/messages"
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
