import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePricingRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(6)
  @Type(() => Number)
  dayOfWeek?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(23)
  @Type(() => Number)
  startHour?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(24)
  @Type(() => Number)
  endHour?: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  surchargePercent: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
