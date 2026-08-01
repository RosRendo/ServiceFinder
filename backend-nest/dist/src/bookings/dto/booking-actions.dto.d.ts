export declare class UpdateBookingStatusDto {
    status: string;
}
export declare class AssignStaffDto {
    staffId: string;
}
export declare class UpdateProgressDto {
    progressPercent: number;
    staffNotes?: string;
    checklist?: any;
}
export declare class CancelBookingDto {
    reason?: string;
}
