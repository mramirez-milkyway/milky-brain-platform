/*
  Warnings:

  - Added the required column `export_type` to the `export_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "export_logs" DROP CONSTRAINT "export_logs_user_id_fkey";

-- AlterTable - Add export_type with default for existing rows, then remove default
ALTER TABLE "export_logs" ADD COLUMN     "export_type" TEXT;
UPDATE "export_logs" SET "export_type" = 'legacy' WHERE "export_type" IS NULL;
ALTER TABLE "export_logs" ALTER COLUMN "export_type" SET NOT NULL;

-- AlterTable - Add other columns
ALTER TABLE "export_logs" ADD COLUMN     "exported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "object_ref" DROP NOT NULL,
ALTER COLUMN "destination" SET DEFAULT 'DOWNLOAD';

-- CreateTable
CREATE TABLE "export_control_settings" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "export_type" TEXT NOT NULL,
    "row_limit" INTEGER NOT NULL,
    "enable_watermark" BOOLEAN NOT NULL DEFAULT true,
    "daily_limit" INTEGER,
    "monthly_limit" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_control_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "followers" INTEGER NOT NULL,
    "engagement" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "influencers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_control_settings_role_id_idx" ON "export_control_settings"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "export_control_settings_role_id_export_type_key" ON "export_control_settings"("role_id", "export_type");

-- CreateIndex
CREATE INDEX "export_logs_user_id_exported_at_idx" ON "export_logs"("user_id", "exported_at");

-- CreateIndex
CREATE INDEX "export_logs_export_type_idx" ON "export_logs"("export_type");

-- AddForeignKey
ALTER TABLE "export_logs" ADD CONSTRAINT "export_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_control_settings" ADD CONSTRAINT "export_control_settings_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
