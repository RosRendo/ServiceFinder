import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayoutRequestDto {
  @ApiProperty({ description: 'Amount to withdraw', example: 50.0 })
  @IsNumber()
  @Min(10)
  amount: number;

  @ApiProperty({ description: 'Destination Bank Name', example: 'ABA Bank' })
  @IsString()
  @IsNotEmpty()
  destinationBank: string;

  @ApiProperty({ description: 'Account Name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({ description: 'Account Number', example: '123456789' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}

export class ProcessPayoutDto {
  @ApiProperty({
    description: 'Status of the payout (paid or rejected)',
    example: 'paid',
  })
  @IsString()
  @IsNotEmpty()
  status: 'paid' | 'rejected';

  @ApiProperty({
    description: 'Optional admin notes',
    example: 'Processed via ABA',
  })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
