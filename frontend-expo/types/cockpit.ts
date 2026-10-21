/**
 * TypeScript Interfaces for Company Mobile Command Cockpit
 * Feature: specs/009-company-cockpit-redesign
 */

export interface CompanyCockpitHeaderData {
  companyId?: string;
  companyName: string;
  logoUrl?: string;
  isVerified: boolean;
  dispatchStatus?: 'ONLINE' | 'OFFLINE' | 'AUTO';
  stats: {
    onlineCrewCount: number;
    inProgressJobsCount: number;
    todayCompletedCount: number;
    slaComplianceRate: number; // e.g. 98
  };
}

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

export interface FinancialCommandData {
  availableBalance: number;
  escrowBalance: number;
  unremittedCrewCash: number;
  todayNetRevenue: number;
  cashRemittanceLimit: number; // default $100
}

export type FleetMemberStatus = 'ONLINE' | 'ON_JOB' | 'OFFLINE';

export interface FleetRadarMember {
  id: string;
  name: string;
  avatarUrl?: string;
  status: FleetMemberStatus;
  activeJobCount: number;
  distanceKm?: number;
  phone: string;
}
