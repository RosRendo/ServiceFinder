import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDisputeDto {
  @ApiProperty({
    example: 'payment_issue',
    enum: ['payment_issue', 'quality_issue', 'safety', 'other'],
  })
  @IsString()
  @IsIn(['payment_issue', 'quality_issue', 'safety', 'other'])
  type: string;

  @ApiProperty({ example: 'The service was not completed as described.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  photos?: string[];
}

export class RespondToDisputeDto {
  @ApiProperty({ example: 'We apologize for the inconvenience...' })
  @IsString()
  @IsNotEmpty()
  response: string;
}

export class ResolveDisputeDto {
  @ApiProperty({
    example: 'accept_claim',
    enum: ['accept_claim', 'accept_company', 'mediation'],
  })
  @IsString()
  @IsIn(['accept_claim', 'accept_company', 'mediation'])
  decision: string;

  @ApiPropertyOptional({ example: 50.0 })
  @IsOptional()
  refundAmount?: number;
}
