import "reflect-metadata";

import { describe, expect, mock, test } from "bun:test";

import { WorkspaceController } from "../../../src/workspace/workspace.controller.js";
import type { WorkspaceService } from "../../../src/workspace/workspace.service.js";

describe("WorkspaceController CRUD and Sync", () => {
  const req = { authUser: { id: "user-1" } };

  test("create delegates to workspaceService.createWorkspace", async () => {
    const mockService = {
      createWorkspace: mock(async (name: string, _userId: string) => ({
        id: "1",
        name,
        ownerId: "user-1",
      })),
    } as unknown as WorkspaceService;

    const controller = new WorkspaceController(mockService);
    const result = await controller.create(req, { name: "My Workspace" });

    expect(mockService.createWorkspace).toHaveBeenCalledWith(
      "My Workspace",
      "user-1",
    );
    expect(result).toEqual({
      id: "1",
      name: "My Workspace",
      ownerId: "user-1",
    } as any);
  });

  test("findAll delegates to workspaceService.getWorkspacesForUser", async () => {
    const mockService = {
      getWorkspacesForUser: mock(async (_userId: string) => [{ id: "1" }]),
    } as unknown as WorkspaceService;

    const controller = new WorkspaceController(mockService);
    const result = await controller.findAll(req);

    expect(mockService.getWorkspacesForUser).toHaveBeenCalledWith("user-1");
    expect(result).toEqual([{ id: "1" }] as any);
  });

  test("findOne filters workspaces for the user", async () => {
    const mockService = {
      getWorkspacesForUser: mock(async (_userId: string) => [
        { id: "1" },
        { id: "2" },
      ]),
    } as unknown as WorkspaceService;

    const controller = new WorkspaceController(mockService);
    const result = await controller.findOne(req, "2");

    expect(mockService.getWorkspacesForUser).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({ id: "2" } as any);
  });

  test("findOne throws error if not found", async () => {
    const mockService = {
      getWorkspacesForUser: mock(async (_userId: string) => [{ id: "1" }]),
    } as unknown as WorkspaceService;

    const controller = new WorkspaceController(mockService);

    expect(controller.findOne(req, "3")).rejects.toThrow(
      "Workspace not found or unauthorized",
    );
  });

  test("delete delegates to workspaceService.deleteWorkspace", async () => {
    const mockService = {
      deleteWorkspace: mock(async (id: string, _userId: string) => ({
        status: "deleted",
        workspaceId: id,
      })),
    } as unknown as WorkspaceService;

    const controller = new WorkspaceController(mockService);
    const result = await controller.delete(req, "1");

    expect(mockService.deleteWorkspace).toHaveBeenCalledWith("1", "user-1");
    expect(result).toEqual({ status: "deleted", workspaceId: "1" } as any);
  });

  test("syncData delegates to workspaceService.syncWorkspace", async () => {
    const mockService = {
      syncWorkspace: mock(async (_id: string, _body: any, _userId: string) => ({
        synced: true,
      })),
    } as unknown as WorkspaceService;

    const controller = new WorkspaceController(mockService);
    const body = { data: "test" };
    const result = await controller.syncData(req, "1", body);

    expect(mockService.syncWorkspace).toHaveBeenCalledWith("1", body, "user-1");
    expect(result).toEqual({ synced: true } as any);
  });
});
