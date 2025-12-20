-- CreateTable
CREATE TABLE "agencies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agencies_name_key" ON "agencies"("name");

-- CreateIndex
CREATE INDEX "agencies_name_idx" ON "agencies"("name");

-- AlterTable
ALTER TABLE "creators" ADD COLUMN "agency_id" INTEGER;

-- CreateIndex
CREATE INDEX "creators_agency_id_idx" ON "creators"("agency_id");

-- AddForeignKey
ALTER TABLE "creators" ADD CONSTRAINT "creators_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
