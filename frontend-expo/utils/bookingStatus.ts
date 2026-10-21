import { BookingStatus } from '@/types/booking';

export interface StatusConfig {
  label: string;
  labelKhmer: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
  nextAction?: {
    actionKey: string;
    label: string;
    labelKhmer: string;
    targetStatus: BookingStatus;
  };
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  pending: {
    label: 'Pending Assignment',
    labelKhmer: 'រង់ចាំការចាត់តាំង',
    bgColor: '#FFFBEB',
    textColor: '#D97706',
    borderColor: '#FDE68A',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-500',
    iconName: 'clock',
    nextAction: {
      actionKey: 'assign',
      label: 'Assign Staff',
      labelKhmer: 'ចាត់តាំងបុគ្គលិក',
      targetStatus: 'assigned',
    },
  },
  assigned: {
    label: 'Assigned / Waiting Pro',
    labelKhmer: 'បានចាត់តាំង / រង់ចាំជាង',
    bgColor: '#EFF6FF',
    textColor: '#2563EB',
    borderColor: '#BFDBFE',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-500',
    iconName: 'user-check',
    nextAction: {
      actionKey: 'depart',
      label: 'Depart (En Route)',
      labelKhmer: 'ចេញដំណើរ',
      targetStatus: 'en_route',
    },
  },
  confirmed: {
    label: 'Confirmed',
    labelKhmer: 'បានបញ្ជាក់',
    bgColor: '#F0FDF4',
    textColor: '#16A34A',
    borderColor: '#BBF7D0',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-500',
    iconName: 'check-circle-2',
    nextAction: {
      actionKey: 'depart',
      label: 'Depart (En Route)',
      labelKhmer: 'ចេញដំណើរ',
      targetStatus: 'en_route',
    },
  },
  en_route: {
    label: 'On the Way',
    labelKhmer: 'កំពុងធ្វើដំណើរទៅកាន់ទីតាំង',
    bgColor: '#FAF5FF',
    textColor: '#9333EA',
    borderColor: '#E9D5FF',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-500',
    iconName: 'navigation',
    nextAction: {
      actionKey: 'arrive',
      label: 'I Have Arrived',
      labelKhmer: 'បានទៅដល់ទីតាំង',
      targetStatus: 'arrived',
    },
  },
  arrived: {
    label: 'Arrived on Site',
    labelKhmer: 'បានមកដល់ទីតាំងសេវាកម្ម',
    bgColor: '#ECFEFF',
    textColor: '#0891B2',
    borderColor: '#A5F3FC',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-500',
    iconName: 'map-pin',
    nextAction: {
      actionKey: 'start',
      label: 'Start Service',
      labelKhmer: 'ចាប់ផ្តើមសេវាកម្ម',
      targetStatus: 'in_progress',
    },
  },
  in_progress: {
    label: 'Service in Progress',
    labelKhmer: 'កំពុងដំណើរការសេវាកម្ម',
    bgColor: '#FFF7ED',
    textColor: '#EA580C',
    borderColor: '#FED7AA',
    badgeBg: 'bg-orange-500/10',
    badgeText: 'text-orange-500',
    iconName: 'tool',
    nextAction: {
      actionKey: 'complete',
      label: 'Complete Job & Cash',
      labelKhmer: 'បញ្ចប់ការងារ & ប្រមូលប្រាក់',
      targetStatus: 'completed',
    },
  },
  completed: {
    label: 'Completed',
    labelKhmer: 'បានបញ្ចប់ដោយជោគជ័យ',
    bgColor: '#F0FDF4',
    textColor: '#15803D',
    borderColor: '#86EFAC',
    badgeBg: 'bg-emerald-600/10',
    badgeText: 'text-emerald-600',
    iconName: 'check-check',
  },
  cancelled: {
    label: 'Cancelled',
    labelKhmer: 'បានបោះបង់',
    bgColor: '#FEF2F2',
    textColor: '#DC2626',
    borderColor: '#FECACA',
    badgeBg: 'bg-red-500/10',
    badgeText: 'text-red-500',
    iconName: 'x-circle',
  },
  rejected: {
    label: 'Declined',
    labelKhmer: 'បានបដិសេធ',
    bgColor: '#FEF2F2',
    textColor: '#991B1B',
    borderColor: '#FCA5A5',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-500',
    iconName: 'slash',
  },
  disputed: {
    label: 'Under Dispute / Review',
    labelKhmer: 'កំពុងដោះស្រាយវិវាទ',
    bgColor: '#FFF1F2',
    textColor: '#E11D48',
    borderColor: '#FECDD3',
    badgeBg: 'bg-pink-500/10',
    badgeText: 'text-pink-500',
    iconName: 'alert-triangle',
  },
};

export function getBookingStatusConfig(status: BookingStatus | string): StatusConfig {
  const normalized = (status || 'pending').toLowerCase() as BookingStatus;
  return BOOKING_STATUS_CONFIG[normalized] || BOOKING_STATUS_CONFIG.pending;
}
