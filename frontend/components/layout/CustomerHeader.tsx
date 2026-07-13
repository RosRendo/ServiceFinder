"use client";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import SharedHeader from "./SharedHeader";

interface CustomerHeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function CustomerHeader({
  onMobileMenuToggle,
}: CustomerHeaderProps) {
  return (
    <SharedHeader
      homeHref="/customer/dashboard"
      portalLabel="Customer"
      portalColor="sky"
      bgAccentClass="bg-sky-500"
      profileHref="/customer/profile"
      messagesHref="/customer/messages"
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
