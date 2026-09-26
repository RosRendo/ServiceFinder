# Phase 1 Data Model: ServiceFinder Business Promotion & Platform Showcase Landing Page

**Feature**: ServiceFinder Business Promotion & Platform Showcase Landing Page  
**Branch**: `002-business-landing-page`  
**Date**: 2026-09-25  
**Status**: Completed  

---

## 1. Entities & Schemas

### 1.1 `PartnerRoiParameters`
Represents the interactive state configured by a prospective service company owner using the Growth & ROI Calculator.

| Field | Type | Required | Default | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `teamSize` | `number` | Yes | `5` | Min: `1`, Max: `50`, Step: `1` | Total field technicians employed by the service company. |
| `averageTicketUsd` | `number` | Yes | `45.0` | Min: `15.0`, Max: `250.0` | Average invoice value per job in USD. |
| `jobsPerDayPerTech`| `number` | Yes | `3.5` | Min: `1.0`, Max: `8.0`, Step: `0.5` | Average service bookings completed per tech per workday. |
| `workDaysPerMonth` | `number` | Yes | `26` | Min: `20`, Max: `30`, Step: `1` | Operational working days per calendar month. |
| `tradeCategory` | `string` | No | `"all"` | Allowed: `"ac"`, `"electrical"`, `"plumbing"`, `"cleaning"`, `"handyman"`, `"all"` | Industry trade segment selected for domain-specific defaults. |

---

### 1.2 `PartnerRoiProjection`
Represents the calculated outputs dynamically recomputed on parameter change.

| Field | Type | Formula / Derivation | Description |
| :--- | :--- | :--- | :--- |
| `monthlyJobCapacity` | `number` | `Math.round(teamSize * jobsPerDayPerTech * workDaysPerMonth)` | Estimated total bookings the company can execute per month. |
| `monthlyGrossRevenue` | `number` | `Math.round(monthlyJobCapacity * averageTicketUsd)` | Total gross billing volume in USD. |
| `estimatedNetGrowth` | `number` | `Math.round(monthlyGrossRevenue * 0.35)` | Estimated additional revenue unlocked through automated dispatching and platform demand. |
| `annualRevenueUplift`| `number` | `estimatedNetGrowth * 12` | Projected 1-year financial boost in USD. |
| `timeSavedHoursPerMonth` | `number` | `Math.round(teamSize * 18)` | Estimated administrative dispatcher hours saved via automated routing. |

---

### 1.3 `ProspectivePartnerLead`
Represents a prospective service business owner requesting a direct onboarding callback or submitting an inquiry.

| Field | Type | Required | Validation / Rules | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | UUID or timestamp string | Unique lead identifier. |
| `companyName` | `string` | Yes | Min: 2 chars, Max: 100 chars | Registered or operational business name. |
| `contactName` | `string` | Yes | Min: 2 chars, Max: 80 chars | Primary business owner or operations manager name. |
| `phone` | `string` | Yes | Cambodian format: `/^(0[1-9]\d{7,8}|\+855[1-9]\d{7,8})$/` | Contact mobile phone number. |
| `tradeCategory` | `string` | Yes | Valid category key | Primary service specialization. |
| `teamSize` | `number` | Yes | Integer, Min: 1, Max: 100 | Declared technician staff count. |
| `city` | `string` | Yes | Default: `"Phnom Penh"` | Operational city (Phnom Penh, Siem Reap, Sihanoukville, Battambang). |
| `status` | `string` | Yes | Enum: `"NEW" \| "CONTACTED" \| "CONVERTED" \| "CLOSED"` | Internal lifecycle tracking status. |
| `createdAt` | `string` | Yes | ISO 8601 string | Creation timestamp. |

---

