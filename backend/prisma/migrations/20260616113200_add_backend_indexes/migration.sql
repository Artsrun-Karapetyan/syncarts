-- CreateIndex
CREATE INDEX "workspaces_ownerId_idx" ON "workspaces"("ownerId");

-- CreateIndex
CREATE INDEX "merge_requests_targetWorkspaceId_createdAt_idx" ON "merge_requests"("targetWorkspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "merge_requests_sourceWorkspaceId_createdAt_idx" ON "merge_requests"("sourceWorkspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "merge_requests_authorId_idx" ON "merge_requests"("authorId");
