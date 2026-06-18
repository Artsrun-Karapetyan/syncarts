import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import { InviteService } from "../../src/invite/invite.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("InviteService getInviteInfo/acceptInvite", () => {
  test("getInviteInfo rejects missing and expired invite", async () => {
    const missingService = new InviteService(
      createPrismaMock({
        workspaceInvite: { findUnique: async () => null },
      }),
    );

    await expect(missingService.getInviteInfo("bad")).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const expiredService = new InviteService(
      createPrismaMock({
        workspaceInvite: {
          findUnique: async () => ({
            token: "invite",
            workspaceIds: ["workspace"],
            expiresAt: new Date("2000-01-01T00:00:00.000Z"),
          }),
        },
      }),
    );

    await expect(expiredService.getInviteInfo("invite")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  test("getInviteInfo supports legacy workspaceId invites", async () => {
    const service = new InviteService(
      createPrismaMock({
        workspaceInvite: {
          findUnique: async () => ({
            token: "invite",
            workspaceId: "legacy-workspace",
            workspaceIds: [],
          }),
        },
        workspace: {
          findMany: async ({ where }: any) => [
            { id: where.id.in[0], name: "Legacy Workspace" },
          ],
        },
      }),
    );

    const result = await service.getInviteInfo("invite");

    expect(result.workspaces).toEqual([
      { id: "legacy-workspace", name: "Legacy Workspace" },
    ]);
  });

  test("acceptInvite adds memberships and deletes direct invite", async () => {
    const created: any[] = [];
    let deletedToken = "";
    const service = new InviteService(
      createPrismaMock({
        user: {
          findUnique: async () => ({ id: "user", email: "user@test.com" }),
        },
        workspace: {
          count: async () => 1,
          findMany: async () => [{ id: "workspace", name: "API" }],
        },
        workspaceInvite: {
          findUnique: async () => ({
            token: "invite",
            invitedEmail: "user@test.com",
            workspaceIds: ["workspace"],
          }),
          delete: async ({ where }: any) => {
            deletedToken = where.token;
          },
        },
        workspaceMember: {
          findUnique: async () => null,
          create: async ({ data }: any) => created.push(data),
        },
      }),
    );

    await expect(service.acceptInvite("invite", "user")).resolves.toEqual({
      status: "joined",
      workspaceIds: ["workspace"],
    });
    expect(created).toEqual([
      { userId: "user", workspaceId: "workspace", role: "EDITOR" },
    ]);
    expect(deletedToken).toBe("invite");
  });

  test("acceptInvite rejects invalid invites", async () => {
    const service = new InviteService(
      createPrismaMock({
        user: {
          findUnique: async () => ({ id: "user", email: "user@test.com" }),
        },
        workspace: { findMany: async () => [{ id: "workspace" }] },
        workspaceInvite: {
          findUnique: async () => ({
            token: "invite",
            invitedEmail: "other@test.com",
            workspaceIds: ["workspace"],
          }),
        },
      }),
    );

    await expect(service.acceptInvite("invite", "user")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  test("acceptInvite rejects invite without workspace targets", async () => {
    const service = new InviteService(
      createPrismaMock({
        user: {
          findUnique: async () => ({ id: "user", email: "user@test.com" }),
        },
        workspace: { findMany: async () => [] },
        workspaceInvite: {
          findUnique: async () => ({ token: "invite", workspaceIds: [] }),
        },
      }),
    );

    await expect(service.acceptInvite("invite", "user")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  test("acceptInvite rejects when invited workspace was deleted", async () => {
    const service = new InviteService(
      createPrismaMock({
        user: {
          findUnique: async () => ({ id: "user", email: "user@test.com" }),
        },
        workspace: {
          count: async () => 0,
          findMany: async () => [{ id: "workspace" }],
        },
        workspaceInvite: {
          findUnique: async () => ({
            token: "invite",
            workspaceIds: ["workspace"],
          }),
        },
      }),
    );

    await expect(service.acceptInvite("invite", "user")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  test("acceptInvite skips existing memberships", async () => {
    let createCalled = false;
    const service = new InviteService(
      createPrismaMock({
        user: {
          findUnique: async () => ({ id: "user", email: "user@test.com" }),
        },
        workspace: {
          count: async () => 1,
          findMany: async () => [{ id: "workspace" }],
        },
        workspaceInvite: {
          findUnique: async () => ({
            token: "invite",
            workspaceIds: ["workspace"],
          }),
        },
        workspaceMember: {
          findUnique: async () => ({
            userId: "user",
            workspaceId: "workspace",
          }),
          create: async () => {
            createCalled = true;
          },
        },
      }),
    );

    await expect(service.acceptInvite("invite", "user")).resolves.toEqual({
      status: "joined",
      workspaceIds: ["workspace"],
    });
    expect(createCalled).toBe(false);
  });

  test("acceptInvite keeps reusable generic invite", async () => {
    let deleteCalled = false;
    const service = new InviteService(
      createPrismaMock({
        user: {
          findUnique: async () => ({ id: "user", email: "user@test.com" }),
        },
        workspace: {
          count: async () => 1,
          findMany: async () => [{ id: "workspace" }],
        },
        workspaceInvite: {
          findUnique: async () => ({
            token: "invite",
            invitedEmail: null,
            workspaceIds: ["workspace"],
          }),
          delete: async () => {
            deleteCalled = true;
          },
        },
        workspaceMember: {
          findUnique: async () => null,
          create: async () => undefined,
        },
      }),
    );

    await service.acceptInvite("invite", "user");

    expect(deleteCalled).toBe(false);
  });

  test("acceptInvite supports legacy workspaceId invites", async () => {
    let createdMembership: any;
    const service = new InviteService(
      createPrismaMock({
        user: {
          findUnique: async () => ({ id: "user", email: "user@test.com" }),
        },
        workspace: {
          count: async () => 1,
          findMany: async () => [{ id: "legacy-workspace" }],
        },
        workspaceInvite: {
          findUnique: async () => ({
            token: "invite",
            workspaceId: "legacy-workspace",
            workspaceIds: [],
          }),
        },
        workspaceMember: {
          findUnique: async () => null,
          create: async ({ data }: any) => {
            createdMembership = data;
          },
        },
      }),
    );

    await expect(service.acceptInvite("invite", "user")).resolves.toEqual({
      status: "joined",
      workspaceIds: ["legacy-workspace"],
    });
    expect(createdMembership).toEqual({
      userId: "user",
      workspaceId: "legacy-workspace",
      role: "EDITOR",
    });
  });
});
