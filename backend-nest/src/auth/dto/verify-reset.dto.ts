import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyResetDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
