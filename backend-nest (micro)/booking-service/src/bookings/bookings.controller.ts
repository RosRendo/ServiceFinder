// @ts-nocheck
import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  UpdateBookingStatusDto, AssignStaffDto,
  UpdateProgressDto, CancelBookingDto,
} from './dto/booking-actions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, description: 'Return all bookings.' })
  getAllBookings(@Query() query: any, @Request() req) {
    return this.bookingsService.getAllBookings(query, req.user);
  }

  @Get('my-assignments')
  @ApiOperation({ summary: 'Get bookings assigned to the current staff user' })
  @ApiResponse({ status: 200, description: 'Return assigned bookings.' })
  getMyAssignedBookings(@Request() req, @Query() query: any) {
    return this.bookingsService.getMyAssignedBookings(BigInt(req.user.id), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Return booking details.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  getBookingById(@Param('id') id: string, @Request() req) {
    return this.bookingsService.getBookingById(BigInt(id), req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'The booking has been successfully created.' })
  createBooking(@Body() dto: CreateBookingDto, @Request() req) {
    return this.bookingsService.createBooking(dto, req.user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'company_admin')
  @ApiOperation({ summary: 'Update booking status (Admin/Company Admin)' })
  @ApiResponse({ status: 200, description: 'The booking status has been successfully updated.' })
  updateBookingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @Request() req,
  ) {
    return this.bookingsService.updateBookingStatus(BigInt(id), dto.status, req.user);
  }

  @Patch(':id/assign-staff')
  @UseGuards(RolesGuard)
  @Roles('admin', 'company_admin')
  @ApiOperation({ summary: 'Assign staff to booking (Admin/Company Admin)' })
  @ApiResponse({ status: 200, description: 'Staff successfully assigned.' })
  assignStaff(@Param('id') id: string, @Body() dto: AssignStaffDto, @Request() req) {
    return this.bookingsService.assignStaff(BigInt(id), dto.staffId, req.user);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start a job (Assigned staff only)' })
  @ApiResponse({ status: 200, description: 'Job successfully started.' })
  startJob(@Param('id') id: string, @Request() req) {
    return this.bookingsService.startJob(BigInt(id), BigInt(req.user.id));
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Update job progress (Assigned staff only)' })
  @ApiResponse({ status: 200, description: 'Job progress successfully updated.' })
  updateProgress(@Param('id') id: string, @Body() dto: UpdateProgressDto, @Request() req) {
    return this.bookingsService.updateProgress(BigInt(id), BigInt(req.user.id), dto.progressPercent, dto.staffNotes);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a job (Assigned staff only)' })
  @ApiResponse({ status: 200, description: 'Job successfully completed.' })
  completeJob(@Param('id') id: string, @Request() req) {
    return this.bookingsService.completeJob(BigInt(id), BigInt(req.user.id));
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking successfully canceled.' })
  cancelBooking(@Param('id') id: string, @Body() dto: CancelBookingDto, @Request() req) {
    return this.bookingsService.cancelBooking(BigInt(id), dto.reason, req.user);
  }
}

