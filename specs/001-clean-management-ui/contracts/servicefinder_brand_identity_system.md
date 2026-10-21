# ServiceFinder Brand Identity & Logo System

## 1. Executive Summary
* **Brand Name**: ServiceFinder
* **Mark**: Dynamic Ribbon Map-Marker with Solar Core Beacon & Discovery Sparks
* **Typography**: Stacked Two-Tone Geometric Tech Lockup (`SERVICE` in Slate-900 / `FINDER` in Electric Cyan Gradient)
* **Aspect Ratio**: ~2.5:1 (eliminates the 5:1 horizontal stretch of 13 inline characters)

---

## 2. Brand Color Palette

| Token Name | Hex Code | Role |
| :--- | :--- | :--- |
| **Sapphire Cobalt** | `#1D4ED8` -> `#2563EB` | Primary brand ribbon body, establishing enterprise security and trust |
| **Electric Cyan** | `#06B6D4` -> `#0EA5E9` | Dynamic fluid ribbon contour & `FINDER` highlight, signaling real-time speed |
| **Solar Beacon Core** | `#FB923C` -> `#EA580C` | Central destination beacon & app star, representing human service delivery |
| **Discovery Spark** | `#38BDF8` | Radiating energy rays indicating nearby provider discovery |
| **Deep Charcoal Slate** | `#0F172A` | Primary text (`SERVICE`), ensuring high WCAG contrast in light mode |
| **Luminous Slate** | `#F8FAFC` | Primary text (`SERVICE`) in dark mode surfaces |

---

## 3. Structural Mechanics & UI Versatility

### The 13-Character Horizontal Problem:
Spelling `ServiceFinder` across a single horizontal row requires 13 characters, occupying ~180px–220px in web headers. On mobile devices (375px viewport), this crowds out search bars, language switchers, and notification badges.

### The Stacked Vector Solution:
1. **Vertical Hierarchy**: `SERVICE` on line 1 (tracked uppercase, 0.14em letter-spacing) stacked over `FINDER` on line 2 (bold stylized lettering with angled cuts).
2. **Horizontal Footprint Reduction**: Reduces horizontal space by ~50% while increasing vertical stature.
3. **Decoupled Mark (`BrandMark`)**: The standalone map-pin ribbon with solar beacon scales down to 16px (favicon) and up to 1024px (App Store squircle) without requiring text.

---

## 4. Production Touchpoints Integrated
* [BrandLogo.tsx](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend/components/brand/BrandLogo.tsx): Reusable React component with `full`, `mark`, and `horizontal` variants.
* [logo.svg](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend/public/logo.svg): Full vector lockup in `frontend/public`.
* [logo-mark.svg](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend/public/logo-mark.svg): Standalone map-pin emblem.
* [favicon.svg](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend/public/favicon.svg): 32x32 crisp browser favicon.
* [LandingHeader.tsx](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend/components/landing/LandingHeader.tsx) & [LandingFooter.tsx](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend/components/landing/LandingFooter.tsx): Integrated live brand logo.
* [AppSidebar.tsx](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend/components/shell/AppSidebar.tsx): Admin workspace switcher branded with `<BrandMark />`.
* [login/page.tsx](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend/app/auth/login/page.tsx) & [register/page.tsx](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend/app/auth/register/page.tsx): Authentication headers branded with `<BrandLogo />`.
