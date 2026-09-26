import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Daikin Air Conditioning Authentic Delta Logo
 */
export function DaikinLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Daikin Delta Triangle */}
      <polygon points="4,32 36,4 20,32" fill="#0097E0" />
      <polygon points="20,32 36,4 36,32" fill="#0077B6" />
      {/* DAIKIN text */}
      <text
        x="44"
        y="28"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="24"
        letterSpacing="1.5"
        fill="currentColor"
      >
        DAIKIN
      </text>
    </svg>
  );
}

/**
 * Panasonic Official Brand Logo
 */
export function PanasonicLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <text
        x="2"
        y="26"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="25"
        letterSpacing="1.2"
        fill="currentColor"
      >
        Panasonic
      </text>
    </svg>
  );
}

/**
 * Schneider Electric Logo
 */
export function SchneiderElectricLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="6" width="28" height="28" rx="6" fill="#3DCD58" />
      <path
        d="M10 20C10 15.58 13.58 12 18 12C20.5 12 22.7 13.1 24.2 15"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="18" cy="20" r="3" fill="white" />
      <text
        x="38"
        y="22"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="15"
        letterSpacing="0.2"
        fill="currentColor"
      >
        Schneider
      </text>
      <text
        x="38"
        y="33"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="500"
        fontSize="10"
        letterSpacing="1.5"
        fill="#3DCD58"
      >
        ELECTRIC
      </text>
    </svg>
  );
}

/**
 * Bosch Professional Armature Logo
 */
export function BoschLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="18" cy="18" r="14" stroke="#EA0016" strokeWidth="4" />
      <line x1="10" y1="13" x2="26" y2="13" stroke="#EA0016" strokeWidth="3.5" />
      <line x1="10" y1="23" x2="26" y2="23" stroke="#EA0016" strokeWidth="3.5" />
      <text
        x="40"
        y="27"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="24"
        letterSpacing="2"
        fill="currentColor"
      >
        BOSCH
      </text>
    </svg>
  );
}

/**
 * Visa & Mastercard Dual Payment Badge
 */
export function VisaMastercardLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Visa */}
      <text
        x="4"
        y="24"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="20"
        fill="#1A1F71"
      >
        VISA
      </text>
      <line x1="62" y1="6" x2="62" y2="26" stroke="#CBD5E1" strokeWidth="1.5" />
      {/* Mastercard Circles */}
      <circle cx="82" cy="16" r="11" fill="#EB001B" fillOpacity="0.9" />
      <circle cx="98" cy="16" r="11" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  );
}

/**
 * Borey Peng Huoth Group Architectural Brand Mark
 */
export function BoreyPengHuothLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 210 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Diamond / Crown Crest */}
      <path
        d="M18 4L32 16L18 34L4 16L18 4Z"
        fill="#0F172A"
        stroke="#D97706"
        strokeWidth="2"
      />
      <path d="M18 10L26 18L18 28L10 18L18 10Z" fill="#D97706" />
      <text
        x="40"
        y="21"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="15"
        letterSpacing="1.2"
        fill="currentColor"
      >
        PENG HUOTH
      </text>
      <text
        x="40"
        y="32"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
        fontSize="9"
        letterSpacing="2.5"
        fill="#D97706"
      >
        GROUP • BOREY
      </text>
    </svg>
  );
}

/**
 * Urban Village Phnom Penh Brand Mark
 */
export function UrbanVillageLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 190 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="4" y="6" width="9" height="26" rx="2" fill="#0D9488" />
      <rect x="16" y="12" width="9" height="20" rx="2" fill="#14B8A6" />
      <rect x="28" y="4" width="9" height="28" rx="2" fill="#042F2E" />
      <text
        x="45"
        y="21"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="14"
        letterSpacing="0.8"
        fill="currentColor"
      >
        URBAN VILLAGE
      </text>
      <text
        x="45"
        y="32"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="500"
        fontSize="9"
        letterSpacing="1.8"
        fill="#0D9488"
      >
        PHNOM PENH
      </text>
    </svg>
  );
}

/**
 * Sathapana Bank Mark
 */
export function SathapanaLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="18" r="14" fill="#0284C7" />
      <circle cx="16" cy="18" r="8" fill="#F97316" />
      <circle cx="16" cy="18" r="4" fill="white" />
      <text
        x="38"
        y="25"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="16"
        letterSpacing="1"
        fill="currentColor"
      >
        SATHAPANA
      </text>
    </svg>
  );
}

/**
 * Cam-Paint Manufacturing Mark
 */
export function CamPaintLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="18" r="12" fill="#DC2626" />
      <path d="M12 18C12 14 16 10 16 10C16 10 20 14 20 18C20 20.2 18.2 22 16 22C13.8 22 12 20.2 12 18Z" fill="white" />
      <text
        x="36"
        y="24"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="16"
        letterSpacing="1"
        fill="currentColor"
      >
        CAM-PAINT
      </text>
    </svg>
  );
}
