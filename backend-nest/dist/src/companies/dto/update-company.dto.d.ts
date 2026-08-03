export declare class UpdateCompanyDto {
    name?: string;
    description?: string;
    registrationNumber?: string;
    address?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    establishedYear?: string;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    verificationDocumentUrl?: string;
    coverageRadiusKm?: number;
    bookingMode?: string;
}
