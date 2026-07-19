-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sends" (
    "id" TEXT NOT NULL,
    "causedBy" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" TEXT NOT NULL,
    "sendId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "statusCode" INTEGER,
    "error" TEXT,
    "durationMs" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextRetryAt" TIMESTAMP(3),

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconcile_gaps" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "eventId" TEXT,
    "sendId" TEXT,
    "detail" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "reconcile_gaps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_idempotencyKey_key" ON "webhook_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "webhook_events_status_receivedAt_idx" ON "webhook_events"("status", "receivedAt");

-- CreateIndex
CREATE INDEX "webhook_events_source_receivedAt_idx" ON "webhook_events"("source", "receivedAt");

-- CreateIndex
CREATE INDEX "sends_status_createdAt_idx" ON "sends"("status", "createdAt");

-- CreateIndex
CREATE INDEX "sends_causedBy_idx" ON "sends"("causedBy");

-- CreateIndex
CREATE UNIQUE INDEX "attempts_sendId_attemptNo_key" ON "attempts"("sendId", "attemptNo");

-- CreateIndex
CREATE INDEX "reconcile_gaps_type_detectedAt_idx" ON "reconcile_gaps"("type", "detectedAt");

-- AddForeignKey
ALTER TABLE "sends" ADD CONSTRAINT "sends_causedBy_fkey" FOREIGN KEY ("causedBy") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_sendId_fkey" FOREIGN KEY ("sendId") REFERENCES "sends"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconcile_gaps" ADD CONSTRAINT "reconcile_gaps_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "webhook_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconcile_gaps" ADD CONSTRAINT "reconcile_gaps_sendId_fkey" FOREIGN KEY ("sendId") REFERENCES "sends"("id") ON DELETE SET NULL ON UPDATE CASCADE;
