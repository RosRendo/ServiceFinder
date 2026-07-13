import { Platform } from 'react-native';

// Centralized Premium Design Tokens
export const Theme = {
  colors: {
    bg: "#F8FAFC",          // Slate 50 - clean premium background
    surface: "#FFFFFF",     // Pure white surfaces
    border: "#EBEBEB",      // Light grey dividers & card outlines
    
    primary: "#0A192F",     // Deep Navy
    primaryLight: "#F7F7F7",
    primaryMid: "#1E3A8A",
    accent: "#3B82F6",      // Blue selection highlight
    
    text: "#0F172A",        // Dark slate for text
    textMuted: "#64748B",   // Neutral slate for subtitle & hints
    textSubtle: "#9CA3AF",  // Lighter hint text / metadata
    
    success: "#10B981",     // Standard emerald green
    successBg: "#ECFDF5",
    error: "#EF4444",       // Standard red alert
    errorBg: "#FEF2F2",
    warning: "#F59E0B",     // Amber yellow warning
    warningBg: "#FFFBEB",
    info: "#3B82F6",
  }
};

export const Colors = {
  light: {
    text: Theme.colors.text,
    background: Theme.colors.bg,
    tint: Theme.colors.primary,
    icon: Theme.colors.textMuted,
    tabIconDefault: Theme.colors.textMuted,
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
