import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  discountPercent: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  maxUses?: number;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
