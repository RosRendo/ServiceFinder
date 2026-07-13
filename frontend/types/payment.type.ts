import { Booking } from "./booking.types";
import { User } from "./user.types";

export type PaymentMethod = 'card' | 'cash' | 'wallet' ;
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  method: PaymentMethod;
  amount: string;
  currency: string;
  status: PaymentStatus;
  transactionRef: string;
  paidAt: string;

  booking: Booking;
  user: Pick<User, 'id' | 'fullName' | 'email' >;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentsResponse {
  payments: Payment[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

