import { z } from "zod";

const WorkspaceSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  collections: z.any().optional(),
  environments: z.any().optional(),
  globalVariables: z.any().optional(),
});

export const GenerateLinkSchema = z.object({
  workspaceId: z.string().optional(),
  workspaceIds: z.array(z.string()).min(1).optional(),
  workspaces: z.array(WorkspaceSnapshotSchema).optional(),
  expiresInDays: z.number().optional(),
});

export const InviteEmailSchema = z.object({
  workspaceId: z.string().optional(),
  workspaceIds: z.array(z.string()).min(1).optional(),
  workspaces: z.array(WorkspaceSnapshotSchema).optional(),
  email: z.string().email(),
});
