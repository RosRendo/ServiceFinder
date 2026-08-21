import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  // Tolerate spaces/dashes/dots; must be a plausible international number.
  // (Server also normalizes + fully validates before any SMS is sent.)
  @Matches(/^\+?[0-9][0-9\s\-().]{6,18}$/, {
    message: 'phone must be a valid phone number, e.g. +85512345678',
  })
  phone: string;
}
