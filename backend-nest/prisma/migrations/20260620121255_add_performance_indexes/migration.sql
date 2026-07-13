-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "stripe_account_id" VARCHAR(100),
ADD COLUMN     "stripe_account_status" VARCHAR(50) NOT NULL DEFAULT 'pending',
ADD COLUMN     "wallet_balance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "company_staff" ADD COLUMN     "credit_limit" DECIMAL(10,2) NOT NULL DEFAULT -50,
ADD COLUMN     "wallet_balance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "company_id" BIGINT;

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" BIGSERIAL NOT NULL,
    "staff_id" BIGINT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "booking_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" BIGSERIAL NOT NULL,
    "owner_type" VARCHAR(20) NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "booking_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_requests" (
    "id" BIGSERIAL NOT NULL,
    "owner_type" VARCHAR(20) NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "proof_of_transfer_url" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" BIGSERIAL NOT NULL,
    "owner_type" VARCHAR(20) NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "destination_bank" VARCHAR(100) NOT NULL,
    "account_name" VARCHAR(100) NOT NULL,
    "account_number" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_transactions_staff_id_idx" ON "wallet_transactions"("staff_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_booking_id_idx" ON "wallet_transactions"("booking_id");

-- CreateIndex
CREATE INDEX "transactions_owner_type_owner_id_idx" ON "transactions"("owner_type", "owner_id");

-- CreateIndex
CREATE INDEX "transactions_booking_id_idx" ON "transactions"("booking_id");

-- CreateIndex
CREATE INDEX "deposit_requests_owner_type_owner_id_idx" ON "deposit_requests"("owner_type", "owner_id");

-- CreateIndex
CREATE INDEX "payout_requests_owner_type_owner_id_idx" ON "payout_requests"("owner_type", "owner_id");

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_slot_company_date" ON "availability_slots"("company_id", "date");

-- CreateIndex
CREATE INDEX "bookings_created_at_idx" ON "bookings"("created_at");

-- CreateIndex
CREATE INDEX "companies_verification_status_idx" ON "companies"("verification_status");

-- CreateIndex
CREATE INDEX "companies_subscription_status_idx" ON "companies"("subscription_status");

-- CreateIndex
CREATE INDEX "fk_conversation_company" ON "conversations"("company_id");

-- CreateIndex
CREATE INDEX "fk_campaign_company" ON "marketing_campaigns"("company_id");

-- CreateIndex
CREATE INDEX "idx_payment_transaction_ref" ON "payments"("transaction_ref");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "company_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
