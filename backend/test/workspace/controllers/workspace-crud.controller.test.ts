import "reflect-metadata";

import { describe, expect, mock, test } from "bun:test";
import { lastValueFrom, of } from "rxjs";

import { WorkspaceController } from "../../../src/workspace/workspace.controller.js";
import type { WorkspaceService } from "../../../src/workspace/workspace.service.js";

describe("WorkspaceController CRUD and Sync", () => {
  const req = { authUser: { id: "user-1" } } as any;
  const requestService = {} as any;

  test("create delegates to workspaceService.createWorkspace", async () => {
    const mockService = {
      createWorkspace: mock(async (name: string, _userId: string) => ({
        id: "1",
        name,
        ownerId: "user-1",
      })),
    } as unknown as WorkspaceService;

    const controller = new WorkspaceController(
      mockService,
      requestService,
      {} as any,
    );
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

    const controller = new WorkspaceController(
      mockService,
      requestService,
      {} as any,
    );
    const result = await controller.findAll(req);

    expect(mockService.getWorkspacesForUser).toHaveBeenCalledWith("user-1");
    expect(result).toEqual([{ id: "1" }] as any);
  });

  test("findOne delegates to workspaceService.getWorkspaceForUser", async () => {
    const mockService = {
      getWorkspaceForUser: mock(async (_id: string, _userId: string) => ({
        id: "2",
      })),
    } as unknown as WorkspaceService;

    const controller = new WorkspaceController(
      mockService,
      requestService,
      {} as any,
    );
    const result = await controller.findOne(req, "2");

    expect(mockService.getWorkspaceForUser).toHaveBeenCalledWith("2", "user-1");
    expect(result).toEqual({ id: "2" } as any);
  });

  test("findOne throws error if not found", async () => {
    const mockService = {
      getWorkspaceForUser: mock(async () => {
        throw new Error("Workspace not found or unauthorized");
      }),
    } as unknown as WorkspaceService;

    const controller = new WorkspaceController(
      mockService,
      requestService,
      {} as any,
    );

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

    const controller = new WorkspaceController(
      mockService,
      requestService,
      {} as any,
    );
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

    const controller = new WorkspaceController(
      mockService,
      requestService,
      {} as any,
    );
    const body = { data: "test" };
    const result = await controller.syncData(req, "1", body);

    expect(mockService.syncWorkspace).toHaveBeenCalledWith("1", body, "user-1");
    expect(result).toEqual({ synced: true } as any);
  });

  test("getRequest delegates to workspaceRequestService.getRequestForUser", async () => {
    const mockService = {} as any;
    const requestServiceMock = {
      getRequestForUser: mock(async () => ({ id: "req-1" })),
    } as any;
    const controller = new WorkspaceController(
      mockService,
      requestServiceMock,
      {} as any,
    );

    const result = await controller.getRequest(req, "ws-1", "req-1");
    expect(requestServiceMock.getRequestForUser).toHaveBeenCalledWith(
      "ws-1",
      "req-1",
      "user-1",
    );
    expect(result).toEqual({ id: "req-1" } as any);
  });

  test("updateRequest delegates to workspaceRequestService.updateRequestForUser", async () => {
    const mockService = {} as any;
    const requestServiceMock = {
      updateRequestForUser: mock(async () => ({ id: "req-1", version: 2 })),
    } as any;
    const controller = new WorkspaceController(
      mockService,
      requestServiceMock,
      {} as any,
    );

    const body = { collectionId: "c-1", version: 1 };
    const result = await controller.updateRequest(req, "ws-1", "req-1", body);

    expect(requestServiceMock.updateRequestForUser).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      requestId: "req-1",
      userId: "user-1",
      data: body,
    });
    expect(result).toEqual({ id: "req-1", version: 2 } as any);
  });

  test("events returns an observable that verifies access and streams", async () => {
    const mockService = {
      ensureWorkspaceAccess: mock(async () => true),
    } as any;
    const realtimeService = {
      stream: mock(() => of({ data: "event" })),
    } as any;
    const controller = new WorkspaceController(
      mockService,
      {} as any,
      realtimeService,
    );

    const obs$ = controller.events(req, "ws-1");
    const result = await lastValueFrom(obs$);

    expect(mockService.ensureWorkspaceAccess).toHaveBeenCalledWith(
      "ws-1",
      "user-1",
    );
    expect(realtimeService.stream).toHaveBeenCalledWith("ws-1");
    expect(result).toEqual({ data: "event" } as any);
  });
});
