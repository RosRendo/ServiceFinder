import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  UpdateBookingStatusDto,
  AssignStaffDto,
  UpdateProgressDto,
  CancelBookingDto,
  RescheduleBookingDto,
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
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.getAllBookings(query, user);
  }

  @Get('my-assignments')
  @ApiOperation({ summary: 'Get bookings assigned to the current staff user' })
  @ApiResponse({ status: 200, description: 'Return assigned bookings.' })
  getMyAssignedBookings(@Request() req, @Query() query: any) {
    return this.bookingsService.getMyAssignedBookings(
      BigInt(req.user?.id || req.user?.userId || 0),
      query,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Return booking details.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  getBookingById(@Param('id') id: string, @Request() req) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.getBookingById(BigInt(id), user);
  }

  @Post()
  @Roles('customer', 'company_admin', 'admin')
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking successfully created.' })
  createBooking(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.createBooking(createBookingDto, user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'company_admin', 'staff')
  @ApiOperation({ summary: 'Update booking status (Admin/Company Admin)' })
  @ApiResponse({
    status: 200,
    description: 'The booking status has been successfully updated.',
  })
  updateBookingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @Request() req,
  ) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.updateBookingStatus(
      BigInt(id),
      dto.status,
      user,
    );
  }

  @Patch(':id/assign-staff')
  @UseGuards(RolesGuard)
  @Roles('admin', 'company_admin', 'staff')
  @ApiOperation({ summary: 'Assign staff to booking (Admin/Company Admin)' })
  @ApiResponse({ status: 200, description: 'Staff successfully assigned.' })
  assignStaff(
    @Param('id') id: string,
    @Body() dto: AssignStaffDto,
    @Request() req,
  ) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.assignStaff(BigInt(id), dto.staffId, user);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept a job assignment (Assigned staff only)' })
  @ApiResponse({
    status: 200,
    description: 'Job assignment successfully accepted.',
  })
  acceptAssignment(@Param('id') id: string, @Request() req) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.acceptAssignment(BigInt(id), BigInt(user.id));
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a job assignment (Assigned staff only)' })
  @ApiResponse({
    status: 200,
    description: 'Job assignment successfully rejected.',
  })
  rejectAssignment(@Param('id') id: string, @Request() req) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.rejectAssignment(BigInt(id), BigInt(user.id));
  }

  @Patch(':id/claim')
  @ApiOperation({
    summary:
      'Claim an unassigned booking from the company pool (Open Pool mode, Staff only)',
  })
  @ApiResponse({ status: 200, description: 'Booking successfully claimed.' })
  claimBooking(@Param('id') id: string, @Request() req) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.claimBooking(BigInt(id), BigInt(user.id));
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start a job (Assigned staff only)' })
  @ApiResponse({ status: 200, description: 'Job successfully started.' })
  startJob(@Param('id') id: string, @Body() body: any, @Request() req) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.startJob(
      BigInt(id),
      BigInt(user.id),
      body?.staffStartLatitude,
      body?.staffStartLongitude,
    );
  }

  @Patch(':id/arrive')
  @ApiOperation({
    summary: 'Staff reports arrival at job location (Assigned staff only)',
  })
  @ApiResponse({ status: 200, description: 'Staff successfully arrived.' })
  arriveJob(@Param('id') id: string, @Request() req) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.arriveJob(BigInt(id), BigInt(user.id));
  }

  @Patch(':id/en-route')
  @ApiOperation({
    summary:
      'Staff marks themselves as en route to job site (Assigned staff only)',
  })
  @ApiResponse({ status: 200, description: 'Status updated to en_route.' })
  enRouteJob(@Param('id') id: string, @Request() req) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.enRouteJob(BigInt(id), BigInt(user.id));
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Update job progress (Assigned staff only)' })
  @ApiResponse({
    status: 200,
    description: 'Job progress successfully updated.',
  })
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @Request() req,
  ) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.updateProgress(
      BigInt(id),
      BigInt(user.id),
      dto.progressPercent,
      dto.staffNotes,
      dto.checklist,
    );
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a job (Assigned staff only)' })
  @ApiResponse({ status: 200, description: 'Job successfully completed.' })
  completeJob(@Param('id') id: string, @Body() body: any, @Request() req) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.completeJob(
      BigInt(id),
      BigInt(user.id),
      body?.proofOfWorkPhoto,
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking successfully canceled.' })
  cancelBooking(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @Request() req,
  ) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.cancelBooking(BigInt(id), dto.reason, user);
  }

  @Post(':id/reschedule')
  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a booking' })
  @ApiResponse({ status: 200, description: 'Booking successfully rescheduled.' })
  rescheduleBooking(
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto,
    @Request() req,
  ) {
    const user = { ...req.user, id: req.user?.id || req.user?.userId || 0 };
    return this.bookingsService.rescheduleBooking(BigInt(id), dto, user);
  }

  @Post('photos')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload before/after evidence photos for a booking',
  })
  @ApiResponse({ status: 201, description: 'Photo uploaded successfully.' })
  async uploadBookingPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('bookingId') bookingIdStr: string,
    @Body('photoType') photoType: 'before' | 'during' | 'after',
    @Request() req,
  ) {
    const bookingId = BigInt(bookingIdStr);
    return this.bookingsService.uploadBookingPhoto(
      bookingId,
      file,
      photoType,
      req.user,
    );
  }
}
