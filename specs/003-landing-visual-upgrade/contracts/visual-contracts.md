# Phase 1 Interface & Component Contracts: Landing Page Visual Upgrade

**Feature**: ServiceFinder Landing Page Visual & Graphical Upgrade  
**Branch**: `003-landing-visual-upgrade`  
**Date**: 2026-09-25  
**Status**: Completed  

---

## 1. Visual Component Contracts & Interfaces

### 1.1 `DispatchMapSimulatorProps`
```typescript
export interface MapSimulatedRoute {
  id: string;
  technicianName: string;
  avatarUrl?: string;
  tradeSpecialty: string;
  districtName: string;
  startCoords: { x: number; y: number };
  endCoords: { x: number; y: number };
  etaMinutes: number;
  amountUsd: number;
  status: 'en_route' | 'in_progress' | 'settled';
}

export interface DispatchMapSimulatorProps {
  lang: 'kh' | 'en';
  onSimulateComplete?: (routeId: string) => void;
}
```

### 1.2 `BeforeAfterScrubberProps`
```typescript
export interface BeforeAfterScrubberProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatio?: string;
  className?: string;
}
```

### 1.3 `ComparativeRevenueChartProps`
```typescript
export interface ComparativeRevenueChartProps {
  teamSize: number;
  averageTicketUsd: number;
  lang: 'kh' | 'en';
}
```

### 1.4 `EcosystemPipelineProps`
```typescript
export interface PipelineNodeItem {
  step: number;
  titleEn: string;
  titleKh: string;
  descEn: string;
  descKh: string;
  stakeholder: 'customer' | 'dispatch' | 'technician' | 'bank';
  icon: string;
}

export interface EcosystemPipelineProps {
  lang: 'kh' | 'en';
}
```
