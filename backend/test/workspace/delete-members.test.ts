import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import { WorkspaceService } from "../../src/workspace/workspace.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("WorkspaceService delete/members", () => {
  test("owner delete removes invites and workspace", async () => {
    const calls: string[] = [];
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({ id: "workspace", ownerId: "owner" }),
          delete: async () => calls.push("workspace"),
        },
        workspaceInvite: {
          deleteMany: async () => calls.push("invites"),
        },
      }),
    );

    await expect(service.deleteWorkspace("workspace", "owner")).resolves.toEqual(
      { status: "deleted", workspaceId: "workspace" },
    );
    expect(calls).toEqual(["invites", "workspace"]);
  });

  test("member delete leaves workspace", async () => {
    let deletedMember: any;
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({ id: "workspace", ownerId: "owner" }),
        },
        workspaceMember: {
          delete: async ({ where }: any) => {
            deletedMember = where.userId_workspaceId;
          },
        },
      }),
    );

    await expect(
      service.deleteWorkspace("workspace", "member"),
    ).resolves.toEqual({ status: "left", workspaceId: "workspace" });
    expect(deletedMember).toEqual({ userId: "member", workspaceId: "workspace" });
  });

  test("delete rejects missing workspace access", async () => {
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: { findFirst: async () => null },
      }),
    );

    await expect(
      service.deleteWorkspace("workspace", "user"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test("only owner can remove members and cannot remove self", async () => {
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: { findUnique: async () => ({ ownerId: "owner" }) },
      }),
    );

    await expect(
      service.removeMember("workspace", "member", "other"),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.removeMember("workspace", "owner", "owner"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test("owner can remove member", async () => {
    let deleteWhere: any;
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: { findUnique: async () => ({ ownerId: "owner" }) },
        workspaceMember: {
          deleteMany: async ({ where }: any) => {
            deleteWhere = where;
          },
        },
      }),
    );

    await expect(
      service.removeMember("workspace", "member", "owner"),
    ).resolves.toEqual({
      status: "removed",
      workspaceId: "workspace",
      userId: "member",
    });
    expect(deleteWhere).toEqual({ userId: "member", workspaceId: "workspace" });
  });

  test("updates member role when owner sends valid role", async () => {
    let updateData: any;
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: { findUnique: async () => ({ ownerId: "owner" }) },
        workspaceMember: {
          update: async ({ data }: any) => {
            updateData = data;
          },
        },
      }),
    );

    await expect(
      service.updateMemberRole({
        workspaceId: "workspace",
        memberUserId: "member",
        role: "EDITOR",
        userId: "owner",
      }),
    ).resolves.toEqual({
      status: "updated",
      workspaceId: "workspace",
      userId: "member",
      role: "EDITOR",
    });
    expect(updateData).toEqual({ role: "EDITOR" });
  });

  test("updateMemberRole rejects non-owner", async () => {
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: { findUnique: async () => ({ ownerId: "owner" }) },
      }),
    );

    await expect(
      service.updateMemberRole({
        workspaceId: "workspace",
        memberUserId: "member",
        role: "EDITOR",
        userId: "other",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test("updateMemberRole rejects invalid role", async () => {
    const service = new WorkspaceService(
      createPrismaMock({
        workspace: { findUnique: async () => ({ ownerId: "owner" }) },
      }),
    );

    await expect(
      service.updateMemberRole({
        workspaceId: "workspace",
        memberUserId: "member",
        role: "ADMIN",
        userId: "owner",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
