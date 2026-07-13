import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { LocationGateway } from './location.gateway';

interface LocationEntry {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  updatedAt: Date;
}

// In-memory store: bookingId → location
const locationStore = new Map<string, LocationEntry>();

@ApiTags('Location')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('location')
export class LocationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationGateway: LocationGateway,
  ) {}

  /** Staff pushes their current GPS position */
  @Patch(':bookingId')
  @ApiOperation({ summary: 'Staff updates their live location for a booking' })
  async updateLocation(
    @Param('bookingId') bookingId: string,
    @Body()
    body: { lat: number; lng: number; accuracy?: number; heading?: number },
    @CurrentUser() user: any,
  ) {
    // Verify this staff is assigned to this booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
      include: { assignedStaff: { include: { user: true } } },
    });
    if (!booking) throw new ForbiddenException('Booking not found');

    const isAssigned = booking.assignedStaff?.userId === BigInt(user.id);
    const isAdmin = user.role === 'admin';
    if (!isAssigned && !isAdmin)
      throw new ForbiddenException('Not assigned to this booking');

    locationStore.set(bookingId, {
      lat: body.lat,
      lng: body.lng,
      accuracy: body.accuracy,
      heading: body.heading,
      updatedAt: new Date(),
    });

    // Also broadcast in real-time to active WebSocket clients listening to this booking
    this.locationGateway.server
      .to(`booking_${bookingId}`)
      .emit('staff_location_updated', {
        latitude: body.lat,
        longitude: body.lng,
        accuracy: body.accuracy,
        heading: body.heading,
      });

    return { success: true, message: 'Location updated' };
  }

  /** Customer / anyone with booking access fetches staff current location */
  @Get(':bookingId')
  @ApiOperation({ summary: 'Get staff live location for a booking' })
  async getLocation(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    // Allow: booking's customer, assigned staff, company admin, admin
    const booking = await this.prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
      select: {
        customerId: true,
        assignedStaff: { select: { userId: true } },
        company: { select: { ownerId: true } },
        serviceAddress: true,
        latitude: true,
        longitude: true,
        status: true,
      },
    });
    if (!booking) throw new ForbiddenException('Booking not found');

    const uid = BigInt(user.id);
    const allowed =
      booking.customerId === uid ||
      booking.assignedStaff?.userId === uid ||
      booking.company.ownerId === uid ||
      user.role === 'admin';
    if (!allowed) throw new ForbiddenException('Access denied');

    const entry = locationStore.get(bookingId) ?? null;
    const stale = entry && Date.now() - entry.updatedAt.getTime() > 60_000; // > 1 min = offline

    return {
      success: true,
      data: {
        staffLocation: entry && !stale ? entry : null,
        isOnline: !!entry && !stale,
        serviceAddress: booking.serviceAddress,
        serviceLat: booking.latitude ? Number(booking.latitude) : null,
        serviceLng: booking.longitude ? Number(booking.longitude) : null,
        bookingStatus: booking.status,
        lastSeen: entry?.updatedAt ?? null,
      },
    };
  }
}
