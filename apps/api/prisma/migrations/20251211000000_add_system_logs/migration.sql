-- CreateTable: system_logs
CREATE TABLE "system_logs" (
    "id" SERIAL NOT NULL,
    "context" TEXT NOT NULL,
    "error_message" TEXT NOT NULL,
    "stack_trace" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_logs_context_idx" ON "system_logs"("context");

-- CreateIndex
CREATE INDEX "system_logs_created_at_idx" ON "system_logs"("created_at");
