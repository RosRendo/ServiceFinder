export declare class CreateBookingDto {
    companyId: string;
    serviceId: string;
    bookingDate: string;
    startTime: string;
    endTime?: string;
    serviceAddress?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    promoCode?: string;
}
