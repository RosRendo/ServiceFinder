# Data Model & Schema: Company Mobile Command Cockpit

**Feature**: `specs/009-company-cockpit-redesign`  
**Date**: 2026-10-05  
**Domain**: Mobile Command Cockpit Component Schemas & Operational State

---

## 1. Visual Tokens & Theme Mappings

| Token | Value | Semantic Role |
|:---|:---|:---|
| `cockpit-surface` | `#FFFFFF` | Card containers, modal sheets |
| `cockpit-bg` | `#F8FAFC` | Screen backdrop, search input wells |
| `cockpit-primary` | `#0A192F` | Primary headers, high-contrast action pills |
| `cockpit-text-muted` | `#64748B` | Sub-labels, secondary chips |
| `status-critical` | `#EF4444` / `#FEF2F2` | SLA breach risk (<5m), decline action |
| `status-warning` | `#F59E0B` / `#FEF3C7` | Approaching SLA (5-15m), high crew cash |
| `status-active` | `#10B981` / `#ECFDF5` | Online crew member, healthy SLA, completed jobs |
| `status-info` | `#0284C7` / `#E0F2FE` | Scheduled booking, navigation shortcut |

---

## 2. Component Data Entities

### 2.1 Company Cockpit Header (`CompanyCockpitHeaderData`)

```typescript
export interface CompanyCockpitHeaderData {
  companyId: string;
  companyName: string;
  logoUrl?: string;
  isVerified: boolean;
  dispatchStatus: 'ONLINE' | 'OFFLINE' | 'AUTO';
  stats: {
    onlineCrewCount: number;
    inProgressJobsCount: number;
    todayCompletedCount: number;
    slaComplianceRate: number; // e.g. 98%
  };
}
```

---

### 2.2 Urgent Dispatch Deck Item (`UrgentDispatchCardItem`)

```typescript
export interface UrgentDispatchCardItem {
  id: string | number;
  customerName: string;
  customerAvatar?: string;
  serviceName: string;
  bookingDate: string;
  startTime?: string;
  payoutAmount: number;
  serviceAddress: string;
  isInstant: boolean;
  deadlineMinutes: number;
  notes?: string;
}
```

**State Transitions & Actions**:
- `Accept & Assign` $\rightarrow$ triggers `AssignStaffModal(bookingId)` $\rightarrow$ sets status to `confirmed` with technician assignment.
- `Decline` $\rightarrow$ opens fast reason confirmation $\rightarrow$ sets status to `cancelled` or releases to platform pool.

---

### 2.3 Financial Command Ledger (`FinancialCommandData`)

```typescript
export interface FinancialCommandData {
  availableBalance: number;       // Ready for bank/QR withdrawal
  escrowBalance: number;          // Locked in in-progress customer bookings
  unremittedCrewCash: number;     // Physical cash collected by technicians in field
  todayNetRevenue: number;        // Total net earnings logged today
  cashRemittanceLimit: number;    // Maximum unremitted cash before company lock (default: $100)
}
```

**Derivations & Warnings**:
- If `unremittedCrewCash >= cashRemittanceLimit`: triggers high-priority warning chip with direct shortcut to cash audit table.

---

### 2.4 Fleet Quick-Radar Member (`FleetRadarMember`)

```typescript
export type FleetMemberStatus = 'ONLINE' | 'ON_JOB' | 'OFFLINE';

export interface FleetRadarMember {
  id: string;
  name: string;
  avatarUrl?: string;
  status: FleetMemberStatus;
  activeJobCount: number;
  distanceKm: number;
  phone: string;
}
```

---

## 3. Strict Scope & Invariant Rules

1. **Customer Screen Boundary**:
   - Zero entity or schema declared in this data model may be imported or rendered in any path under `frontend-expo/app/(customer)/**`. Customer screens remain completely untouched.
2. **Text Distillation Guarantee**:
   - All status labels and badges must be $\le 2$ words.
   - Zero narrative instructional paragraphs in cockpit components.
3. **Accessibility Dual Visual Cues**:
   - Every status chip must combine iconography (`MaterialCommunityIcons`) with a concise label.
