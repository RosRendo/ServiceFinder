// @ts-nocheck
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyResetDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

