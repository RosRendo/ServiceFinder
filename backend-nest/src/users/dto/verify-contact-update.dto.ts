import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class VerifyContactUpdateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(['email', 'phone'])
  type: 'email' | 'phone';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}