### 1.4 `MarketplaceCategoryPreview`
Represents top service trade categories showcased for consumer discovery.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Category identifier (e.g., `"air-conditioning"`). |
| `slug` | `string` | URL-safe slug linking to `/services?category=${slug}`. |
| `nameEn` | `string` | English display label (e.g., `"Air Conditioning & HVAC"`). |
| `nameKh` | `string` | Khmer display label (e.g., `"សេវាកម្មម៉ាស៊ីនត្រជាក់"`). |
| `descriptionEn` | `string` | English short description of services included. |
| `descriptionKh` | `string` | Khmer short description of services included. |
| `startingPriceUsd` | `number` | Baseline verified starting price in USD (e.g., `15.00`). |
| `activeProvidersCount` | `number` | Count of verified local providers active in the area. |
| `iconName` | `string` | Lucide icon identifier (e.g., `"Wind"`, `"Zap"`, `"Droplet"`, `"Sparkles"`, `"Wrench"`). |
| `isPopular` | `boolean` | Flag highlighting high-demand categories. |

---

### 1.5 `PlatformTrustPillar`
Represents the verified trust guarantees displayed to eliminate consumer and business anxiety.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Guarantee identifier (e.g., `"verified-licenses"`). |
| `titleEn` | `string` | English guarantee headline (e.g., `"100% Verified Trade Licenses"`). |
| `titleKh` | `string` | Khmer guarantee headline (e.g., `"អាជ្ញាប័ណ្ណអាជីវកម្មស្របច្បាប់ ១០០%"`). |
| `descEn` | `string` | Detailed English guarantee description. |
| `descKh` | `string` | Detailed Khmer guarantee description. |
| `badgeLabelEn` | `string` | Metric pill label in English (e.g., `"Ministry Registered"`). |
| `badgeLabelKh` | `string` | Metric pill label in Khmer (e.g., `"ចុះបញ្ជីក្រសួងពាណិជ្ជកម្ម"`). |
| `iconName` | `string` | Lucide icon symbol name. |

---

### 1.6 `EcosystemPersona`
Models the three synchronized participants in the ServiceFinder operational triangle.

| Field | Type | Allowed Values / Structure | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | `"customer" \| "company" \| "staff"` | Unique persona identifier. |
| `tabLabelEn` | `string` | `"Homeowner App"`, `"Company OS"`, `"Technician App"` | Tab button text in English. |
| `tabLabelKh` | `string` | `"កម្មវិធីអតិថិជន"`, `"ផ្ទាំងគ្រប់គ្រងក្រុមហ៊ុន"`, `"កម្មវិធីបុគ្គលិកបច្ចេកទេស"` | Tab button text in Khmer. |
| `headlineEn` | `string` | English capability summary. |
| `headlineKh` | `string` | Khmer capability summary. |
| `featuresEn` | `string[]` | 4 key workflow bullets in English. |
| `featuresKh` | `string[]` | 4 key workflow bullets in Khmer. |
| `deviceType` | `string` | `"mobile" \| "desktop"` | Hardware frame rendered for device simulation. |
| `screenTitleEn`| `string` | Device frame screen header title in English. |
| `screenTitleKh`| `string` | Device frame screen header title in Khmer. |

---

### 1.7 `LanguageContextState`
Models the global landing page bilingual state.

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `lang` | `"kh" \| "en"` | `"kh"` | Active selected locale. Defaults to Khmer. |
| `fontSansClass` | `string` | `"font-sans"` | Tailwind typography class mapping to Inter/Suwannaphum. |
| `fontHeadingClass` | `string` | `"font-heading"` | Tailwind typography class mapping to Outfit/Suwannaphum. |

---

## 2. State Transitions & Lifecycle

### 2.1 Partner Growth Calculator State Transition
```
[User moves teamSize slider]
        │
        ▼
Update `PartnerRoiParameters.teamSize`
        │
        ▼
Trigger reactive computation function `computeRoiProjection(params)`
        │
        ▼
Update `PartnerRoiProjection` (capacity, gross revenue, net growth)
        │
        ▼
Animate counter numbers smoothly via Framer Motion / tabular numeric display
```

### 2.2 Language Switcher State Transition
```
[User clicks Language Toggle (KH / EN)]
        │
        ▼
Set React state `lang = newLang`
        │
        ▼
Write `localStorage.setItem('sf_landing_lang', newLang)`
        │
        ▼
Components re-render with localized strings from `landing-dictionary.ts`
(Zero page reload, zero layout shift)
```
