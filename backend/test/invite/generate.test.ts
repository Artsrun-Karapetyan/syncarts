import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import { InviteService } from "../../src/invite/invite.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("InviteService generateInviteLink", () => {
  test("requires at least one workspace", async () => {
    const service = new InviteService(createPrismaMock());

    await expect(
      service.generateInviteLink({ workspaceIds: [] }, "owner"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  test("creates invite for owned workspaces", async () => {
    let inviteData: any;
    const service = new InviteService(
      createPrismaMock({
        workspace: {
          findMany: async () => [
            { id: "one", name: "One" },
            { id: "two", name: "Two" },
          ],
        },
        workspaceInvite: {
          create: async ({ data }: any) => {
            inviteData = data;
            return { token: "invite", ...data };
          },
        },
      }),
    );

    const result = await service.generateInviteLink(
      { workspaceIds: ["one", "two", "one"] },
      "owner",
      3,
    );

    expect(result.token).toBe("invite");
    expect(inviteData.workspaceIds).toEqual(["one", "two"]);
    expect(inviteData.expiresAt).toBeInstanceOf(Date);
  });

  test("rejects unavailable workspace", async () => {
    const service = new InviteService(
      createPrismaMock({
        workspace: { findMany: async () => [] },
      }),
    );

    await expect(
      service.generateInviteLink({ workspaceIds: ["missing"] }, "owner"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  test("requires owner for workspace snapshot sync", async () => {
    const service = new InviteService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({ id: "workspace", ownerId: "other" }),
        },
      }),
    );

    await expect(
      service.generateInviteLink(
        {
          workspaceIds: ["workspace"],
          workspaces: [{ id: "workspace", name: "API" }],
        },
        "owner",
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test("updates existing owned workspace snapshot", async () => {
    let updateInput: any;
    const createdCollections: any[] = [];
    const service = new InviteService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            name: "Old",
            ownerId: "owner",
          }),
          update: async (input: any) => {
            updateInput = input;
          },
          findMany: async () => [{ id: "workspace" }],
        },
        workspaceInvite: {
          create: async ({ data }: any) => ({ token: "invite", ...data }),
        },
        workspaceCollection: {
          deleteMany: async () => ({ count: 0 }),
          create: async ({ data }: any) => {
            createdCollections.push(data);
            return data;
          },
          findMany: async () => [],
        },
      }),
    );

    await service.generateInviteLink(
      {
        workspaceIds: ["workspace"],
        workspaces: [
          { id: "workspace", name: "New", collections: [{ id: "c" }] },
        ],
      },
      "owner",
    );

    expect(updateInput).toEqual({
      where: { id: "workspace" },
      data: {
        name: "New",
        version: { increment: 1 },
      },
    });
    expect(createdCollections[0]).toMatchObject({
      id: "c",
      workspaceId: "workspace",
    });
  });

  test("syncs new workspace snapshots", async () => {
    let createdWorkspace: any;
    const createdCollections: any[] = [];
    const createdEnvironments: any[] = [];
    const createdGlobalVariables: any[] = [];
    const service = new InviteService(
      createPrismaMock({
        workspace: {
          findFirst: async () => null,
          create: async ({ data }: any) => {
            createdWorkspace = data;
          },
          findMany: async () => [{ id: "workspace" }],
        },
        workspaceInvite: {
          create: async ({ data }: any) => ({ token: "invite", ...data }),
        },
        workspaceCollection: {
          deleteMany: async () => ({ count: 0 }),
          create: async ({ data }: any) => {
            createdCollections.push(data);
            return data;
          },
          findMany: async () => [],
        },
        workspaceEnvironment: {
          deleteMany: async () => ({ count: 0 }),
          create: async ({ data }: any) => {
            createdEnvironments.push(data);
            return data;
          },
          findMany: async () => [],
        },
        workspaceGlobalVariable: {
          deleteMany: async () => ({ count: 0 }),
          create: async ({ data }: any) => {
            createdGlobalVariables.push(data);
            return data;
          },
          findMany: async () => [],
        },
      }),
    );

    await service.generateInviteLink(
      {
        workspaceIds: ["workspace"],
        workspaces: [
          {
            id: "workspace",
            name: "API",
            collections: [{ id: "collection" }],
            environments: [{ id: "env" }],
            globalVariables: [{ id: "global" }],
          },
        ],
      },
      "owner",
    );

    expect(createdWorkspace).toMatchObject({
      id: "workspace",
      name: "API",
      ownerId: "owner",
    });
    expect(createdWorkspace.data).toBeUndefined();
    expect(createdCollections[0]).toMatchObject({ id: "collection" });
    expect(createdEnvironments[0]).toMatchObject({ id: "env" });
    expect(createdGlobalVariables[0]).toMatchObject({ id: "global" });
  });
});
