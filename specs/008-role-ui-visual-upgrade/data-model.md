# Data Model & Visual Component Schema: Non-Customer Role UI Visual Upgrade

**Feature**: `specs/008-role-ui-visual-upgrade`  
**Date**: 2026-10-05  
**Domain**: Mobile UI Component Schemas, State Enums, Visual Tokens

---

## 1. Visual Design Tokens & Semantic Color Palette

To achieve high glanceability and remove reading fatigue for field staff, dispatchers, and administrators, the system defines standardized visual tokens:

| Token Name | Hex Code | Light Surface Contrast | Semantic Usage |
|:---|:---|:---|:---|
| `surface-primary` | `#FFFFFF` | N/A (base surface) | Primary card containers, modals |
| `surface-secondary` | `#F8FAFC` | `#0F172A` (16.2:1) | Input backgrounds, row hover/pressed states |
| `text-primary` | `#0F172A` | `#FFFFFF` (16.2:1) | Key metrics, bold titles (<= 2 words) |
| `text-secondary` | `#64748B` | `#FFFFFF` (4.6:1) | Sub-labels, micro metadata chips |
| `border-subtle` | `#E2E8F0` | `#FFFFFF` (1.3:1) | Divider lines, card outlines |
| `status-urgent` | `#EF4444` | `#FEF2F2` (bg) | SLA breach risk (< 5m), dispute escalation |
| `status-warning` | `#F59E0B` | `#FEF3C7` (bg) | Approaching SLA (5-15m), high cash collection |
| `status-active` | `#10B981` | `#ECFDF5` (bg) | Online technician, job in progress, SLA healthy |
| `status-neutral` | `#6B7280` | `#F3F4F6` (bg) | Offline pro, completed milestone, past history |
| `status-brand` | `#3B82F6` | `#EFF6FF` (bg) | Primary action pills, navigation shortcuts |

---

## 2. Component Data Entities

### 2.1 Visual Milestone Stepper (`JobMilestoneState`)

Replaces descriptive paragraphs in `app/(staff)/(tabs)/today.tsx` with a 4-stage chronological horizontal progress stepper.

```typescript
export type JobMilestoneKey = 'EN_ROUTE' | 'ARRIVED' | 'WORKING' | 'COMPLETED';

export interface MilestoneStepConfig {
  key: JobMilestoneKey;
  label: string;            // Max 10 chars (e.g., "En Route", "Arrived", "Working", "Done")
  iconName: string;         // MaterialCommunityIcons name: 'compass-outline' | 'map-marker-check' | 'wrench' | 'check-decagram'
  status: 'completed' | 'active' | 'upcoming';
  timestamp?: string;       // Formatted time (e.g., "14:15")
}

export interface VisualMilestoneStepperProps {
  currentStage: JobMilestoneKey;
  completedStages: JobMilestoneKey[];
  onStagePress?: (stage: JobMilestoneKey) => void;
  compact?: boolean;        // High-density mode for small screens
}
```

**State Transitions**:
- `EN_ROUTE` $\rightarrow$ `ARRIVED` (Technician taps "I Have Arrived" or geofence triggers)
- `ARRIVED` $\rightarrow$ `WORKING` (Technician taps "Start Service")
- `WORKING` $\rightarrow$ `COMPLETED` (Technician uploads photo / confirms settlement $\rightarrow$ "Finish Job")

---

### 2.2 Urgency Indicator Chip (`UrgencyTier`)

Used in `app/(company)/(tabs)/operations.tsx` and `app/(admin)/(tabs)/queue.tsx` to replace wordy time descriptions with high-glanceability countdown chips.

```typescript
export type UrgencyTier = 'HEALTHY' | 'APPROACHING' | 'CRITICAL';

export interface UrgencyIndicatorProps {
  deadlineMinutes: number;    // Calculated remaining minutes before SLA breach
  compact?: boolean;          // Single icon + number mode
  showPulse?: boolean;        // Pulsing animation for CRITICAL
}

export interface UrgencyVisualToken {
  tier: UrgencyTier;
  badgeBg: string;            // e.g. '#FEF2F2'
  textColor: string;          // e.g. '#DC2626'
  iconName: string;           // 'timer-alert' | 'timer-sand' | 'clock-check-outline'
  label: string;              // e.g. "<5m left", "12m left", "35m left"
  isPulsing: boolean;         // True only for CRITICAL (< 5 min)
}
```

