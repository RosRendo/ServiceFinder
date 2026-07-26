import { IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}