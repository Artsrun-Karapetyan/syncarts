import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import { InviteService } from "../../src/invite/invite.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("InviteService addMemberByEmail", () => {
  test("creates missing memberships", async () => {
    const created: any[] = [];
    const service = new InviteService(
      createPrismaMock({
        user: { findUnique: async () => ({ id: "member", email: "m@test.com" }) },
        workspace: { findMany: async () => [{ id: "workspace" }] },
        workspaceMember: {
          findUnique: async () => null,
          create: async ({ data }: any) => created.push(data),
        },
      }),
    );

    await expect(
      service.addMemberByEmail(
        { workspaceIds: ["workspace"] },
        "m@test.com",
        "owner",
      ),
    ).resolves.toEqual({ status: "added", workspaceIds: ["workspace"] });
    expect(created).toEqual([
      { userId: "member", workspaceId: "workspace", role: "MEMBER" },
    ]);
  });

  test("skips existing memberships", async () => {
    let createCalled = false;
    const service = new InviteService(
      createPrismaMock({
        user: { findUnique: async () => ({ id: "member", email: "m@test.com" }) },
        workspace: { findMany: async () => [{ id: "workspace" }] },
        workspaceMember: {
          findUnique: async () => ({ userId: "member", workspaceId: "workspace" }),
          create: async () => {
            createCalled = true;
          },
        },
      }),
    );

    await expect(
      service.addMemberByEmail(
        { workspaceIds: ["workspace"] },
        "m@test.com",
        "owner",
      ),
    ).resolves.toEqual({ status: "added", workspaceIds: ["workspace"] });
    expect(createCalled).toBe(false);
  });

  test("rejects unknown user", async () => {
    const service = new InviteService(
      createPrismaMock({
        user: { findUnique: async () => null },
        workspace: { findMany: async () => [{ id: "workspace" }] },
      }),
    );

    await expect(
      service.addMemberByEmail(
        { workspaceIds: ["workspace"] },
        "m@test.com",
        "owner",
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test("requires at least one workspace", async () => {
    const service = new InviteService(createPrismaMock());

    await expect(
      service.addMemberByEmail({ workspaceIds: [] }, "m@test.com", "owner"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  test("rejects unavailable workspace", async () => {
    const service = new InviteService(
      createPrismaMock({
        workspace: { findMany: async () => [] },
      }),
    );

    await expect(
      service.addMemberByEmail(
        { workspaceIds: ["missing"] },
        "m@test.com",
        "owner",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
