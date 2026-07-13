import { IsString, IsOptional } from 'class-validator';

export class StartConversationDto {
  @IsString()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  targetUserId?: string;
}
