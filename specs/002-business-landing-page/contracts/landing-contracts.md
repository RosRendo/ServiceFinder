# Phase 1 Interface & Component Contracts: ServiceFinder Landing Page

**Feature**: ServiceFinder Business Promotion & Platform Showcase Landing Page  
**Branch**: `002-business-landing-page`  
**Date**: 2026-09-25  
**Status**: Completed  

---

## 1. Component Interfaces & Props

### 1.1 `LandingHeaderProps`
```typescript
export interface LandingHeaderProps {
  lang: 'kh' | 'en';
  onLanguageChange: (newLang: 'kh' | 'en') => void;
  onOpenAppDownload: () => void;
}
```

### 1.2 `HeroSectionProps`
```typescript
export interface HeroSectionProps {
  lang: 'kh' | 'en';
  onOpenAppDownload: () => void;
}
```

### 1.3 `PartnerRoiCalculatorProps`
```typescript
export interface PartnerRoiCalculatorProps {
  lang: 'kh' | 'en';
  initialTeamSize?: number;
  onPartnerCtaClick?: (params: { teamSize: number; projectedRevenue: number }) => void;
}

export interface RoiCalculationResult {
  monthlyJobCapacity: number;
  monthlyGrossRevenue: number;
  estimatedNetGrowth: number;
  annualRevenueUplift: number;
  timeSavedHoursPerMonth: number;
}
```

### 1.4 `CategoryExplorerProps`
```typescript
export interface CategoryPreviewItem {
  id: string;
  slug: string;
  nameEn: string;
  nameKh: string;
  descriptionEn: string;
  descriptionKh: string;
  startingPriceUsd: number;
  providerCount: number;
  iconName: 'Wind' | 'Zap' | 'Droplet' | 'Sparkles' | 'Wrench' | 'ShieldAlert' | 'Hammer';
  isPopular?: boolean;
}

export interface CategoryExplorerProps {
  lang: 'kh' | 'en';
  categories?: CategoryPreviewItem[];
  onSelectCategory?: (slug: string) => void;
}
```

### 1.5 `EcosystemTourProps`
```typescript
export type EcosystemPersonaId = 'customer' | 'company' | 'staff';

export interface EcosystemTourProps {
  lang: 'kh' | 'en';
}

export interface EcosystemPersonaDetail {
  id: EcosystemPersonaId;
  tabLabelEn: string;
  tabLabelKh: string;
  titleEn: string;
  titleKh: string;
  subtitleEn: string;
  subtitleKh: string;
  featuresEn: string[];
  featuresKh: string[];
  deviceType: 'mobile' | 'desktop';
  screenTitleEn: string;
  screenTitleKh: string;
}
```

### 1.6 `PaymentCredibilityProps`
```typescript
export interface PaymentMethodBadge {
  id: string;
  name: string;
  taglineEn: string;
  taglineKh: string;
  type: 'instant_qr' | 'mobile_bank' | 'wallet' | 'card';
  iconSvgName: string;
}

export interface PaymentCredibilityProps {
  lang: 'kh' | 'en';
}
```

### 1.7 `TrustSecurityGuaranteeProps`
```typescript
export interface TrustPillarItem {
  id: string;
  titleEn: string;
  titleKh: string;
  descEn: string;
  descKh: string;
  badgeEn: string;
  badgeKh: string;
  icon: string;
}

export interface TrustSecurityGuaranteeProps {
  lang: 'kh' | 'en';
}
```

### 1.8 `ComparisonTableProps`
```typescript
export interface ComparisonRow {
  dimensionEn: string;
  dimensionKh: string;
  serviceFinderEn: string;
  serviceFinderKh: string;
  traditionalEn: string;
  traditionalKh: string;
  isPositiveWinner: boolean;
}

export interface ComparisonTableProps {
  lang: 'kh' | 'en';
}
```

### 1.9 `FaqSectionProps`
```typescript
export interface FaqItemContract {
  id: string;
  category: 'partner' | 'customer';
  questionEn: string;
  questionKh: string;
  answerEn: string;
  answerKh: string;
}

export interface FaqSectionProps {
  lang: 'kh' | 'en';
}
```

---

## 2. Navigation & Routing Contracts

### 2.1 Partner Onboarding Navigation Contract
When the user clicks "Partner With Us" or "Register Your Business":
```text
Destination URL: /auth/register
Query Parameters:
  - role: 'company_admin' (Required)
  - ref: 'landing_calculator' (Optional)
  - teamSize: number (Optional, e.g. '5')
  - intent: 'business_partner' (Optional)

Example:
  /auth/register?role=company_admin&ref=landing_calculator&teamSize=8
```

### 2.2 Consumer Service Discovery Navigation Contract
When a homeowner selects a category card or enters a search query:
```text
Destination URL: /services
Query Parameters:
  - category: string (Optional, category slug e.g. 'air-conditioning')
  - q: string (Optional, keyword query e.g. 'cleaning')

Example:
  /services?category=air-conditioning
```

---

## 3. Bilingual Dictionary Schema (`landing-dictionary.ts`)

```typescript
export interface LandingDictionary {
  nav: {
    forBusinesses: string;
    forCustomers: string;
    howItWorks: string;
    calculator: string;
    pricing: string;
    faqs: string;
    login: string;
    partnerRegister: string;
    downloadApp: string;
  };
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    ctaPartner: string;
    ctaBookService: string;
    statVerifiedCompanies: string;
    statJobsCompleted: string;
    statAverageRating: string;
    trustLocalBanking: string;
  };
  calculator: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    teamSizeLabel: string;
    techniciansCount: string;
    monthlyJobCapacity: string;
    monthlyRevenueEstimate: string;
    netGrowthEstimate: string;
    annualUpliftLabel: string;
    ctaButton: string;
    disclaimer: string;
  };
  categories: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    viewAllCta: string;
    startingFrom: string;
    verifiedPros: string;
  };
  ecosystem: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    customerTab: string;
    companyTab: string;
    staffTab: string;
  };
  payments: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    bakongBadge: string;
    instantPayoutsTitle: string;
    instantPayoutsDesc: string;
  };
  trust: {
    sectionBadge: string;
    title: string;
    subtitle: string;
  };
  comparison: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    colFeature: string;
    colServiceFinder: string;
    colTraditional: string;
  };
  socialProof: {
    sectionBadge: string;
    title: string;
    subtitle: string;
  };
  faq: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    filterAll: string;
    filterPartner: string;
    filterCustomer: string;
  };
  footer: {
    brandTagline: string;
    companyCol: string;
    platformCol: string;
    legalCol: string;
    rightsReserved: string;
    bakongSupported: string;
  };
}
```
