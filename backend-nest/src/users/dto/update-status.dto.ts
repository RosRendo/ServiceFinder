import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsEnum(['active', 'suspended', 'inactive'])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
