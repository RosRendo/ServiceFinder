# Data Model: Role Flow Hierarchy Validation & Optimization

**Feature**: `specs/007-role-flow-hierarchy`  
**Date**: 2026-10-05  
**Domain**: Multi-Role Marketplace Data Architecture

---

## 1. Core Entities & Field Mappings

### 1.1 Booking Lifecycle State Machine
Represents customer service requests routed to companies and fulfilled by field staff.

```
       [pending]
           │
           ▼
      [confirmed] ──────────┐ (Company assigns staff)
           │                │
           ▼                ▼
       [assigned] ────► [cancelled] (by customer/admin)
           │
           ▼ (Staff taps "En Route")
       [en_route]
           │
           ▼ (Staff arrives on-site)
       [arrived]
           │
           ▼ (Staff begins work)
      [in_progress]
           │
           ▼ (Staff submits photo & cash summary)
      [completed]
           │
           ▼ (Optional customer/provider escalation)
       [disputed]
```

#### Fields & Attributes
| Field | Type | Description | Visibility / Role Scope |
| :--- | :--- | :--- | :--- |
| `id` | BigInt (PK) | Unique booking identifier | All Roles |
| `customerId` | BigInt (FK) | Reference to customer user | All Roles |
| `companyId` | BigInt (FK) | Service company handling the booking | Company, Staff, Admin |
| `serviceId` | BigInt (FK) | Specific service offering | All Roles |
| `assignedStaffId` | BigInt (FK, nullable) | Assigned technician (`CompanyStaff.id`) | Company, Staff, Admin |
| `status` | BookingStatus | Lifecycle state enum (`pending`, `confirmed`, `assigned`, `en_route`, `arrived`, `in_progress`, `completed`, `cancelled`) | All Roles |
| `bookingDate` | Date | Scheduled service date | All Roles |
| `startTime` | Time | Scheduled start window | All Roles |
| `endTime` | Time | Scheduled completion window | All Roles |
| `actualStartTime` | Timestamp (nullable) | Actual time technician started job | Company, Staff, Admin |
| `actualEndTime` | Timestamp (nullable) | Actual time technician finished job | Company, Staff, Admin |
| `serviceAddress` | String | Physical service address | All Roles |
| `latitude` / `longitude` | Decimal(10, 7) | Customer location coordinates | All Roles |
| `staffStartLatitude` / `staffStartLongitude` | Decimal(10, 7) | Coordinates where technician started job | Company, Admin |
| `progressPercent` | Integer (0-100) | Operational progress indicator | All Roles |
| `proofOfWorkPhoto` | String (URL, nullable) | Verified photograph of completed work | All Roles |
| `staffNotes` | Text (nullable) | Technician on-site notes | Company, Staff, Admin |
| `totalPrice` | Decimal(10, 2) | Gross customer price | All Roles |
| `platformFee` | Decimal(10, 2) | Marketplace commission deduction | Company, Admin |
| `companyEarnings` | Decimal(10, 2) | Net earnings credited to company | Company, Admin |
| `staffEarnings` | Decimal(10, 2) | Technician payout / commission share | Company, Staff, Admin |

---

### 1.2 Company Staff & Field Profile (`CompanyStaff`)
Represents the technician roster and on-field status for scheduling and dispatch.

| Field | Type | Description | Visibility / Role Scope |
| :--- | :--- | :--- | :--- |
| `id` | BigInt (PK) | Staff record identifier | All Roles |
| `companyId` | BigInt (FK) | Associated service enterprise | Company, Admin |
| `userId` | BigInt (FK) | Underlying user credentials & profile | All Roles |
| `role` | StaffRole | Operational authority: `worker`, `supervisor`, `manager` | Company, Admin |
| `status` | StaffStatus | Roster status: `active`, `inactive` | Company, Admin |
| `workingStatus` | String | Dynamic shift state: `online`, `offline`, `on_job` | Company, Staff, Admin |
| `creditLimit` | Decimal(10, 2) | Maximum unremitted cash allowed (default: -$50.00) | Company, Staff, Admin |
| `walletBalance` | Decimal(10, 2) | Cash ledger / balance balance | Company, Staff, Admin |
| `splitPercent` | Decimal(5, 2) | Agreed revenue commission share percentage | Company, Staff, Admin |
| `latitude` / `longitude` | Decimal(10, 7) | Real-time / last known pro coordinates (on User) | Company, Admin |
| `khqrImageUrl` | String (URL) | Personal QR code for direct tips / customer payment | Staff, Company |

