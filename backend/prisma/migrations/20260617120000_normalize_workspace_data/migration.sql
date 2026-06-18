-- Beta reset: normalized workspace contents replace the old workspace JSON blob.
ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "data";

CREATE TABLE "workspace_collections" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "version" INTEGER NOT NULL DEFAULT 1,
  "authType" TEXT,
  "bearerToken" TEXT,
  "description" TEXT,
  "preRequestScript" TEXT,
  "testScript" TEXT,
  "variables" JSONB,
  "fork" JSONB,

  CONSTRAINT "workspace_collections_pkey" PRIMARY KEY ("workspaceId", "id")
);

CREATE TABLE "workspace_folders" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "parentFolderId" TEXT,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "version" INTEGER NOT NULL DEFAULT 1,
  "authType" TEXT,
  "bearerToken" TEXT,
  "description" TEXT,
  "preRequestScript" TEXT,
  "testScript" TEXT,
  "variables" JSONB,

  CONSTRAINT "workspace_folders_pkey" PRIMARY KEY ("workspaceId", "id")
);

CREATE TABLE "workspace_requests" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "folderId" TEXT,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "version" INTEGER NOT NULL DEFAULT 1,
  "method" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "headers" JSONB,
  "authType" TEXT,
  "bearerToken" TEXT,
  "bodyType" TEXT,
  "description" TEXT,
  "pathVariables" JSONB,
  "queryParamDescriptions" JSONB,
  "queryParams" JSONB,
  "formData" JSONB,
  "body" TEXT NOT NULL,
  "preRequestScript" TEXT,
  "testScript" TEXT,

  CONSTRAINT "workspace_requests_pkey" PRIMARY KEY ("workspaceId", "id")
);

CREATE TABLE "request_examples" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "version" INTEGER NOT NULL DEFAULT 1,
  "originalRequest" JSONB,
  "code" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "headers" JSONB,

  CONSTRAINT "request_examples_pkey" PRIMARY KEY ("workspaceId", "id")
);

CREATE TABLE "workspace_environments" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "version" INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT "workspace_environments_pkey" PRIMARY KEY ("workspaceId", "id")
);

CREATE TABLE "workspace_environment_variables" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "environmentId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "version" INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT "workspace_environment_variables_pkey" PRIMARY KEY ("workspaceId", "id")
);

CREATE TABLE "workspace_global_variables" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "version" INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT "workspace_global_variables_pkey" PRIMARY KEY ("workspaceId", "id")
);

CREATE INDEX "workspace_collections_workspaceId_sortOrder_idx" ON "workspace_collections"("workspaceId", "sortOrder");
CREATE INDEX "workspace_folders_workspaceId_collectionId_parentFolderId_sortOrder_idx" ON "workspace_folders"("workspaceId", "collectionId", "parentFolderId", "sortOrder");
CREATE INDEX "workspace_requests_workspaceId_collectionId_folderId_sortOrder_idx" ON "workspace_requests"("workspaceId", "collectionId", "folderId", "sortOrder");
CREATE INDEX "request_examples_workspaceId_requestId_sortOrder_idx" ON "request_examples"("workspaceId", "requestId", "sortOrder");
CREATE INDEX "workspace_environments_workspaceId_sortOrder_idx" ON "workspace_environments"("workspaceId", "sortOrder");
CREATE INDEX "workspace_environment_variables_workspaceId_environmentId_sortOrder_idx" ON "workspace_environment_variables"("workspaceId", "environmentId", "sortOrder");
CREATE INDEX "workspace_global_variables_workspaceId_sortOrder_idx" ON "workspace_global_variables"("workspaceId", "sortOrder");

ALTER TABLE "workspace_collections" ADD CONSTRAINT "workspace_collections_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_folders" ADD CONSTRAINT "workspace_folders_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_folders" ADD CONSTRAINT "workspace_folders_workspaceId_collectionId_fkey" FOREIGN KEY ("workspaceId", "collectionId") REFERENCES "workspace_collections"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_folders" ADD CONSTRAINT "workspace_folders_workspaceId_parentFolderId_fkey" FOREIGN KEY ("workspaceId", "parentFolderId") REFERENCES "workspace_folders"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_requests" ADD CONSTRAINT "workspace_requests_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_requests" ADD CONSTRAINT "workspace_requests_workspaceId_collectionId_fkey" FOREIGN KEY ("workspaceId", "collectionId") REFERENCES "workspace_collections"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_requests" ADD CONSTRAINT "workspace_requests_workspaceId_folderId_fkey" FOREIGN KEY ("workspaceId", "folderId") REFERENCES "workspace_folders"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "request_examples" ADD CONSTRAINT "request_examples_workspaceId_requestId_fkey" FOREIGN KEY ("workspaceId", "requestId") REFERENCES "workspace_requests"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_environments" ADD CONSTRAINT "workspace_environments_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_environment_variables" ADD CONSTRAINT "workspace_environment_variables_workspaceId_environmentId_fkey" FOREIGN KEY ("workspaceId", "environmentId") REFERENCES "workspace_environments"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_global_variables" ADD CONSTRAINT "workspace_global_variables_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
