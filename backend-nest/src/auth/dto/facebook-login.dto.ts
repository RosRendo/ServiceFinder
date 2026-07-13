import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FacebookLoginDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  role?: string;
}
