import type { Prisma } from "@prisma/client";

export type WorkspaceSyncInput = {
  name?: string;
  version?: number;
  collections?: Prisma.InputJsonValue;
  environments?: Prisma.InputJsonValue;
  globalVariables?: Prisma.InputJsonValue;
};

export function toWorkspaceSyncInput(value: unknown): WorkspaceSyncInput {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const input = value as Record<string, Prisma.InputJsonValue | undefined>;
  return {
    name: typeof input.name === "string" ? input.name : undefined,
    version: typeof input.version === "number" ? input.version : undefined,
    collections: input.collections,
    environments: input.environments,
    globalVariables: input.globalVariables,
  };
}
