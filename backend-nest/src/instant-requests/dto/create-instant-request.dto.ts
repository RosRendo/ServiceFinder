import { IsNotEmpty, IsString, IsNumber, IsEnum, Min } from 'class-validator';

export class CreateInstantRequestDto {
  @IsNotEmpty()
  @IsString()
  serviceCategory: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(['now', 'later'])
  preferredTime: string;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  companyId?: string;
}
