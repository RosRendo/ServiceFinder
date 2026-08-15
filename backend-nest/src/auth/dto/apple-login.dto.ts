import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AppleLoginDto {
  @ApiProperty({ description: 'The identity token from Apple' })
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ApiProperty({ description: 'The full name object from Apple (only on first login)' })
  @IsOptional()
  fullName?: {
    givenName?: string;
    familyName?: string;
  };

  @ApiProperty({ description: 'Role to assign if registering' })
  @IsOptional()
  @IsString()
  role?: string;
}
