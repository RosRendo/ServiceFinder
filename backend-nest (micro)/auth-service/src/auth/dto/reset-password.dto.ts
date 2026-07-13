// @ts-nocheck
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPasswordCustom } from '../../common/validators/is-strong-password.validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsStrongPasswordCustom()
  newPassword: string;
}

