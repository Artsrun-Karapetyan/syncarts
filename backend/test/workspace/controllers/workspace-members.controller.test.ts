import "reflect-metadata";

import { describe, expect, mock, test } from "bun:test";

import { WorkspaceController } from "../../../src/workspace/workspace.controller.js";
import type { WorkspaceService } from "../../../src/workspace/workspace.service.js";

describe("WorkspaceController Members Management", () => {
  const req = { authUser: { id: "user-1" } } as any;
  const requestService = {} as any;

  test("removeMember delegates to workspaceService.removeMember", async () => {
    const mockService = {
      removeMember: mock(
        async (_workspaceId: string, _memberId: string, _userId: string) => ({
          removed: true,
        }),
      ),
    } as unknown as WorkspaceService;

    const controller = new WorkspaceController(
      mockService,
      requestService,
      {} as any,
    );
    const result = await controller.removeMember(
      req,
      "workspace-1",
      "member-2",
    );

    expect(mockService.removeMember).toHaveBeenCalledWith(
      "workspace-1",
      "member-2",
      "user-1",
    );
    expect(result).toEqual({ removed: true } as any);
  });

  test("updateMemberRole delegates to workspaceService.updateMemberRole", async () => {
    const mockService = {
      updateMemberRole: mock(async (_params: any) => ({ updated: true })),
    } as unknown as WorkspaceService;

    const controller = new WorkspaceController(
      mockService,
      requestService,
      {} as any,
    );
    const params = { id: "workspace-1", memberUserId: "member-2" };
    const body = { role: "EDITOR" };

    const result = await controller.updateMemberRole(req, params, body);

    expect(mockService.updateMemberRole).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      memberUserId: "member-2",
      role: "EDITOR",
      userId: "user-1",
    });
    expect(result).toEqual({ updated: true } as any);
  });
});
