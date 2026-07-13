// @ts-nocheck
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsString()
  @IsNotEmpty()
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
}

export class CancelBookingDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

