# Data Model: Enterprise Clean Business Admin Portal

**Feature**: `011-redesign-all-page` | **Date**: 2026-10-06  
**Scope**: Domain entities, lifecycle states, and validation rules for admin mobile screens.

---

## 1. Domain Entities & Schemas

### 1.1 ExecutivePlatformTelemetry
Represents real-time financial, operational, and SLA health indicators displayed on the command dashboard and analytics views.

| Attribute | Type | Description | Validation / Constraints |
| :--- | :--- | :--- | :--- |
| `grossMerchandiseVolume` | Decimal | Total platform gross booking transaction volume | Non-negative numeric |
| `platformCommission` | Decimal | Net revenue retained by the marketplace | Calculated via contractual rate |
| `activeEscrowCustody` | Decimal | Total customer funds held in custodial escrow | Positive numeric |
| `completedBookingsCount` | Integer | Total successfully fulfilled service orders | Non-negative integer |
| `pendingApprovalsCount` | Integer | Number of provider KYC applications pending review | Non-negative integer |
| `activeDisputesCount` | Integer | Number of open customer-provider booking claims | Non-negative integer |
| `pendingPayoutBatchesCount`| Integer | Number of provider payout batches awaiting dispatch | Non-negative integer |

---

### 1.2 BusinessVerificationDossier
Represents a service company applying for marketplace operating credentials.

| Attribute | Type | Description | Validation / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | UUID / String | Unique company identifier | Unique, required |
| `legalName` | String | Official registered trade name of business | Max 120 chars, required |
| `registrationNumber` | String | Government business registration / tax number | Formatted string |
| `businessCategory` | String | Primary trade classification (e.g. Plumbing, HVAC) | Enumerated string |
| `cityLocation` | String | Primary operational jurisdiction / city | String |
| `ownerContact` | Object | Name, verified email, and phone number of owner | Validated format |
| `documentUrl` | String | URI to uploaded business license or ID certificate | Valid URI |
| `verificationStatus` | Enum | Current compliance review state | `pending`, `reviewing`, `verified`, `rejected` |
| `appliedAt` | Timestamp | Timestamp of initial application submission | ISO 8601 |
| `slaDeadline` | Timestamp | Calculated SLA resolution window (24h from submission)| ISO 8601 |

#### State Transitions
```text
           ┌─────────────┐
           │   PENDING   │
           └──────┬──────┘
                  │ [Admin starts inspection]
                  ▼
           ┌─────────────┐
           │  REVIEWING  │
           └───┬─────┬───┘
[Verify Docs] │     │ [Reject with reason]
               ▼     ▼
  ┌────────────┐     ┌────────────┐
  │  VERIFIED  │     │  REJECTED  │
  └────────────┘     └────────────┘
```

---

### 1.3 DisputeArbitrationCase
Represents a contested service booking requiring administrative mediation and escrow disposition.

| Attribute | Type | Description | Validation / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | UUID / String | Unique dispute case identifier | Unique, required |
| `bookingId` | UUID / String | Reference to underlying service booking | Required reference |
| `claimant` | Object | Customer identity, email, and phone | Validated format |
| `provider` | Object | Company name, registration, and owner contact | Validated format |
| `escrowAmount` | Decimal | Exact monetary sum held in platform custody | Positive currency |
| `disputeGrounds` | String | Reason category (e.g. Service Incomplete, Damage) | Categorized string |
| `statement` | String | Formal statement filed by claimant | Required |
| `defenseStatement` | String | Formal counter-statement filed by provider | Optional if unanswered |
| `status` | Enum | Case mediation lifecycle state | `open`, `responded`, `resolved` |
| `settlementDecision` | Enum | Binding administrative disposition | `REFUND`, `SPLIT`, `RELEASE`, null |
| `adminAuditNote` | String | Mandatory written justification for financial record | Min 5 chars when resolving |
| `resolvedAt` | Timestamp | Timestamp when binding settlement was executed | ISO 8601 |

#### State Transitions
```text
           ┌─────────────┐
           │    OPEN     │ (Claim filed, funds locked)
           └──────┬──────┘
                  │ [Provider submits response]
                  ▼
           ┌─────────────┐
           │  RESPONDED  │ (Evidence ready for arbitrator)
           └──────┬──────┘
                  │ [Admin arbitrates via 2-step safeguard]
                  ▼
           ┌─────────────┐
           │  RESOLVED   │ (Funds disbursed: Refund/Split/Release)
           └─────────────┘
```

---

### 1.4 SystemAuditEvent
Represents an immutable record of an administrative or system security action.

| Attribute | Type | Description | Validation / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | UUID / String | Unique audit event identifier | Unique, required |
| `actorName` | String | Name of administrator executing action | Required |
| `actorRole` | String | Security role (e.g. SUPERADMIN, COMPLIANCE_OFFICER) | Required |
| `actionType` | Enum | Event classification | `LOGIN`, `VERIFY_COMPANY`, `RESOLVE_DISPUTE`, `DISBURSE_PAYOUT`, `UPDATE_SETTINGS` |
| `entityReference` | String | Target entity identifier (Company #, Case #) | Required |
| `ipAddress` | String | Originating client network address | Valid IP string |
| `timestamp` | Timestamp | Exact UTC execution timestamp | ISO 8601 |
| `auditNote` | String | Recorded reason or change summary | String |
