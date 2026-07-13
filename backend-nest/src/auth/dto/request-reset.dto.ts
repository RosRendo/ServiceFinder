import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RequestResetDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
