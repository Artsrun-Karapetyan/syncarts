CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "type" TEXT NOT NULL,
  "audience" TEXT NOT NULL DEFAULT 'ALL',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "actorId" TEXT,
  "actorName" TEXT,
  "actorAvatarUrl" TEXT,
  "actionUrl" TEXT,
  "actionLabel" TEXT,
  "metadata" JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_preferences" (
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'IN_APP',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("userId", "type", "channel")
);

CREATE INDEX "notifications_userId_isArchived_isRead_createdAt_idx"
  ON "notifications"("userId", "isArchived", "isRead", "createdAt");

CREATE INDEX "notifications_userId_audience_createdAt_idx"
  ON "notifications"("userId", "audience", "createdAt");

CREATE INDEX "notifications_workspaceId_idx" ON "notifications"("workspaceId");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_preferences"
  ADD CONSTRAINT "notification_preferences_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
