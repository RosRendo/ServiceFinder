import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  companyRating: number;

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
