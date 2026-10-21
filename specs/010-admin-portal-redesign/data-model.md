# Data Model: Admin Mobile Cockpit Redesign

## Core Domain Entities

### 1. PlatformMetricsSnapshot
Aggregated marketplace health statistics displayed on the executive dashboard.

| Field | Type | Description |
| :--- | :--- | :--- |
| `totalRevenue` | `number` | Total platform Gross Merchandise Value (GMV) in USD |
| `revenueGrowth` | `number \| null` | Percentage growth compared to prior period |
| `totalUsers` | `number` | Count of registered platform users (customers + providers) |
| `usersGrowth` | `number \| null` | Growth percentage for total users |
| `totalCompanies` | `number` | Count of verified operating companies |
| `companiesGrowth` | `number \| null` | Growth percentage for verified companies |
| `totalBookings` | `number` | Cumulative booking orders placed |
| `completedBookings` | `number` | Count of successfully delivered bookings |
| `pendingCompanies` | `number` | Active applications awaiting verification review |
| `activeDisputes` | `number` | Unresolved customer/provider disputes |
| `payoutRequests` | `number` | Pending payout withdrawal requests from providers |
| `openTickets` | `number` | Unresolved customer support tickets |
| `recentCompanies` | `CompanySummary[]` | Most recently registered provider accounts |

---

### 2. CompanyVerificationRecord
Business entity undergoing platform onboarding and compliance verification.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique company identifier |
| `name` | `string` | Official legal or trade business name |
| `logo` | `string \| null` | Business logo image URI |
| `category` | `string` | Primary service category slug (e.g. `plumbing`, `cleaning`) |
| `registrationNumber` | `string` | Official government corporate registration identifier |
| `taxId` | `string \| null` | Registered tax identification number |
| `status` | `'pending' \| 'reviewing' \| 'verified' \| 'rejected'` | Verification status lifecycle state |
| `documents` | `CredentialDocument[]` | Uploaded compliance certificates, licenses, and insurance |
| `contactPhone` | `string` | Primary business contact telephone number |
| `contactEmail` | `string` | Primary business email address |
| `createdAt` | `string` | ISO timestamp of application submission |
| `verifiedAt` | `string \| null` | ISO timestamp when verification was approved |

#### CredentialDocument Sub-type
| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | `'BUSINESS_LICENSE' \| 'TAX_CERTIFICATE' \| 'INSURANCE' \| 'IDENTITY'` | Document classification |
| `url` | `string` | File or preview image URI |
| `status` | `'VERIFIED' \| 'PENDING' \| 'REJECTED' \| 'MISSING'` | Document audit status |
| `expiryDate` | `string \| null` | Expiration date of certificate |

---

### 3. DisputeCaseSummary
Customer-provider escrow contestation requiring administrative mediation.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique dispute identifier |
| `bookingId` | `string` | Reference to disputed booking order |
| `serviceTitle` | `string` | Name of service contracted |
| `customerName` | `string` | Name of customer who filed dispute |
| `customerAvatar` | `string \| null` | Customer profile avatar URI |
| `companyName` | `string` | Name of service company assigned |
| `companyLogo` | `string \| null` | Company logo URI |
| `disputedAmount` | `number` | Monetary sum currently locked in platform escrow |
| `status` | `'open' \| 'responded' \| 'resolved' \| 'escalated'` | Case progression status |
| `reason` | `string` | Formal reason for dispute filing (e.g. `POOR_QUALITY`, `NO_SHOW`) |
| `customerClaim` | `string` | Customer statement of fact |
| `providerRebuttal` | `string \| null` | Provider defense statement if submitted |
| `slaDeadline` | `string` | Target resolution ISO timestamp before auto-escalation |
| `createdAt` | `string` | Filing timestamp |

---

### 4. AdminNavigationModule
Metadata describing platform management hubs in `settings.tsx` and `AdminSidebar.tsx`.

| Field | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | Unique module identifier (e.g. `audit`, `payouts`, `disputes`) |
| `domain` | `'governance' \| 'marketplace' \| 'financials' \| 'operations' \| 'security'` | Section classification |
| `title` | `string` | Executive display label |
| `subtitle` | `string` | Actionable description |
| `icon` | `string` | MaterialCommunityIcon identifier |
| `route` | `string` | Expo router destination path |
| `badgeCount` | `number \| null` | Optional attention counter (e.g. pending payout batches) |

---

## State Transition Rules

### Company Verification Lifecycle
```
[Registered Application] 
       ↓
   (pending) ───[Admin assigns to self]───→ (reviewing)
       │                                        │
  [Verify]                                 [Reject]
       ↓                                        ↓
  (verified)                                (rejected)
       │                                        │
[Dispatch Enabled]                       [Re-upload Permitted]
```

### Dispute Resolution Lifecycle
```
    [Dispute Filed]
          ↓
       (open) ───[Provider responds]───→ (responded)
          │                                   │
          └────────────┬──────────────────────┘
                       ↓
               [Admin Mediation]
           ┌───────────┼───────────┐
      [Refund]      [Split]    [Release]
           ↓           ↓           ↓
  (Customer 100%) (50% / 50%) (Provider 100%)
           └───────────┼───────────┘
                       ↓
                  (resolved)
```
