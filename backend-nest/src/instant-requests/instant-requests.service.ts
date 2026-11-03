import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstantRequestDto } from './dto/create-instant-request.dto';
import { CreateInstantRequestBidDto } from './dto/create-instant-request-bid.dto';
import { InstantRequestsGateway } from './instant-requests.gateway';
import { NotificationsService } from '../notifications/notifications.service';

interface Candidate {
  id: bigint;
  name: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
  rating: number;
}

export interface MatchedPayload {
  bookingId: string;
  companyId: string;
  companyName: string;
  rating: number;
  etaMinutes: number;
  distanceKm: number | null;
  totalPrice: number;
  companyLatitude: number | null;
  companyLongitude: number | null;
}

@Injectable()
export class InstantRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: InstantRequestsGateway,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Customer submits an instant request.
   * Grab-style dispatch: the server picks ONE company — the nearest verified
   * company offering the requested category — and instantly creates a
   * confirmed Booking with the customer's exact problem description in
   * customerNotes. If the winning company declines, the next nearest
   * candidate is matched (see decline()).
   */
  async create(customerId: bigint, dto: CreateInstantRequestDto) {
    const request = await this.prisma.instantRequest.create({
      data: {
        customerId,
        serviceCategory: dto.serviceCategory,
        description: dto.description,
        preferredTime: dto.preferredTime,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    // 1. Build ordered candidate list (nearest first)
    const candidates = dto.companyId
      ? await this.buildTargetCandidates(BigInt(dto.companyId))
      : await this.computeCandidates(
          dto.serviceCategory,
          dto.preferredTime,
          dto.latitude,
          dto.longitude,
          [],
        );

    await this.prisma.instantRequest.update({
      where: { id: request.id },
      data: { candidates: candidates.map((c) => c.id.toString()) },
    });

    // 2. Auto-match the single nearest candidate (one winner, no bid race)
    let matched: MatchedPayload | null = null;
    if (candidates.length > 0) {
      try {
        matched = await this.matchToCompany(request, candidates[0]);
      } catch (e) {
        console.error('[InstantRequests] auto-match failed:', e);
      }
    }

    let updatedRequest = request;
    if (matched) {
      updatedRequest = await this.prisma.instantRequest.update({
        where: { id: request.id },
        data: {
          status: 'matched',
          matchedCompanyId: BigInt(matched.companyId),
          matchedBookingId: BigInt(matched.bookingId),
        },
      });
      this.gateway.broadcastMatch(request.id.toString(), {
        bookingId: matched.bookingId,
        companyName: matched.companyName,
        price: matched.totalPrice.toString(),
        status: 'confirmed',
        reassigned: false,
      });
    } else {
      // No candidate could take it: fall back to open broadcasting so the
      // company feed / manual bids still work.
      this.gateway.broadcastNewRequest(this.serializeRequest(request));
    }

    return {
      request: this.serializeRequest(updatedRequest),
      matched,
      notifiedCompaniesCount: candidates.length,
      companiesList: candidates.slice(0, 5).map((c) => ({
        id: c.id.toString(),
        name: c.name,
        latitude: c.latitude,
        longitude: c.longitude,
      })),
    };
  }

  /**
   * Ordered candidate list: verified companies offering the category inside
   * the coverage radius, sorted ascending by Haversine distance. When every
   * nearby candidate is exhausted, falls back to any verified company so a
   * request never dies silently.
   */
  private async computeCandidates(
    serviceCategory: string,
    preferredTime: string,
    latitude: number,
    longitude: number,
    excludeIds: bigint[],
  ): Promise<Candidate[]> {
    const maxRadius = preferredTime === 'now' ? 5.0 : 20.0; // ASAP is 5km, scheduled is 20km
    const latDiff = maxRadius / 111.12;
    const lngDiff = maxRadius / 108.0;

    const toCandidate = (company: any): Candidate => ({
      id: company.id,
      name: company.name,
      latitude: company.latitude != null ? Number(company.latitude) : null,
      longitude: company.longitude != null ? Number(company.longitude) : null,
      distanceKm:
        company.latitude != null && company.longitude != null
          ? this.calculateDistance(
              latitude,
              longitude,
              Number(company.latitude),
              Number(company.longitude),
            )
          : Number.MAX_SAFE_INTEGER,
      rating: company.ratingSummary
        ? Number(company.ratingSummary.averageRating)
        : 4.8,
    });

    const nearby = await this.prisma.company.findMany({
      where: {
        verificationStatus: 'verified',
        latitude: { gte: latitude - latDiff, lte: latitude + latDiff },
        longitude: { gte: longitude - lngDiff, lte: longitude + lngDiff },
        services: {
          some: {
            isActive: true,
            serviceType: {
              category: {
                name: { mode: 'insensitive', equals: serviceCategory },
              },
            },
          },
        },
      },
      include: { ratingSummary: true },
    });

    let candidates = nearby
      .filter((c) => {
        if (!c.latitude || !c.longitude) return false;
        return (
          this.calculateDistance(
            latitude,
            longitude,
            Number(c.latitude),
            Number(c.longitude),
          ) <= maxRadius
        );
      })
      .map(toCandidate);

    if (candidates.length === 0) {
      // Fallback: any verified company offering the category, nearest first
      const wider = await this.prisma.company.findMany({
        where: {
          verificationStatus: 'verified',
          services: {
            some: {
              isActive: true,
              serviceType: {
                category: {
                  name: { mode: 'insensitive', equals: serviceCategory },
                },
              },
            },
          },
        },
        include: { ratingSummary: true },
        take: 20,
      });
      candidates = wider.map(toCandidate);
    }

    if (candidates.length === 0) {
      // Absolute fallback: any verified company
      const fallback = await this.prisma.company.findMany({
        where: { verificationStatus: 'verified' },
        include: { ratingSummary: true },
        take: 5,
      });
      candidates = fallback.map(toCandidate);
    }

    return candidates
      .filter((c) => !excludeIds.some((ex) => ex === c.id))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /** Targeted request ("Book Now" on a specific company's pin) */
  private async buildTargetCandidates(companyId: bigint): Promise<Candidate[]> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { ratingSummary: true },
    });
    if (!company) return [];
    return [
      {
        id: company.id,
        name: company.name,
        latitude: company.latitude != null ? Number(company.latitude) : null,
        longitude: company.longitude != null ? Number(company.longitude) : null,
        distanceKm: 0,
        rating: company.ratingSummary
          ? Number(company.ratingSummary.averageRating)
          : 4.8,
      },
    ];
  }

  /**
   * Create the confirmed Booking for the winning company and record the
   * "auto-bid" so the bid history keeps working.
   */
  private async matchToCompany(
    request: any,
    candidate: Candidate,
  ): Promise<MatchedPayload> {
    const company = await this.prisma.company.findUnique({
      where: { id: candidate.id },
      include: { ratingSummary: true, owner: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const service =
      (await this.prisma.service.findFirst({
        where: {
          companyId: company.id,
          isActive: true,
          serviceType: {
            category: {
              name: { mode: 'insensitive', equals: request.serviceCategory },
            },
          },
        },
        orderBy: { basePrice: 'asc' },
      })) ??
      (await this.prisma.service.findFirst({
        where: { companyId: company.id, isActive: true },
      }));

    // ETA from real road distance: ~18km/h city average + fixed prep time,
    // clamped to the ASAP guardrail (25 min max).
    const etaMinutes = Math.min(
      25,
      Math.max(
        6,
        Math.ceil(
          ((candidate.distanceKm === Number.MAX_SAFE_INTEGER
            ? 3
            : candidate.distanceKm) *
            60) /
            18,
        ) + 5,
      ),
    );
    const totalPrice = Number(service?.basePrice ?? 25);

    const startTime = new Date(Date.now() + etaMinutes * 60000);
    startTime.setSeconds(0, 0);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

    const booking = await this.prisma.booking.create({
      data: {
        customerId: request.customerId,
        companyId: company.id,
        serviceId: service?.id || BigInt(1),
        status: 'confirmed',
        totalPrice,
        platformFee: totalPrice * 0.15,
        companyEarnings: totalPrice * 0.85,
        bookingDate: startTime,
        startTime,
        endTime,
        serviceAddress: 'Instant dispatch — customer location',
        latitude: request.latitude,
        longitude: request.longitude,
        customerNotes: request.description,
      },
      include: { company: true },
    });

    // Record the winning "auto-bid" for history/audit
    await this.prisma.instantRequestBid.create({
      data: {
        requestId: request.id,
        companyId: company.id,
        priceEstimate: totalPrice,
        etaMinutes,
        status: 'selected',
      },
    });

    // Notify the customer + the winning company owner (DB + push + email)
    await this.notifications
      .notifyBookingCreated(
        request.customerId,
        company.ownerId,
        `${request.serviceCategory} (Instant)`,
        booking.id.toString(),
      )
      .catch((e) => console.error('[InstantRequests] notify failed:', e));

    return {
      bookingId: booking.id.toString(),
      companyId: company.id.toString(),
      companyName: company.name,
      rating: company.ratingSummary
        ? Number(company.ratingSummary.averageRating)
        : 4.8,
      etaMinutes,
      distanceKm:
        candidate.distanceKm === Number.MAX_SAFE_INTEGER
          ? null
          : candidate.distanceKm,
      totalPrice,
      companyLatitude: candidate.latitude,
      companyLongitude: candidate.longitude,
    };
  }

  /**
   * Winning company declines the auto-assigned job. The system immediately
   * re-matches the NEXT nearest candidate (Grab-style fallback loop). Only
   * when every candidate is exhausted does the request go back to open
   * broadcasting.
   */
  async decline(requestId: bigint, userId: bigint) {
    const companyId = await this.resolveCompanyId(userId);
    const request = await this.prisma.instantRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Instant request not found');
    if (request.status !== 'matched') {
      throw new BadRequestException('Request is not in a matched state');
    }
    if (request.matchedCompanyId !== companyId) {
      throw new ForbiddenException('This job is not assigned to your company');
    }

    // Mark the bid declined and open the request back up
    await this.prisma.$transaction([
      this.prisma.instantRequestBid.updateMany({
        where: { requestId, companyId, status: 'selected' },
        data: { status: 'declined' },
      }),
      this.prisma.instantRequest.update({
        where: { id: requestId },
        data: {
          status: 'searching',
          matchedCompanyId: null,
          matchedBookingId: null,
        },
      }),
    ]);

    // Next nearest candidate
    const excludeIds: bigint[] = [];
    if (Array.isArray(request.candidates)) {
      for (const raw of request.candidates as unknown[]) {
        try {
          excludeIds.push(BigInt(String(raw)));
        } catch {
          /* ignore malformed entries */
        }
      }
    }
    excludeIds.push(companyId);

    const remainingCandidates = await this.computeCandidates(
      request.serviceCategory,
      request.preferredTime,
      Number(request.latitude),
      Number(request.longitude),
      excludeIds,
    );

    let matched: MatchedPayload | null = null;
    if (remainingCandidates.length > 0) {
      const nextRequest = await this.prisma.instantRequest.findUnique({
        where: { id: requestId },
      });
      try {
        matched = await this.matchToCompany(
          nextRequest!,
          remainingCandidates[0],
        );
        await this.prisma.instantRequest.update({
          where: { id: requestId },
          data: {
            status: 'matched',
            matchedCompanyId: BigInt(matched.companyId),
            matchedBookingId: BigInt(matched.bookingId),
            candidates: Array.isArray(request.candidates)
              ? (request.candidates as string[]).concat(matched.companyId)
              : [matched.companyId],
          },
        });
        this.gateway.broadcastMatch(requestId.toString(), {
          bookingId: matched.bookingId,
          companyName: matched.companyName,
          price: matched.totalPrice.toString(),
          status: 'confirmed',
          reassigned: true,
        });
      } catch (e) {
        console.error('[InstantRequests] reassign failed:', e);
      }
    }

    if (!matched) {
      // No candidate left: open broadcast so feed/manual bids can still work
      const refreshed = await this.prisma.instantRequest.findUnique({
        where: { id: requestId },
      });
      this.gateway.broadcastNewRequest(this.serializeRequest(refreshed!));
    }

    return {
      declined: true,
      reassigned: Boolean(matched),
      matched,
    };
  }

  /** Customer (or company) polls the current match state, socket-free fallback */
  async getStatus(requestId: bigint, customerId: bigint) {
    const request = await this.prisma.instantRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Instant request not found');
    if (request.customerId !== customerId) {
      throw new ForbiddenException('Not your request');
    }

    let matched: MatchedPayload | null = null;
    if (request.matchedCompanyId && request.matchedBookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: request.matchedBookingId },
        include: { company: { include: { ratingSummary: true } } },
      });
      if (booking) {
        matched = {
          bookingId: booking.id.toString(),
          companyId: booking.companyId.toString(),
          companyName: booking.company.name,
          rating: booking.company.ratingSummary
            ? Number(booking.company.ratingSummary.averageRating)
            : 4.8,
          etaMinutes: 0,
          distanceKm: null,
          totalPrice: Number(booking.totalPrice),
          companyLatitude:
            booking.company.latitude != null
              ? Number(booking.company.latitude)
              : null,
          companyLongitude:
            booking.company.longitude != null
              ? Number(booking.company.longitude)
              : null,
        };
      }
    }

    return { request: this.serializeRequest(request), matched };
  }

  async submitBid(
    companyId: bigint,
    requestId: bigint,
    dto: CreateInstantRequestBidDto,
  ) {
    const request = await this.prisma.instantRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Instant request not found');
    }

    if (request.status !== 'searching') {
      throw new BadRequestException('Request is no longer active for bidding');
    }

    // ASAP Guardrail Check: Block bids with ETA > 25 minutes
    if (request.preferredTime === 'now' && dto.etaMinutes > 25) {
      throw new BadRequestException(
        'This request requires ASAP assistance. Bids with ETAs exceeding 25 minutes are blocked.',
      );
    }

    // Save bid to Database
    const bid = await this.prisma.instantRequestBid.create({
      data: {
        requestId,
        companyId,
        priceEstimate: dto.priceEstimate,
        etaMinutes: dto.etaMinutes,
      },
      include: {
        company: {
          include: {
            ratingSummary: true,
          },
        },
      },
    });

    // Serialize bid details
    const serializedBid = {
      id: bid.id.toString(),
      requestId: bid.requestId.toString(),
      companyId: bid.companyId.toString(),
      companyName: bid.company.name,
      rating: bid.company.ratingSummary
        ? Number(bid.company.ratingSummary.averageRating)
        : 4.8,
      priceEstimate: `$${bid.priceEstimate}`,
      eta: `${bid.etaMinutes} min`,
    };

    // Broadcast bid to customer over websocket in real time
    this.gateway.broadcastBid(requestId.toString(), serializedBid);

    return serializedBid;
  }

  async selectBid(customerId: bigint, requestId: bigint, bidId: bigint) {
    const request = await this.prisma.instantRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Instant request not found');
    }

    if (request.customerId.toString() !== customerId.toString()) {
      throw new ForbiddenException('You do not own this request');
    }

    const bid = await this.prisma.instantRequestBid.findUnique({
      where: { id: bidId },
      include: { company: true },
    });

    if (!bid || bid.requestId.toString() !== requestId.toString()) {
      throw new NotFoundException('Selected bid not found for this request');
    }

    // Transaction to update request, selected bid, and create standard Booking
    const booking = await this.prisma.$transaction(async (tx) => {
      // 1. Update request status
      await tx.instantRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      });

      // 2. Select this bid
      await tx.instantRequestBid.update({
        where: { id: bidId },
        data: { status: 'selected' },
      });

      // Decline other bids
      await tx.instantRequestBid.updateMany({
        where: {
          requestId,
          id: { not: bidId },
        },
        data: { status: 'declined' },
      });

      // Get first service matching this category for the company to bind booking correctly
      const service = await tx.service.findFirst({
        where: {
          companyId: bid.companyId,
          serviceType: {
            category: {
              name: {
                mode: 'insensitive',
                equals: request.serviceCategory,
              },
            },
          },
        },
      });

      // 3. Create normal Booking record so standard flows work
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

      const totalPrice = bid.priceEstimate;
      const platformFee = Number(totalPrice) * 0.15;
      const companyEarnings = Number(totalPrice) * 0.85;

      return tx.booking.create({
        data: {
          customerId,
          companyId: bid.companyId,
          serviceId: service?.id || BigInt(1), // Fallback if mismatch
          status: 'confirmed',
          totalPrice,
          platformFee,
          companyEarnings,
          bookingDate: startTime,
          startTime,
          endTime,
          serviceAddress: 'Instant Request Location',
          latitude: request.latitude,
          longitude: request.longitude,
          customerNotes: request.description,
        },
        include: {
          company: true,
        },
      });
    });

    const matchPayload = {
      bookingId: booking.id.toString(),
      companyName: booking.company.name,
      price: booking.totalPrice.toString(),
      status: booking.status,
    };

    // Broadcast confirmed match
    this.gateway.broadcastMatch(requestId.toString(), matchPayload);

    return matchPayload;
  }

  async getRequestBids(requestId: bigint) {
    const bids = await this.prisma.instantRequestBid.findMany({
      where: { requestId },
      include: {
        company: {
          include: {
            ratingSummary: true,
          },
        },
      },
      orderBy: { etaMinutes: 'asc' },
    });

    return bids.map((b) => ({
      id: b.id.toString(),
      companyName: b.company.name,
      rating: b.company.ratingSummary
        ? Number(b.company.ratingSummary.averageRating)
        : 4.8,
      priceEstimate: `$${b.priceEstimate}`,
      eta: `${b.etaMinutes} min`,
      distance: `${(b.etaMinutes * 0.25).toFixed(1)} km`,
    }));
  }

  // Haversine formula calculation
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async resolveCompanyId(userId: bigint): Promise<bigint> {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (company) return company.id;

    const staff = await this.prisma.companyStaff.findFirst({
      where: { userId },
    });
    if (staff) return staff.companyId;

    // Fallback to first verified company for seamless dev testing
    const fallback = await this.prisma.company.findFirst({
      where: { verificationStatus: 'verified' },
    });
    return fallback?.id || BigInt(1);
  }

  async getCompanyFeed(userId: bigint) {
    const companyId = await this.resolveCompanyId(userId);

    const activeRequests = await this.prisma.instantRequest.findMany({
      where: {
        status: 'searching',
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            phone: true,
          },
        },
        bids: {
          where: { companyId },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return activeRequests.map((req) => {
      const myBid = req.bids.length > 0 ? req.bids[0] : null;
      return {
        id: req.id.toString(),
        serviceCategory: req.serviceCategory,
        description: req.description,
        preferredTime: req.preferredTime,
        latitude: Number(req.latitude),
        longitude: Number(req.longitude),
        createdAt: req.createdAt,
        customerName: req.customer?.fullName || 'Customer',
        customerAvatar: req.customer?.avatar || null,
        status: req.status,
        myBid: myBid
          ? {
              id: myBid.id.toString(),
              priceEstimate: Number(myBid.priceEstimate),
              etaMinutes: myBid.etaMinutes,
              status: myBid.status,
            }
          : null,
      };
    });
  }

  private serializeRequest(req: any) {
    return {
      ...req,
      id: req.id.toString(),
      customerId: req.customerId.toString(),
      latitude: Number(req.latitude),
      longitude: Number(req.longitude),
    };
  }
}
