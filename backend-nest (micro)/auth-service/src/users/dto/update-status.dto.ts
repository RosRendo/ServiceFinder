// @ts-nocheck
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsEnum(['active', 'suspended', 'pending'])
  status: string;
}

