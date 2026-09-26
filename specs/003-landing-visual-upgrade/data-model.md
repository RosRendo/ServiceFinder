# Phase 1 Data Model: ServiceFinder Landing Page Visual & Graphical Upgrade

**Feature**: ServiceFinder Landing Page Visual & Graphical Upgrade  
**Branch**: `003-landing-visual-upgrade`  
**Date**: 2026-09-25  
**Status**: Completed  

---

## 1. Entities & Schemas

### 1.1 `VisualSimulatedRoute`
Represents an active simulated dispatch route rendered on the interactive Phnom Penh vector map.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique route identifier (e.g. `"route-tk-1"`). |
| `technicianName` | `string` | Display name of the field technician (e.g. `"Sokha Vireak"`). |
| `tradeSpecialty` | `string` | Industry trade (e.g. `"HVAC Senior Tech"`). |
| `districtName` | `string` | Phnom Penh district (e.g. `"Toul Kork"`). |
| `startCoords` | `{ x: number; y: number }` | Origin vector coordinates on the SVG map (0-100% scale). |
| `endCoords` | `{ x: number; y: number }` | Destination customer coordinates on the SVG map. |
| `transitPathSvg`| `string` | SVG `path` data string (`d="..."`) for the animated route vector. |
| `etaMinutes` | `number` | Estimated arrival countdown (e.g. `8`). |
| `amountUsd` | `number` | Work order price (e.g. `45.00`). |
| `status` | `string` | Enum: `"en_route" \| "in_progress" \| "settled"`. |

---

### 1.2 `VisualTradeCard`
Represents a visually enriched trade card with high-resolution photography and Before/After scrubber assets.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Category identifier (e.g. `"ac-hvac"`). |
| `slug` | `string` | Router link target (`/services?category=${slug}`). |
| `nameEn` | `string` | English category headline. |
| `nameKh` | `string` | Khmer category headline. |
| `startingPriceUsd`| `number` | Minimum baseline starting price in USD (e.g. `15`). |
| `providerCount` | `number` | Count of licensed local providers (e.g. `142`). |
| `heroImageUrl` | `string` | High-resolution photography asset URL. |
| `beforeAfter` | `object` (optional) | Contains `beforeImageUrl`, `afterImageUrl`, `tagEn`, `tagKh`. |

---

### 1.3 `VisualChartBar`
Represents a comparative data bar in the dynamic ROI Growth Chart.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Bar identifier (`"traditional"` vs `"servicefinder"`). |
| `labelEn` | `string` | Bar display label in English (e.g. `"ServiceFinder Automated OS"`). |
| `labelKh` | `string` | Bar display label in Khmer. |
| `monthlyRevenueUsd`| `number` | Projected monthly revenue volume. |
| `heightPercentage` | `number` | Scaled relative height (20% to 100%) for visual rendering. |
| `isHighlight` | `boolean` | Flag for vibrant gradient accenting. |

---

### 1.4 `VisualPipelineNode`
Represents a stage in the illuminated 4-node ecosystem workflow diagram.

| Field | Type | Description |
| :--- | :--- | :--- |
| `step` | `number` | Sequential step number (1 to 4). |
| `titleEn` | `string` | Step headline in English (e.g. `"1-Click Booking"`). |
| `titleKh` | `string` | Step headline in Khmer. |
| `stakeholder` | `string` | Enum: `"customer" \| "dispatch" \| "technician" \| "bank"`. |
| `iconName` | `string` | Lucide icon identifier. |
| `pulseLabelEn` | `string` | Micro-label on the animated signal beam (e.g. `"Instant Push Alert"`). |
| `pulseLabelKh` | `string` | Micro-label in Khmer. |
