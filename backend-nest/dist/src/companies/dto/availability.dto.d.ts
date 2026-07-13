export declare class AddAvailabilityDto {
    date: string;
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
}
export declare class GenerateAvailabilityDto {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    daysOff?: number[];
}
