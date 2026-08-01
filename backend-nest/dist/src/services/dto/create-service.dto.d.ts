export declare class CreateServiceDto {
    companyId: string;
    serviceTypeId: string;
    name: string;
    description?: string;
    basePrice: number;
    durationMin: number;
    durationMax: number;
    features?: any;
    image?: string;
    checklist?: any;
}
