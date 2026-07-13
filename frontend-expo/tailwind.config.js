/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./store/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "primary": "#0A192F", // Deep Navy Brand Primary
        "on-primary": "#FFFFFF",
        "primary-container": "#F1F5F9",
        "on-primary-container": "#0F172A",
        
        "secondary": "#1E3A8A", // Deep Navy Mid/Secondary
        "on-secondary": "#FFFFFF",
        
        "accent": "#3B82F6", // Accent Blue
        
        "background": "#F8FAFC", // Off-white/slate premium background
        "on-background": "#0F172A",
        
        "surface": "#FFFFFF", // Card backgrounds
        "on-surface": "#0F172A",
        "surface-variant": "#F1F5F9",
        "on-surface-variant": "#64748B",
        
        "outline": "#EBEBEB", // Divider outlines
        "outline-variant": "#F1F5F9",
        
        "error": "#EF4444", // Emerald Green / Alert Red success/error align
        "on-error": "#FFFFFF",
        "error-container": "#FEF2F2",
        "on-error-container": "#991B1B",
        
        "success": "#10B981", 
        "warning": "#F59E0B",
        "info": "#3B82F6",
      },
      fontFamily: {
        headline: ["Manrope"],
        display: ["Manrope"],
        body: ["Inter"],
        label: ["Inter"]
      }
    },
  },
  plugins: [],
};
