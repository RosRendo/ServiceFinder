import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  IsNumber,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InitialServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  typeId: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  basePrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  durationMin?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  checklist?: string[];
}

export class CreateCompanyAdminDto {
  // --- User Details ---
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  ownerPassword: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

  // --- Company Details ---
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsOptional()
  companyDescription?: string;

  @IsString()
  @IsOptional()
  companyAddress?: string;

  @IsString()
  @IsOptional()
  companyCity?: string;

  @IsString()
  @IsOptional()
  companyPhone?: string;

  @IsString()
  @IsOptional()
  companyEmail?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  verificationDocumentUrl?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  establishedYear?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  cardHighlights?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  detailHighlights?: string[];

  // --- Initial Service Details ---
  @IsString()
  @IsOptional()
  serviceName?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  serviceTypeId?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  serviceBasePrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  serviceDurationMin?: number;

  @IsString()
  @IsOptional()
  serviceDescription?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isInsured?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  coverageRadiusKm?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InitialServiceDto)
  @IsOptional()
  services?: InitialServiceDto[];
}
