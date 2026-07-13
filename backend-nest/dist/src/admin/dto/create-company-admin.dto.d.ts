export declare class InitialServiceDto {
    name: string;
    typeId: number;
    basePrice?: number;
    durationMin?: number;
    description?: string;
}
export declare class CreateCompanyAdminDto {
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerPhone?: string;
    companyName: string;
    companyDescription?: string;
    companyAddress?: string;
    companyCity?: string;
    companyPhone?: string;
    companyEmail?: string;
    logoUrl?: string;
    registrationNumber?: string;
    latitude?: number;
    longitude?: number;
    coverImageUrl?: string;
    verificationDocumentUrl?: string;
    establishedYear?: number;
    cardHighlights?: string[];
    detailHighlights?: string[];
    serviceName?: string;
    serviceTypeId?: number;
    serviceBasePrice?: number;
    serviceDurationMin?: number;
    serviceDescription?: string;
    services?: InitialServiceDto[];
}
