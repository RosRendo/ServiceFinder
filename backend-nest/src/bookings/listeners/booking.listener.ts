import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../../prisma/prisma.service";
import { ConversationsService } from "../../conversations/conversations.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { SettingsService } from "../../settings/settings.service";
import {
  BookingAssignedEvent,
  BookingAcceptedEvent,
  BookingRejectedEvent,
  BookingCompletedEvent,
  DisputeOpenedEvent,
  BookingStatusChangedEvent,
} from "../events/booking.events";

@Injectable()
export class BookingListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
  ) {}

  @OnEvent("booking.assigned")
  async handleBookingAssigned(event: BookingAssignedEvent) {
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: event.staffId },
      include: { user: true },
    });
    if (!staff) return;

    await this.notificationsService
      .createNotification(
        staff.userId,
        "new_assignment",
        "New Job Assignment",
        `You have been assigned to a new booking. Please accept or reject it.`,
        { bookingId: event.bookingId.toString() },
      )
      .catch((e) => console.warn("Assigned notification failed:", e.message));
  }

  @OnEvent("booking.accepted")
  async handleBookingAccepted(event: BookingAcceptedEvent) {
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: event.staffId },
      include: { user: true },
    });
    if (!staff) return;

    await this.conversationsService
      .getOrCreateConversation(event.customerId, {
        type: "job",
        bookingId: event.bookingId.toString(),
      })
      .catch((e) => console.warn("Failed to auto-create job chat:", e.message));

    await this.notificationsService
      .createNotification(
        event.customerId,
        "staff_assigned",
        "Staff Accepted Your Job",
        `${staff.user.fullName} has accepted your booking and is preparing for service.`,
        { bookingId: event.bookingId.toString() },
      )
      .catch((e) => console.warn("Accepted notification failed:", e.message));
  }

  @OnEvent("booking.rejected")
  async handleBookingRejected(event: BookingRejectedEvent) {
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: event.staffId },
      include: { user: true },
    });
    if (!staff) return;

    const company = await this.prisma.company.findUnique({
      where: { id: event.companyId },
    });
    if (!company) return;

    await this.notificationsService
      .createNotification(
        company.ownerId,
        "assignment_rejected",
        "Assignment Rejected by Staff",
        `Staff member ${staff.user.fullName} has rejected the assignment for booking #${event.bookingId.toString()}. Job returned to dispatch queue.`,
        { bookingId: event.bookingId.toString() },
      )
      .catch((e) => console.warn("Rejected notification failed:", e.message));
  }

  @OnEvent("booking.completed")
  async handleBookingCompleted(event: BookingCompletedEvent) {
    const holdHours = await this.settingsService.getSettingNumber(
      "PAYOUT_HOLD_HOURS",
      72,
    );
    const archivedAt = new Date(Date.now() + holdHours * 60 * 60 * 1000);

    await this.prisma.conversation
      .updateMany({
        where: { bookingId: event.bookingId },
        data: { archivedAt },
      })
      .catch((e) => console.warn("Failed to schedule chat archival:", e.message));

    await this.notificationsService
      .createNotification(
        event.customerId,
        "job_completed",
        "Service Completed",
        `Your booking has been completed! Please rate your service.`,
        { bookingId: event.bookingId.toString() },
      )
      .catch((e) => console.warn("Completed notification failed:", e.message));
  }

  @OnEvent("dispute.opened")
  async handleDisputeOpened(event: DisputeOpenedEvent) {
    const company = await this.prisma.company.findUnique({
      where: { id: event.companyId },
    });
    if (!company) return;

    await this.notificationsService
      .createNotification(
        company.ownerId,
        "dispute_opened",
        "Dispute Opened",
        `A dispute has been opened for booking #${event.bookingId.toString()}. Payout frozen.`,
        { bookingId: event.bookingId.toString() },
      )
      .catch((e) => console.warn("Dispute notification failed:", e.message));
  }
}