// @ts-nocheck
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsStrongPasswordCustom } from '../../common/validators/is-strong-password.validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsStrongPasswordCustom()
  password: string;

  @IsString()
  @IsOptional()
  role?: string;
}

