import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ALL_VALID_TARGET_STATUSES } from '../../common/status-transitions.util';

export class UpdateBookingStatusDto {
  @IsString()
  @IsIn(ALL_VALID_TARGET_STATUSES)
  status: string;
}

export class AssignStaffDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;
}

export class UpdateProgressDto {
  @IsNotEmpty()
  progressPercent: number;

  @IsString()
  @IsOptional()
  staffNotes?: string;

  @IsOptional()
  checklist?: any;
}

export class CancelBookingDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class RescheduleBookingDto {
  @IsString()
  @IsNotEmpty()
  newDate: string;

  @IsString()
  @IsNotEmpty()
  newTime: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
