import { IsNumber, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestStaffPayoutDto {
  @ApiProperty({ example: 50.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    example: 'bank_transfer',
    enum: ['bank_transfer', 'mobile_wallet', 'check'],
  })
  @IsIn(['bank_transfer', 'mobile_wallet', 'check'])
  method: string;
}
