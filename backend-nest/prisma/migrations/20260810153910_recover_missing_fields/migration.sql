/*
  Warnings:

  - You are about to drop the column `stripe_account_id` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_account_status` on the `companies` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'assigned';
ALTER TYPE "BookingStatus" ADD VALUE 'arrived';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'unpaid';
ALTER TYPE "PaymentStatus" ADD VALUE 'processing';
ALTER TYPE "PaymentStatus" ADD VALUE 'escrow';
ALTER TYPE "PaymentStatus" ADD VALUE 'pending_release';
ALTER TYPE "PaymentStatus" ADD VALUE 'available';
ALTER TYPE "PaymentStatus" ADD VALUE 'withdrawn';
ALTER TYPE "PaymentStatus" ADD VALUE 'disputed';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "checklist" JSONB,
ADD COLUMN     "promo_code_id" BIGINT,
ADD COLUMN     "proof_of_work_photo" TEXT,
ADD COLUMN     "staff_start_latitude" DECIMAL(10,7),
ADD COLUMN     "staff_start_longitude" DECIMAL(10,7);

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "use_image_as_badge" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "stripe_account_id",
DROP COLUMN "stripe_account_status",
ADD COLUMN     "available_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "booking_mode" VARCHAR(20) NOT NULL DEFAULT 'dispatch',
ADD COLUMN     "completed_jobs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completion_rate" DECIMAL(5,2) NOT NULL DEFAULT 100.0,
ADD COLUMN     "coverage_radius_km" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "is_insured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pending_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "platform_fee_percent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "company_staff" ADD COLUMN     "split_percent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "booking_id" BIGINT,
ADD COLUMN     "type" VARCHAR(20) NOT NULL DEFAULT 'support';

-- AlterTable
ALTER TABLE "disputes" ADD COLUMN     "frozen_amount" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "checklist" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_seen" TIMESTAMP(3),
ADD COLUMN     "working_status" TEXT NOT NULL DEFAULT 'offline';

-- CreateTable
CREATE TABLE "email_templates" (
    "id" SERIAL NOT NULL,
    "template_id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "subject" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" SERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "day_of_week" INTEGER,
    "start_hour" INTEGER,
    "end_hour" INTEGER,
    "surcharge_percent" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_logs" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" BIGINT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" BIGINT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_reports" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "document_url" TEXT,
    "notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcasts" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "audience" VARCHAR(50) NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "open_rate" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_documents" (
    "id" BIGSERIAL NOT NULL,
    "staff_id" BIGINT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "document_url" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "expiry_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_notes" (
    "id" BIGSERIAL NOT NULL,
    "staff_id" BIGINT NOT NULL,
    "author_id" BIGINT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_template_id_key" ON "email_templates"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets"("user_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "moderation_logs_admin_id_idx" ON "moderation_logs"("admin_id");

-- CreateIndex
CREATE INDEX "moderation_logs_entity_type_entity_id_idx" ON "moderation_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "moderation_logs_status_idx" ON "moderation_logs"("status");

-- CreateIndex
CREATE INDEX "compliance_reports_company_id_idx" ON "compliance_reports"("company_id");

-- CreateIndex
CREATE INDEX "compliance_reports_status_idx" ON "compliance_reports"("status");

-- CreateIndex
CREATE INDEX "staff_documents_staff_id_idx" ON "staff_documents"("staff_id");

-- CreateIndex
CREATE INDEX "staff_notes_staff_id_idx" ON "staff_notes"("staff_id");

-- CreateIndex
CREATE INDEX "staff_notes_author_id_idx" ON "staff_notes"("author_id");

-- CreateIndex
CREATE INDEX "fk_conversation_booking" ON "conversations"("booking_id");

-- CreateIndex
CREATE INDEX "conversations_type_idx" ON "conversations"("type");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "company_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_notes" ADD CONSTRAINT "staff_notes_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "company_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_notes" ADD CONSTRAINT "staff_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
