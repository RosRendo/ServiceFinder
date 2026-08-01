export declare class UpdateServiceDto {
    id?: string;
    name: string;
    typeId: number;
    basePrice?: number;
    durationMin?: number;
    description?: string;
}
export declare class UpdateCompanyAdminDto {
    name?: string;
    verificationStatus?: string;
    status?: string;
    description?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    verificationDocumentUrl?: string;
    registrationNumber?: string;
    establishedYear?: number;
    latitude?: number;
    longitude?: number;
    cardHighlights?: string[];
    detailHighlights?: string[];
    services?: UpdateServiceDto[];
}
