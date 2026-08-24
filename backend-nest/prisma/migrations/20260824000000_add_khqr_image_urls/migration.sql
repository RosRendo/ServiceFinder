-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "khqr_image_url" TEXT;

-- AlterTable
ALTER TABLE "company_staff" ADD COLUMN     "khqr_image_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "apple_id" VARCHAR(255),
ADD COLUMN     "facebook_id" VARCHAR(255),
ADD COLUMN     "google_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_apple_id_key" ON "users"("apple_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_facebook_id_key" ON "users"("facebook_id");

