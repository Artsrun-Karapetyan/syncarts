import { ForbiddenException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import { WorkspaceService } from "../../src/workspace/workspace.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("WorkspaceService create/list/sync", () => {
  test("creates workspace with owner membership", async () => {
    let createData: any;
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: {
          create: async ({ data }: any) => {
            createData = data;
            return { id: "workspace", ...data };
          },
        },
      }),
    );

    const result = await service.createWorkspace("API", "owner");

    expect(result.name).toBe("API");
    expect(createData.members.create).toEqual({
      userId: "owner",
      role: "OWNER",
    });
  });

  test("merges owned and member workspaces without duplicates", async () => {
    const ownedWorkspace = { id: "owned", ownerId: "user" };
    const sharedWorkspace = { id: "shared", ownerId: "other" };
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: { findMany: async () => [ownedWorkspace] },
        workspaceMember: {
          findMany: async () => [
            { workspaceId: "owned", workspace: ownedWorkspace },
            { workspaceId: "shared", workspace: sharedWorkspace },
          ],
        },
      }),
    );

    await expect(service.getWorkspacesForUser("user")).resolves.toEqual([
      ownedWorkspace,
      sharedWorkspace,
    ]);
  });

  test("sync creates missing workspace with normalized data", async () => {
    let createData: any;
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: {
          findFirst: async () => null,
          create: async ({ data }: any) => {
            createData = data;
            return data;
          },
        },
      }),
    );

    await service.syncWorkspace("workspace", { name: "API" }, "owner");

    expect(createData).toMatchObject({
      id: "workspace",
      name: "API",
      ownerId: "owner",
      data: { collections: [], environments: [], globalVariables: [] },
    });
  });

  test("sync updates existing workspace for owner", async () => {
    let updateInput: any;
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            name: "Old",
            ownerId: "owner",
            members: [],
          }),
          update: async (input: any) => {
            updateInput = input;
            return { id: "workspace", ...input.data };
          },
        },
      }),
    );

    await service.syncWorkspace(
      "workspace",
      {
        name: "New",
        collections: [{ id: "collection" }],
        environments: [{ id: "env" }],
        globalVariables: [{ id: "global" }],
      },
      "owner",
    );

    expect(updateInput).toEqual({
      where: { id: "workspace" },
      data: {
        name: "New",
        data: {
          collections: [{ id: "collection" }],
          environments: [{ id: "env" }],
          globalVariables: [{ id: "global" }],
        },
      },
    });
  });

  test("sync keeps existing name when body name is missing", async () => {
    let updateInput: any;
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            name: "Existing",
            ownerId: "owner",
            members: [{ userId: "member", role: "EDITOR" }],
          }),
          update: async (input: any) => {
            updateInput = input;
            return input.data;
          },
        },
      }),
    );

    await service.syncWorkspace("workspace", {}, "member");

    expect(updateInput.data.name).toBe("Existing");
  });

  test("sync blocks nonmembers and viewers", async () => {
    const nonMemberService = new WorkspaceService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            ownerId: "owner",
            members: [],
          }),
        },
      }),
    );

    await expect(
      nonMemberService.syncWorkspace("workspace", {}, "other"),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const viewerService = new WorkspaceService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            ownerId: "owner",
            members: [{ userId: "viewer", role: "VIEWER" }],
          }),
        },
      }),
    );

    await expect(
      viewerService.syncWorkspace("workspace", {}, "viewer"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
