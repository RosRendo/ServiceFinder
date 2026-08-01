import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  id?: string;

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
}

export class UpdateCompanyAdminDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  verificationStatus?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
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
  verificationDocumentUrl?: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  establishedYear?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  cardHighlights?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  detailHighlights?: string[];

  // --- Services ---
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateServiceDto)
  services?: UpdateServiceDto[];
}
