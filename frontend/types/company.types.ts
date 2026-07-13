import { Service } from "./service.types"


export type HighlightIcon = | "Shield" | "Star" | "UserCheck" | "ThumbsUp";

export interface Highlight {
  icon: HighlightIcon;
  label: string;
}

export interface CompanyOwner {
  id: string
  fullName: string
  email: string
  phone: string
}

export interface CompanyRatingSummary {
  companyId: string
  averageRating: string
  totalReviews: number
  lastUpdated: string
}

export interface CompanyCount {
  services: number
  bookings: number
}

export interface Company {
  id: string
  name: string
  description: string
  registrationNumber: string
  address: string
  city: string
  coordinates : {
    longitude: number
    latitude: number
  }
  phone: string
  email: string
  ownerId: string
  verified: boolean
  verificationStatus: 'pending' | 'verified' | 'rejected'
  logoUrl: string
  coverImageUrl: string
  establishedYear: number
  yearsInBusiness: number
  Highlights: Highlight[]
  employeeCount: number

  service: Service
  rating: number
  reviewCount: number
  location: string
  servicesCount: number
  responseTime: string
  priceRange : {
    min: number;
    max: number;
  };

  createdAt: string
  updatedAt: string

  owner: CompanyOwner
  ratingSummary: CompanyRatingSummary | null
  _count: CompanyCount
}

export interface CompaniesResponse {
  companies: Company[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}