**Validation & Derivation Rules**:
- `deadlineMinutes <= 5`: Tier = `CRITICAL` (Red background, pulsing red alert dot, text `<5m`).
- `5 < deadlineMinutes <= 15`: Tier = `APPROACHING` (Amber background, amber hourglass icon, text `Xm left`).
- `deadlineMinutes > 15`: Tier = `HEALTHY` (Slate/Green background, check icon, text `Xm left`).

---

### 2.3 Pro Radar Indicator (`ProRadarItem`)

Used in `app/(company)/(tabs)/staff.tsx` and staff assignment modals to eliminate verbose role/status descriptions.

```typescript
export type ProAvailabilityStatus = 'ONLINE' | 'ON_JOB' | 'OFFLINE';

export interface ProRadarItem {
  id: string;
  name: string;
  avatarUrl?: string;
  status: ProAvailabilityStatus;
  distanceKm: number;         // Distance from booking address
  currentWorkload: number;    // Active jobs in queue
  rating: number;             // 1.0 - 5.0
  phone: string;
  skills: string[];           // Displayed as compact mini-tags (max 2)
}

export interface ProStatusVisualToken {
  ringColor: string;          // '#10B981' (Online), '#F59E0B' (On Job), '#94A3B8' (Offline)
  badgeLabel: string;         // "Available", "On Job", "Offline"
  pulseDot: boolean;          // True if Online
}
```

---

### 2.4 Financial Cash Reconciliation Meter (`CashAuditLedger`)

Used in `app/(staff)/(tabs)/money.tsx` and `app/(company)/(tabs)/finance.tsx` to replace multi-line payout disclaimers with numerical meters.

```typescript
export interface CashCollectionLedger {
  staffId: string;
  staffName: string;
  unremittedCash: number;       // Physical currency collected from customers
  companyThreshold: number;     // Maximum cash limit before mandatory remittance
  utilizationPercent: number;   // (unremittedCash / companyThreshold) * 100
  status: 'SAFE' | 'WARNING' | 'BREACH';
  lastSettledAt?: string;
}

export interface CashMeterProps {
  currentCash: number;
  maxLimit: number;
  currencySymbol?: string;      // Defaults to "$"
  onSettlePress?: () => void;
}
```

**Derivation Rules**:
- `utilizationPercent < 75%`: Status = `SAFE` (Green progress bar, "Normal").
- `75% <= utilizationPercent < 100%`: Status = `WARNING` (Amber progress bar, "Approaching Limit").
- `utilizationPercent >= 100%`: Status = `BREACH` (Red pulsing progress bar, "Remittance Due").

---

### 2.5 Credential Inspection Card (`CredentialInspectionItem`)

Used in `app/(admin)/(tabs)/companies.tsx` to replace dense verification text blocks with visual proof cards.

```typescript
export type DocumentCategory = 'BUSINESS_LICENSE' | 'LIABILITY_INSURANCE' | 'ID_PROOF';
export type VerificationDecision = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface CredentialInspectionItem {
  companyId: string;
  companyName: string;
  category: DocumentCategory;
  documentUrl: string;
  submittedDate: string;
  status: VerificationDecision;
  rejectionReason?: string;
}

export interface CredentialCardProps {
  item: CredentialInspectionItem;
  onVerify: (companyId: string, category: DocumentCategory) => void;
  onReject: (companyId: string, category: DocumentCategory) => void;
  onPreviewImage: (url: string) => void;
}
```

---

## 3. Strict Boundary Rules

1. **Isolation Guard**: No entity or prop declared in this data model may be imported or rendered in any path under `frontend-expo/app/(customer)/**`. Customer UI stays completely frozen.
2. **Text Reduction Guarantee**: Components implementing these entities must enforce a maximum of **two words** for status and badge text labels, and **zero** informational narrative paragraphs.
3. **Dual Visual Cues**: Every status badge or indicator must render both an icon (`MaterialCommunityIcons`) and a concise label to guarantee accessibility under color blindness.
