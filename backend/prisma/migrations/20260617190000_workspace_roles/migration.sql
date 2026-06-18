UPDATE "workspace_members" SET "role" = 'EDITOR' WHERE "role" = 'MEMBER';

ALTER TABLE "workspace_members" ALTER COLUMN "role" SET DEFAULT 'EDITOR';
