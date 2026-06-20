import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import { parsePaginationQuery } from "../../src/common/parsePaginationQuery.js";
import { normalizeWorkspaceIds } from "../../src/invite/normalizeWorkspaceIds.js";
import { WorkspaceService } from "../../src/workspace/workspace.service.js";
import { getWorkspaceAccess } from "../../src/workspace/workspaceAccess.js";
import { normalizeWorkspaceData } from "../../src/workspace/workspaceData.js";
import {
  canAssignWorkspaceRole,
  normalizeWorkspaceRole,
  WorkspaceRoles,
} from "../../src/workspace/workspaceRoles.js";
import { toWorkspaceSyncInput } from "../../src/workspace/workspaceSyncInput.js";

describe("Misc Coverage", () => {
  test("parsePaginationQuery handles arrays and empty strings", () => {
    expect(parsePaginationQuery({ limit: ["10"], offset: ["5"] })).toEqual({
      take: 10,
      skip: 5,
    });
    expect(parsePaginationQuery({ limit: "", offset: undefined })).toEqual({
      take: undefined,
      skip: undefined,
    });
  });

  test("normalizeWorkspaceIds handles missing ids but present id", () => {
    expect(normalizeWorkspaceIds({ workspaceId: "a" })).toEqual(["a"]);
    expect(normalizeWorkspaceIds({})).toEqual([]);
  });

  test("getWorkspaceAccess tests canWrite and missing", async () => {
    const client = {
      workspace: {
        findFirst: async ({ where }: any) => {
          if (where.id === "w-missing") return null;
          return {
            id: "w-1",
            ownerId: "u-2",
            members: [{ userId: "u-1", role: "VIEWER" }],
          };
        },
      },
    };
    const result = await getWorkspaceAccess(client as any, "w-1", "u-1", {
      canWrite: false,
    });
    expect(result.id).toBe("w-1");

    await expect(
      getWorkspaceAccess(client as any, "w-1", "u-1", { canWrite: true }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      getWorkspaceAccess(client as any, "w-missing", "u-1"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test("normalizeWorkspaceData", () => {
    expect(normalizeWorkspaceData(null)).toEqual({
      collections: [],
      environments: [],
      globalVariables: [],
    });
    expect(normalizeWorkspaceData("not object")).toEqual({
      collections: [],
      environments: [],
      globalVariables: [],
    });
  });

  test("workspaceRoles coverage", () => {
    expect(normalizeWorkspaceRole("INVALID")).toBe(WorkspaceRoles.Viewer);
    expect(canAssignWorkspaceRole("ADMIN")).toBe(true);
  });

  test("toWorkspaceSyncInput coverage", () => {
    expect(toWorkspaceSyncInput(null)).toEqual({});
    expect(toWorkspaceSyncInput("not object")).toEqual({});
  });

  test("WorkspaceService getWorkspaceForUser coverage", async () => {
    const service = new WorkspaceService({
      workspace: {
        findFirst: async () => ({ id: "w-1", ownerId: "u-1", members: [] }),
      },
      workspaceCollection: { findMany: async () => [] },
      workspaceEnvironment: { findMany: async () => [] },
      workspaceGlobalVariable: { findMany: async () => [] },
    } as any);
    const result = await service.getWorkspaceForUser("w-1", "u-1");
    expect(result.id).toBe("w-1");
  });
});
