// @ts-nocheck
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  companyRating?: number;

  @IsString()
  @IsOptional()
  companyComment?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  staffRating?: number;

  @IsString()
  @IsOptional()
  staffComment?: string;
}

