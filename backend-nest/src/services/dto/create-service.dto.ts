import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  serviceTypeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  basePrice: number;

  @IsNumber()
  @IsNotEmpty()
  durationMin: number;

  @IsNumber()
  @IsNotEmpty()
  durationMax: number;

  @IsOptional()
  features?: any;

  @IsString()
  @IsOptional()
  image?: string;

  @IsOptional()
  checklist?: any;
}
