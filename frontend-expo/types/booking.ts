export type BookingStatus =
  | 'pending'
  | 'assigned'
  | 'confirmed'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'disputed';

export interface BookingAddress {
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface BookingCustomer {
  id: string;
  fullName: string;
  phone?: string;
  avatar?: string;
}

export interface BookingStaff {
  id: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface BookingService {
  id: string;
  name: string;
  image?: string;
  basePrice?: number;
  categoryName?: string;
}

export interface BookingItem {
  id: string;
  customerId: string;
  companyId: string;
  serviceId: string;
  assignedStaffId?: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  serviceAddress: string;
  latitude?: number | null;
  longitude?: number | null;
  staffStartLatitude?: number | null;
  staffStartLongitude?: number | null;
  status: BookingStatus;
  progressPercent: number;
  checklist?: string[] | null;
  proofOfWorkPhoto?: string | null;
  staffNotes?: string | null;
  totalPrice: number;
  platformFee?: number;
  companyEarnings?: number;
  staffEarnings?: number;
  createdAt: string;
  updatedAt: string;
  customerNotes?: string | null;
  customer?: BookingCustomer;
  assignedStaff?: BookingStaff | null;
  service?: BookingService;
  company?: {
    id: string;
    name: string;
    phone?: string;
  };
}
