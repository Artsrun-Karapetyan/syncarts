CREATE TABLE "workspace_watches" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workspace_watches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_watches_userId_workspaceId_entityType_entityId_key"
  ON "workspace_watches"("userId", "workspaceId", "entityType", "entityId");

CREATE INDEX "workspace_watches_workspaceId_entityType_entityId_idx"
  ON "workspace_watches"("workspaceId", "entityType", "entityId");

CREATE INDEX "workspace_watches_userId_workspaceId_idx"
  ON "workspace_watches"("userId", "workspaceId");

ALTER TABLE "workspace_watches"
  ADD CONSTRAINT "workspace_watches_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_watches"
  ADD CONSTRAINT "workspace_watches_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
