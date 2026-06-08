ALTER TABLE "workspace_invites" ADD COLUMN IF NOT EXISTS "workspaceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "workspace_invites" ALTER COLUMN "workspaceId" DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'workspace_invites'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'workspace_invites_workspaceId_fkey'
  ) THEN
    ALTER TABLE "workspace_invites" DROP CONSTRAINT "workspace_invites_workspaceId_fkey";
  END IF;
END $$;

UPDATE "workspace_invites"
SET "workspaceIds" = ARRAY["workspaceId"]::TEXT[]
WHERE "workspaceId" IS NOT NULL
  AND COALESCE(array_length("workspaceIds", 1), 0) = 0;
