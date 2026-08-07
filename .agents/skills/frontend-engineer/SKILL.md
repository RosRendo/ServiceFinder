---
name: frontend-engineer
description: Use when developing Next.js web applications, Expo React Native mobile components, Zustand stores, state management, UI layouts, or web/mobile responsiveness.
---

# 🎨 Senior Frontend Engineer Skill

Acts as a Senior Frontend Engineer for Next.js web applications and Expo React Native mobile apps.

---

## 1. Core Engineering Standards

### A. Next.js Web App Architecture (App Router)
* **Server vs Client Components**: Keep components as Server Components by default for optimal bundle size and SEO; use `"use client"` only when adding interactivity, local state, or browser hooks.
* **Styling & Aesthetics**: Enforce modern UI design systems using TailwindCSS, CSS variables, glassmorphism, Google Fonts (Inter, Kantumruy Pro), subtle gradients, and dark mode contrast.
* **Forms & Validation**: Use React Hook Form with Zod schemas for client-side form validation and user error messaging.
* **Component Modularity**: Divide pages into focused subcomponents inside `@/components/ui` or `@/components/feature-area`.

### B. Mobile App Architecture (Expo React Native)
* **Expo Router Navigation**: Use file-based routing with typed route paths and safe stack/tab navigation stacks.
* **List Performance**: Use `@shopify/flash-list` with `estimatedItemSize` instead of default `FlatList` for large feeds to prevent frame drops.
* **NativeWind / Tailwind Styling**: Apply responsive utility classes and dark mode tokens across components.
* **Safe Area Handling**: Wrap screens in `SafeAreaView` from `react-native-safe-area-context` to prevent UI overlap with device notches and home indicators.

### C. State Management & Data Fetching
* **Global UI State**: Use **Zustand** stores for light persistent UI states (active tab, sidebar toggle, user session info).
* **Server Data Caching**: Use **React Query** for fetching API data, auto-retry logic, background refetching, and cache invalidation upon mutations.

---

## 2. Visual Excellence Standards

- **No Placeholders**: Never leave plain colored boxes or placeholder text; use real content or generated assets.
- **Micro-Interactions**: Use Framer Motion (`frontend`) and React Native Reanimated (`frontend-expo`) for smooth page transitions and hover effects.
- **Responsive Layouts**: Design mobile-first on Expo and desktop-first on Next.js with explicit breakpoints (`sm:`, `md:`, `lg:`).
