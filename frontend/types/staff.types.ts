export interface StaffMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatar: string | null;
  phone: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended'; // you can add more statuses if needed
  activeRequests: number;
  completedJobs: number;
  averageRating: number | null;
  totalReviews: number;
  isAvailable: boolean;
  joinedAt: string; // ISO date string
  walletBalance: number;
  creditLimit: number;
}

// If you have an array of staff:
export type StaffList = StaffMember[];
