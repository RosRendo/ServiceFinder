# ServiceFinder Design Constitution: The 10 Principles of UI/UX Craft

**Date**: 2026-10-04  
**Applies to**: `frontend` (Next.js 16 Web) & `frontend-expo` (React Native Mobile)  
**Philosophy**: Moving from "Card Soup / Database Viewer" to an "A-Tier Consumer & B2B Product"

---

## 1. Visual Hierarchy & The "Anti-Card-Soup" Rule
* **The Anti-Pattern**: A screen composed of 10 identical bordered cards (`Title`, `Description`, `Button`), giving the user cognitive fatigue and zero sense of priority.
* **The Standard**: Every screen must have a clear visual hierarchy:
  1. **Primary Focal Point (Hero / Primary Action)**: What the user should do or see in the first 2 seconds (e.g., "Need help now? 📍 Phnom Penh", Instant Service Request).
  2. **Secondary Exploration**: Quick pills, categories, or trending services with varying visual weights.
  3. **Tertiary Context**: Recent activity, history, or metadata rendered with subdued contrast and smaller scale.
* **Rule**: Never stack more than 2 visually identical card blocks without breaking the rhythm with maps, horizontal carousels, bold typography, or stats.

---

## 2. Composition, Whitespace & Rhythm
* **The Philosophy**: "A beautiful interface isn't more stuff. It's less stuff with intentional positioning."
* **Rules**:
  - Consistent 8pt spatial grid: `4px` (hairline spacing), `8px` (tight), `16px` (standard padding), `24px` (section gaps), `32px`–`48px` (major section breathing room).
  - Use whitespace as a divider instead of heavy border lines.
  - Asymmetric balance: pair strong headlines with lightweight action pills or compact preview thumbnails.

---

## 3. Strict Typography Scale
Never pick arbitrary font sizes per component. Adhere strictly to the established type scale:

| Level | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | `32px` – `36px` | Bold (`700`) | `1.2` | Hero statements, landing splash, urgency banner |
| **Section Heading (H1)** | `24px` | SemiBold (`600`) | `1.3` | Page titles, major section headers |
| **Card / Item Title (H2)**| `18px` | SemiBold (`600`) | `1.35` | Provider name, service title, modal title |
| **Body (P)** | `16px` | Regular (`400`) | `1.5` | Descriptions, review bodies, inputs |
| **Secondary / Subtitle** | `14px` | Medium (`500`) | `1.4` | Helper text, secondary pills, table cells |
| **Caption / Metadata** | `12px` | Medium (`500`) | `1.3` | Timestamps, tags, status badges, disclaimers |

* **Khmer Typography Rule**: When rendering Khmer text (`Kantumruy Pro`), enforce `line-height: 1.5–1.6` to prevent subscript vowel clipping.

---

## 4. Semantic Color System & Design Tokens
Eliminate raw arbitrary color utilities (e.g. `bg-blue-500`, `text-gray-400`). Everything maps to semantic design tokens:
* **Canvas**: `bg-background` (Page baseline), `bg-card` / `bg-surface` (Containers), `bg-surface-elevated` (Dropdowns, modals, floating pills).
* **Typography**: `text-foreground` (High contrast), `text-muted-foreground` (Secondary), `text-subtle` (Hints/placeholders).
* **Brand / Accents**: `brand-primary` (Electric Indigo / Royal Blue), `brand-hover`, `brand-light` (Tints for active pills).
* **Feedback**: `success` (Emerald), `warning` (Amber), `error` (Crimson), `info` (Sky).

---

## 5. Visual Storytelling & Emotional Empty States
* **The Rule**: An empty screen must never look like an empty database query (`"No data available"`).
* **Structure**:
  1. High-fidelity custom SVG or animated Lottie illustration.
  2. Narrative headline: *"Your calendar is wide open"*.
  3. Actionable reassurance: *"When you book a plumber, cleaner, or technician, your upcoming jobs will appear here."*
  4. Instant action button: `[ Explore Trusted Services ]`.

---

## 6. Purposeful Motion Design & Tactile Physics
* **Mobile Press Feedback**: Every interactive button and card must have tactile spring compression (`scale: 0.97` on press with `react-native-reanimated`).
* **State Progression**: `Tap` → `Button compresses` → `Micro-spinner / Progress pulse` → `Haptic success tick` → `Fluid route transition`.
* **Drawers & Sheets**: Velocity-sensitive gesture dragging with background blur (`backdrop-blur-sm`).

---

## 7. Context-Aware UX Patterns (The Urgent Service Flow)
* **The Anti-Pattern**: Forcing an emergency repair through a 7-step wizard (Category → Subcategory → Company → Staff → Calendar → Address → Checkout).
* **The Standard**: **One-Tap Urgency Flow**:
  1. *"NEED HELP NOW?"* (Auto-detects GPS location).
  2. 4 major distress chips: `[ 🔧 Plumbing ] [ ❄️ AC Leak ] [ ⚡ Electrical ] [ 🧹 Emergency Clean ]`.
  3. Live Radar animation: *"Broadcasting to 4 certified technicians within 3km..."*.
  4. Instant dispatch lock with ETA and live tracking map.

---

## 8. Purpose-Driven Component Architecture
Every component must earn its place in the hierarchy:
* **Tokens** → Colors, Typography, Spacing, Radii, Shadows.
* **Core Components** → `Button`, `Input`, `StatusPill`, `Avatar`, `BaseDrawer`, `ConfirmationDialog`.
* **Composed Patterns** → `UrgentRequestHero`, `ProviderCard`, `ServiceItemRow`, `DispatchTracker`.
* **Screens & Flows** → Cohesive experiences that avoid duplicating layout logic.

---

## 9. Rich Media & Asset Hierarchy
Use media deliberately depending on user context:
* **Real Photography**: Actual photos of verified staff, before/after job portfolios, and company badges to build trust.
* **Lottie Animations**: Empty states, success ticks, loading states, and live broadcast radars.
* **SVG Line Icons**: Clean visual affordances with Lucide icons (Web) and Vector Icons (Mobile).
* **Never use generic stock placeholders**: Missing assets use tailored branded geometric monograms or curated vector illustrations.

---

## 10. ServiceFinder's Visual Language Archetype
ServiceFinder is positioned at the intersection of:
* **Airbnb's Editorial Warmth**: High-trust photography, generous whitespace, large readable headings, and serene exploration.
* **Uber's Operational Speed**: Instant map dispatching, live real-time status pulses, and zero-friction urgency.
* **Apple's Quiet Luxury**: Restrained monochromatic surfaces, hairline borders (`border-border/60`), subtle glassmorphism, and smooth spring physics.

---

## 11. Shell Architecture: Strict Separation of Identity & Context
* **Sidebar Footer = Identity & Session**: User Avatar, Full Name, Email, Workspace Switcher, Account Settings, and Sign Out belong strictly in the sidebar footer.
* **Top Header Bar = Context & Global Utilities**: Reserved exclusively for Breadcrumbs (*where am I*), Global Search / `⌘K`, Notifications, and Theme Switcher.
* **Anti-Pattern Eliminated**: Never place a duplicate user avatar / profile dropdown in the top header when a full identity card already anchors the sidebar footer. Eliminates duplicate controls, visual clutter, and mental model ambiguity.
