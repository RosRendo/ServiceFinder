# Phase 1 Data Model: Staff Experience & Field Operations

**Feature**: `012-staff-experience-alignment`
**Date**: 2026-10-06
**Status**: Completed

---

## Entity Models & Relationships

```mermaid
erDiagram
    STAFF_USER ||--o| COMPANY_STAFF : "operates as"
    COMPANY_STAFF ||--o{ BOOKING : "assigned to"
    BOOKING ||--o| PROOF_OF_WORK : "requires"
    COMPANY_STAFF ||--o{ SHIFT_EARNINGS : "accumulates"
    COMPANY_STAFF ||--o{ TIMEOFF_REQUEST : "submits"

    COMPANY_STAFF {
        string id PK
        string userId FK
        string companyId FK
        string role "worker | supervisor | technician"
        boolean isAvailable
        float rating
        int activeJobsCount
    }

    BOOKING {
        string id PK
        string status "pending | confirmed | in_progress | completed | cancelled"
        string customerId FK
        string serviceId FK
        string serviceAddress
        float totalPrice
        float staffEarnings
        datetime bookingDate
        string startTime
    }

    PROOF_OF_WORK {
        string id PK
        string bookingId FK
        string beforePhotoUrl
        string afterPhotoUrl
        string signatureBase64
        string technicianNotes
        datetime completedAt
    }

    SHIFT_EARNINGS {
        float todayEarnings
        float weeklyEarnings
        int todayCompleted
        int weeklyCompleted
        float avgRating
        float completionRate
    }
```

---

## State Transition Model: Field Service State Machine

```mermaid
stateDiagram-v2
    [*] --> WAITING : Technician goes Online
    WAITING --> NEW_JOB : Dispatch assigns booking
    NEW_JOB --> WAITING : Decline / Timeout
    NEW_JOB --> TRAVELING : Accept Job & Start Route
    TRAVELING --> ARRIVED : Arrive at Client Address
    ARRIVED --> WORKING : Begin Service Checklist
    WORKING --> FINISHING : Complete Checklist Items
    FINISHING --> COMPLETED : Upload Proof Photos & Sign-off
    COMPLETED --> WAITING : Release to Dispatch Pool
```

---

## Key Data Contracts

### 1. Shift Performance Endpoint: `GET /api/staff/performance`
```typescript
interface StaffPerformanceResponse {
  todayEarnings: number;
  weeklyEarnings: number;
  todayCompleted: number;
  weeklyCompleted: number;
  avgRating: number;
  completionRate: number;
  responseRate: number;
  weeklyChart: Array<{
    day: string; // 'Mon', 'Tue', ...
    amount: number;
    isToday: boolean;
  }>;
}
```

### 2. Dispatched Assignments Endpoint: `GET /api/bookings/my-assignments`
```typescript
interface StaffAssignmentResponse {
  bookings: Array<{
    id: string | number;
    bookingDate: string;
    startTime: string;
    endTime?: string;
    serviceAddress: string;
    totalPrice: number;
    staffEarnings?: number;
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    service?: { name: string };
    customer?: { fullName: string; phone?: string };
    checklist?: any[];
  }>;
}
```
