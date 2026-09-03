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

@Injectable()
export class InstantRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: InstantRequestsGateway,
  ) {}

  async create(customerId: bigint, dto: CreateInstantRequestDto) {
    // 1. Create the Instant Request record
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

    // 2. Fetch companies offering services matching this category within coverage radius
    let finalMatched: any[] = [];

    if (dto.companyId) {
      const targetCompany = await this.prisma.company.findUnique({
        where: { id: BigInt(dto.companyId) },
      });
      if (targetCompany) {
        finalMatched = [targetCompany];
      }
    }

    if (finalMatched.length === 0) {
      const maxRadius = dto.preferredTime === 'now' ? 5.0 : 20.0; // ASAP is 5km, scheduled is 20km
      const latDiff = maxRadius / 111.12;
      const lngDiff = maxRadius / 108.0;

      const candidateCompanies = await this.prisma.company.findMany({
        where: {
          verificationStatus: 'verified',
          latitude: {
            gte: dto.latitude - latDiff,
            lte: dto.latitude + latDiff,
          },
          longitude: {
            gte: dto.longitude - lngDiff,
            lte: dto.longitude + lngDiff,
          },
          services: {
            some: {
              serviceType: {
                category: {
                  name: {
                    mode: 'insensitive',
                    equals: dto.serviceCategory,
                  },
                },
              },
            },
          },
        },
      });

      const matchedCompanies = candidateCompanies.filter((company) => {
        if (!company.latitude || !company.longitude) return false;
        const distance = this.calculateDistance(
          dto.latitude,
          dto.longitude,
          Number(company.latitude),
          Number(company.longitude),
        );
        return distance <= maxRadius;
      });

      finalMatched = [...matchedCompanies];

      if (finalMatched.length === 0) {
        const fallbackCompany = await this.prisma.company.findFirst({
          where: { verificationStatus: 'verified' },
        });
        if (fallbackCompany) {
          finalMatched.push(fallbackCompany);
        }
      }
    }

    // Clean JSON response
    const response = {
      request: this.serializeRequest(request),
      notifiedCompaniesCount: finalMatched.length,
      companiesList: finalMatched.map((c) => ({
        id: c.id.toString(),
        name: c.name,
        latitude: Number(c.latitude),
        longitude: Number(c.longitude),
      })),
    };

    // Auto-generate bids for matched companies
    if (finalMatched.length > 0) {
      const delay = dto.companyId ? 100 : 1500; // Immediate for 1-click targeted company
      setTimeout(() => {
        void (async () => {
          for (let i = 0; i < Math.min(3, finalMatched.length); i++) {
            const c = finalMatched[i];
            try {
              await this.submitBid(c.id, request.id, {
                priceEstimate: 25 + i * 5,
                etaMinutes: 8 + i * 3,
              });
            } catch (e) {
              console.error('Mock bid failed:', e);
            }
            // Delay between incoming bids to simulate real-world behavior
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        })();
      }, 2500); // Wait 2.5 seconds before starting mock bids
    }

    return response;
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
