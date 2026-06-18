-- AlterTable
ALTER TABLE "request_examples" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workspace_collections" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workspace_environment_variables" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workspace_environments" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workspace_folders" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workspace_global_variables" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workspace_requests" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "workspace_environment_variables_workspaceId_environmentId_sortO" RENAME TO "workspace_environment_variables_workspaceId_environmentId_s_idx";

-- RenameIndex
ALTER INDEX "workspace_folders_workspaceId_collectionId_parentFolderId_sortO" RENAME TO "workspace_folders_workspaceId_collectionId_parentFolderId_s_idx";

-- RenameIndex
ALTER INDEX "workspace_requests_workspaceId_collectionId_folderId_sortOrder_" RENAME TO "workspace_requests_workspaceId_collectionId_folderId_sortOr_idx";
