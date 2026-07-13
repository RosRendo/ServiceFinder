import { Service } from "./service.types";
import { Payment } from "./payment.type";
import { Company } from "./company.types";
import { User } from "./user.types";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "enroute"
  | "completed"
  | "cancelled";

export interface BookingStatusLog {
  id: string;
  bookingId: string;
  oldStatus: BookingStatus | null;
  newStatus: BookingStatus;
  changedBy: string;
  changedAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  companyId: string;
  serviceId: string;
  assignedStaffId: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  serviceAddress: string;
  latitude: number | null;
  longitude: number | null;
  status: BookingStatus;
  progressPercent: number;
  staffNotes: string | null;
  totalPrice: string;
  platformFee: string | number;
  companyEarnings: string | number;
  customerNotes: string;
  createdAt: string;
  updatedAt: string;
  customer: Pick<User, "id" | "fullName" | "email" | "phone">;
  company: Pick<Company, "id" | "name" | "phone" | "email" | "ownerId">;
  service: Service;
  assignedStaff?: {
    id: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
      avatar: string | null;
    };
  } | null;
  payment: Payment | null;
  review: any | null;
  cancellation: any | null;
  statusLogs: BookingStatusLog[];
}

// full API response
export interface BookingResponse {
  success: boolean;
  booking: Booking;
}
