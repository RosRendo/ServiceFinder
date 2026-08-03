import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

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

  @IsString()
  @IsOptional()
  latitude?: string;

  @IsString()
  @IsOptional()
  longitude?: string;

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
