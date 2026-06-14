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
        data: { collections: [{ id: "c" }], environments: [], globalVariables: [] },
      },
    });
  });

  test("syncs new workspace snapshots", async () => {
    let createdWorkspace: any;
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
      data: {
        collections: [{ id: "collection" }],
        environments: [{ id: "env" }],
        globalVariables: [{ id: "global" }],
      },
    });
  });
});
