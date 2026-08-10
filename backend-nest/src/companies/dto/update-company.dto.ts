import { IsEmail, IsOptional, IsString, IsIn, IsNumber } from 'class-validator';

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  googleMapUrl?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  establishedYear?: string;

  @IsString()
  @IsOptional()
  verificationStatus?: 'pending' | 'verified' | 'rejected';

  @IsString()
  @IsOptional()
  verificationDocumentUrl?: string;

  @IsOptional()
  coverageRadiusKm?: number;

  @IsString()
  @IsOptional()
  @IsIn(['dispatch', 'open_pool'])
  bookingMode?: string;
}
