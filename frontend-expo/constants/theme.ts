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

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
