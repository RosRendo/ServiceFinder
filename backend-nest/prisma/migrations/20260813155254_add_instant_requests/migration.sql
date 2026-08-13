-- CreateTable
CREATE TABLE "instant_requests" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "service_category" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "preferred_time" VARCHAR(20) NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'searching',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instant_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instant_request_bids" (
    "id" BIGSERIAL NOT NULL,
    "request_id" BIGINT NOT NULL,
    "company_id" BIGINT NOT NULL,
    "price_estimate" DECIMAL(10,2) NOT NULL,
    "eta_minutes" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instant_request_bids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "instant_requests_customer_id_idx" ON "instant_requests"("customer_id");

-- CreateIndex
CREATE INDEX "instant_requests_status_idx" ON "instant_requests"("status");

-- CreateIndex
CREATE INDEX "instant_request_bids_request_id_idx" ON "instant_request_bids"("request_id");

-- CreateIndex
CREATE INDEX "instant_request_bids_company_id_idx" ON "instant_request_bids"("company_id");

-- AddForeignKey
ALTER TABLE "instant_requests" ADD CONSTRAINT "instant_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instant_request_bids" ADD CONSTRAINT "instant_request_bids_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "instant_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instant_request_bids" ADD CONSTRAINT "instant_request_bids_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
