import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsStrongPasswordCustom } from '../../common/validators/is-strong-password.validator';

export class ResetPasswordDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsStrongPasswordCustom()
  newPassword: string;
}
