export type StaffWorkingStatus = 'online' | 'offline' | 'on_job';

export type StaffRole = 'worker' | 'supervisor' | 'manager';

export type StaffStatus = 'active' | 'inactive';

export interface StaffProfile {
  id: string;
  companyId: string;
  userId: string;
  fullName: string;
  phone?: string;
  email?: string;
  avatar?: string;
  role: StaffRole;
  status: StaffStatus;
  workingStatus: StaffWorkingStatus;
  walletBalance: number;
  creditLimit: number;
  splitPercent?: number;
  latitude?: number;
  longitude?: number;
  khqrImageUrl?: string;
  completedJobsToday?: number;
  unremittedCashBalance?: number;
}

export interface StaffShiftSummary {
  workingStatus: StaffWorkingStatus;
  todayEarnings: number;
  completedCount: number;
  unremittedCash: number;
  creditLimit: number;
}
