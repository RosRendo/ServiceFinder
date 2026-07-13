// @ts-nocheck
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { IsStrongPasswordCustom } from '../../common/validators/is-strong-password.validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsStrongPasswordCustom()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

