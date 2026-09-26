import { Platform } from 'react-native';

// Centralized Premium Design Tokens
export const Theme = {
  colors: {
    // ── Backgrounds ──────────────────────────────────────────────
    bg: "#F8FAFC",          // Slate 50 — clean premium background
    surface: "#FFFFFF",     // Pure white card/surface
    border: "#E2E8F0",      // Slate 200 — subtle dividers

    // ── Brand / Primary ───────────────────────────────────────────
    primary: "#0A192F",     // Deep Navy (header, sidebar)
    primaryLight: "#F7F7F7",
    primaryMid: "#1E3A8A",  // Navy mid-tone

    // ── Accent (interactive elements, buttons, links) ─────────────
    accent: "#0A192F",      // Deep Navy — primary CTA button
    accentMid: "#1E3A8A",   // Used for icon tints, links
    accentLight: "#DBEAFE", // Pale blue — chart bars, light tints
    blue: "#2563EB",        // Blue 600 — tag fills, doc icons
    purple: "#7C3AED",      // Bookings metric color
    gray: "#64748B",        // Staff/neutral badge color

    // ── Text ──────────────────────────────────────────────────────
    text1: "#0F172A",       // Slate 900 — headings & primary text
    text2: "#475569",       // Slate 600 — body & secondary text
    text3: "#94A3B8",       // Slate 400 — hints, placeholders

    // Legacy aliases so old imports still compile
    text: "#0F172A",
    textMuted: "#475569",
    textSubtle: "#94A3B8",

    // ── Semantic ──────────────────────────────────────────────────
    success: "#10B981",     // Emerald green
    successBg: "#ECFDF5",
    error: "#EF4444",       // Red alert
    errorBg: "#FEF2F2",
    warning: "#F59E0B",     // Amber warning
    warningBg: "#FFFBEB",
    info: "#2563EB",

    // ── Missing Tokens (TS fixes) ───────────────────────────────────
    gold: "#F59E0B",
    successLight: "#D1FAE5",
    successText: "#065F46",
    inputBg: "#F1F5F9",
    inputBgDisabled: "#E2E8F0",
    
    // Semantic aliases
    greenBg: "#D1FAE5",
    greenDot: "#10B981",
    greenText: "#065F46",
    
    grayBg: "#F1F5F9",
    grayDot: "#94A3B8",
    grayText: "#475569",
    
    blueBg: "#DBEAFE",
    blueBorder: "#BFDBFE",
    blueDot: "#3B82F6",
    blueText: "#1E3A8A",

    // More Missing Tokens
    inprogress: "#3B82F6",
    inprogressBg: "#DBEAFE",
    completed: "#10B981",
    completedBg: "#D1FAE5",
    cancelled: "#EF4444",
    cancelledBg: "#FEF2F2",
    confirmed: "#10B981",
    confirmedBg: "#D1FAE5",
    errorBorder: "#FCA5A5",
    tag: "#F1F5F9",
    bubbleMe: "#0A192F",
    bubbleThem: "#F1F5F9",
    bubbleMeText: "#FFFFFF",
    bubbleThemText: "#0F172A",

    // ── Management Anti-AI-Slop Tokens ─────────────────────────────
    mgmtBg: "#F8FAFC",
    mgmtSurface: "#FFFFFF",
    mgmtSurfaceSubtle: "#F1F5F9",
    mgmtBorder: "#E2E8F0",
    mgmtCard: "#FFFFFF",
    mgmtCardBorder: "#E2E8F0",
    mgmtRowHover: "#F8FAFC",
    mgmtTextPrimary: "#0F172A",
    mgmtTextSecondary: "#475569",
    mgmtTextTertiary: "#94A3B8",
    mgmtPillSuccessBg: "#ECFDF5",
    mgmtPillSuccessText: "#047857",
    mgmtPillSuccessBorder: "#A7F3D0",
    mgmtPillWarningBg: "#FFFBEB",
    mgmtPillWarningText: "#B45309",
    mgmtPillWarningBorder: "#FDE68A",
    mgmtPillCriticalBg: "#FEF2F2",
    mgmtPillCriticalText: "#B91C1C",
    mgmtPillCriticalBorder: "#FECACA",
    mgmtPillInfoBg: "#F0F9FF",
    mgmtPillInfoText: "#0369A1",
    mgmtPillInfoBorder: "#BAE6FD",
    mgmtPillNeutralBg: "#F8FAFC",
    mgmtPillNeutralText: "#475569",
    mgmtPillNeutralBorder: "#E2E8F0",
  }
};

export const Colors = {
  light: {
    text: Theme.colors.text1,
    background: Theme.colors.bg,
    tint: Theme.colors.primary,
    icon: Theme.colors.text2,
    tabIconDefault: Theme.colors.text3,
    tabIconSelected: Theme.colors.primary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export const Fonts = {
  regular: 'KantumruyPro-Regular',
  medium: 'KantumruyPro-Medium',
  semiBold: 'KantumruyPro-SemiBold',
  bold: 'KantumruyPro-Bold',
  sans: 'KantumruyPro-Regular',
  heading: 'KantumruyPro-Bold',
  khmer: 'KantumruyPro-Regular',
  khmerBold: 'KantumruyPro-Bold',
  mono: Platform.select({ ios: 'Courier', default: 'monospace' }),
};