---

### 1.3 Company Profile & Operational Ledger (`Company`)
Represents the business enterprise managing a technician fleet.

| Field | Type | Description | Visibility / Role Scope |
| :--- | :--- | :--- | :--- |
| `id` | BigInt (PK) | Company identifier | All Roles |
| `name` | String(150) | Official business trade name | All Roles |
| `verificationStatus` | VerificationStatus | `pending`, `verified`, `rejected` | Company, Admin |
| `verificationDocumentUrl` | String (URL) | Business license / registration certificate | Company, Admin |
| `walletBalance` | Decimal(10, 2) | Total company digital balance | Company, Admin |
| `availableBalance` | Decimal(10, 2) | Funds ready for bank withdrawal | Company, Admin |
| `pendingBalance` | Decimal(10, 2) | Unreleased escrow or pending settlements | Company, Admin |
| `platformFeePercent` | Decimal(5, 2) | Contractual platform commission rate (e.g., 10%) | Company, Admin |
| `coverageRadiusKm` | Integer | Maximum operating dispatch radius | All Roles |
| `bookingMode` | String | `dispatch` (direct assign) or `pool` (first-to-claim) | Company, Admin |

---

### 1.4 Dispute & Escrow Record (`Dispute`)
Represents contentious bookings escalated to platform administration.

| Field | Type | Description | Visibility / Role Scope |
| :--- | :--- | :--- | :--- |
| `id` | Integer (PK) | Unique dispute case docket number | Customer, Company, Admin |
| `bookingId` | BigInt (FK, unique) | Disputed service transaction | Customer, Company, Admin |
| `customerId` | BigInt (FK) | Complainant customer | Customer, Company, Admin |
| `companyId` | BigInt (FK) | Respondent service provider | Customer, Company, Admin |
| `type` | String(50) | Categorization (`no_show`, `poor_quality`, `damage`, `overcharge`) | Customer, Company, Admin |
| `description` | Text | Customer's detailed problem statement | Customer, Company, Admin |
| `photos` | String (JSON/URL) | Customer evidence photographs | Customer, Company, Admin |
| `status` | String | Case state: `open`, `under_review`, `resolved`, `dismissed` | Customer, Company, Admin |
| `companyResponse` | Text (nullable) | Provider's rebuttal or explanation | Customer, Company, Admin |
| `adminDecision` | String(50, nullable) | Adjudication: `refund_customer`, `release_provider`, `split` | Customer, Company, Admin |
| `refundAmount` | Decimal(10, 2) | Disbursed refund amount | Customer, Company, Admin |
| `frozenAmount` | Decimal(10, 2) | Escrow funds locked during dispute | Admin, Company |

---

## 2. Validation & Business Rules

1. **Staff State Constraint**:
   - A technician cannot be assigned to two overlapping bookings if `workingStatus == 'on_job'` unless the company has explicitly enabled multi-stop routing.
   - When marking `Completed`, `proofOfWorkPhoto` is mandatory if required by the service type policy.
2. **Cash Settlement Limit**:
   - If `walletBalance < creditLimit`, the technician cannot accept new Cash On Delivery bookings until an admin/company manager logs a remittance transaction.
3. **Company Verification Requirement**:
   - Companies in `pending` or `rejected` verification status cannot receive direct customer bookings from the public marketplace.
4. **Dispute Escrow Freezing**:
   - When a dispute is lodged against a booking, the associated payment record transitions to `escrow` or `disputed`, preventing provider payout until the superadmin enters an adjudication decision.
