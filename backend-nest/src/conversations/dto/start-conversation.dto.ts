import { IsString, IsOptional, IsIn } from 'class-validator';

export class StartConversationDto {
  @IsString()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  targetUserId?: string;

  /**
   * 'support' — Customer <-> Company owner (always open, default)
   * 'job'     — Customer <-> Assigned Staff (lifecycle-bound to a booking)
   */
  @IsString()
  @IsOptional()
  @IsIn(['support', 'job'])
  type?: 'support' | 'job';

  /**
   * Required when type = 'job'. Links the conversation to a specific booking.
   */
  @IsString()
  @IsOptional()
  bookingId?: string;
}
