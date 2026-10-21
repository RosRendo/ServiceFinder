# Phase 1 Data Model: Mobile On-Demand Booking Flow

**Feature**: `006-mobile-flow-cleanup`  
**Date**: 2026-10-05  

---

## 1. Domain Entities & Schemas

### Service Listing (Customer View)
```typescript
interface CustomerServiceListing {
  id: string;                    // BigInt serialized to string
  companyId: string;             // Owning service company
  serviceTypeId: string;         // Category trade type
  name: string;                  // e.g. "AC Deep Chemical Wash"
  description: string;           // Detailed scope of work
  image: string;                 // High-res Unsplash image URL
  basePrice: number;             // Flat rate or minimum price in USD
  discountPrice?: number;        // Optional promotional price
  durationMin: number;           // Expected duration (minutes)
  durationMax?: number;          // Maximum expected duration
  features: string[];            // Bullet points (e.g. "High-pressure wash")
  checklist: string[];           // Step-by-step verified technician actions
  isActive: boolean;             // Available for customer booking
  company: {
    id: string;
    name: string;
    city: string;
    logoUrl?: string;
    ratingSummary?: {
      averageRating: number;     // e.g. 4.9
      totalReviews: number;      // e.g. 240
    };
  };
  distanceKm?: number;           // Calculated proximity from customer GPS
  etaMinutes?: number;           // Estimated arrival time
}
```

### Direct Booking Contract (Checkout Payload)
```typescript
interface CreateBookingPayload {
  serviceId: string;             // Target service
  companyId: string;             // Assigned or selected provider
  bookingDate: string;           // ISO format "YYYY-MM-DD"
  startTime: string;             // "HH:MM" e.g. "14:00"
  serviceAddress: string;        // Formatted street address
  latitude: number;              // Precise customer latitude
  longitude: number;             // Precise customer longitude
  notes?: string;                // Customer access notes or gate code
  paymentMethod: "khqr" | "aba" | "wing" | "cash";
}
```

### Instant Dispatch Request (Urgent Pro)
```typescript
interface InstantDispatchRequest {
  id?: string;
  customerId: string;
  serviceCategory: string;       // e.g. "HVAC", "Plumbing", "Electrical"
  description: string;           // Emergency description
  preferredTime: "asap";         // Immediate arrival requested
  latitude: number;              // Customer GPS latitude
  longitude: number;             // Customer GPS longitude
  status: "searching" | "assigned" | "en_route" | "completed" | "cancelled";
  assignedStaffId?: string;
  assignedStaff?: {
    name: string;
    avatar?: string;
    phone?: string;
    latitude: number;
    longitude: number;
  };
}
```

### User Saved Address
```typescript
interface UserSavedAddress {
  id: string;
  userId: string;
  label: "Home" | "Work" | "Condo" | "Other";
  streetAddress: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}
```

---

## 2. State Management Stores

### `customerHomeStore.ts`
- **Cache Strategy**: Stale-while-revalidate via `AsyncStorage` (`cache:customer_home_v1`).
- **State**:
  - `categories: Category[]`
  - `trendingServices: Service[]`
  - `recommendedServices: Service[]`
  - `activeBooking: Booking | null`
  - `topCompanies: Company[]`
  - `sponsoredCompanies: Company[]`
  - `isLoading: boolean`
  - `hasMore: boolean`

### `authStore.ts`
- **Session Tokens**: Managed via `expo-secure-store` (`authToken`, `refreshToken`).
- **Guest Handling**: Allows guest browsing without throwing 401 exceptions until an authenticated endpoint (e.g. `/api/bookings`) is triggered.
