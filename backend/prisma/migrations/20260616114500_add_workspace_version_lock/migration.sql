-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "workspaces" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "workspaces_id_version_idx" ON "workspaces"("id", "version");
