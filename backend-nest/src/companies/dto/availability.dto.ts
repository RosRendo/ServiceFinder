import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsBoolean, IsOptional, IsArray, IsNumber } from 'class-validator';

export class AddAvailabilityDto {
  @ApiProperty({ description: 'Date of availability', example: '2026-07-01' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Start time', example: '1970-01-01T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End time', example: '1970-01-01T17:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ description: 'Is the staff available on this date?', default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}

export class GenerateAvailabilityDto {
  @ApiProperty({ description: 'Start date', example: '2026-07-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End date', example: '2026-07-31' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ description: 'Start time each day', example: '1970-01-01T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End time each day', example: '1970-01-01T17:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ description: 'Array of days to skip (0=Sun, 1=Mon, etc.)', example: [0, 6] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  daysOff?: number[];
}
