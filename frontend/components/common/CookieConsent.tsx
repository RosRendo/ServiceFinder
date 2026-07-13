"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";
import Link from "next/link";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted/declined cookies
    const cookieConsent = localStorage.getItem("cookie-consent");
    if (!cookieConsent) {
      // Small delay to not overwhelm the user immediately on load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-fade-in pointer-events-none flex justify-center">
      <div className="bg-background border border-border shadow-2xl rounded-2xl p-6 max-w-4xl w-full pointer-events-auto flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="flex-shrink-0 bg-primary/10 p-3 rounded-xl hidden sm:block">
          <Cookie className="w-8 h-8 text-primary" />
        </div>
        
        <div className="flex-1 space-y-2 pr-8 md:pr-0">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="sm:hidden text-primary"><Cookie className="w-5 h-5" /></span>
            We value your privacy
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
            <Link href="/cookies" className="text-primary hover:underline font-medium ml-1">
              Read our Cookie Policy
            </Link>.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
          <Button variant="outline" onClick={handleDecline} className="w-full sm:w-auto whitespace-nowrap">
            Decline Non-Essential
          </Button>
          <Button onClick={handleAccept} className="w-full sm:w-auto whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90">
            Accept All Cookies
          </Button>
        </div>
        
        {/* Close Button */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-secondary"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
