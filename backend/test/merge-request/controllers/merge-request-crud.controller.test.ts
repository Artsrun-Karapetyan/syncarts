import "reflect-metadata";

import { describe, expect, mock, test } from "bun:test";

import { MergeRequestController } from "../../../src/merge-request/merge-request.controller.js";
import type { MergeRequestService } from "../../../src/merge-request/merge-request.service.js";

describe("MergeRequestController CRUD", () => {
  const req = { authUser: { id: "user-1" } };

  test("create delegates to mrService.createMergeRequest", async () => {
    const mockService = {
      createMergeRequest: mock(async (data: any) => ({ id: "mr-1", ...data })),
    } as unknown as MergeRequestService;

    const controller = new MergeRequestController(mockService);
    const body = {
      title: "Test MR",
      sourceWorkspaceId: "ws-1",
      targetWorkspaceId: "ws-2",
      sourceCollectionId: "col-1",
      targetCollectionId: "col-2",
    };
    const result = await controller.create(req, body);

    expect(mockService.createMergeRequest).toHaveBeenCalledWith({
      ...body,
      authorId: "user-1",
    });
    expect(result.id).toBe("mr-1");
  });

  test("findByWorkspace delegates to mrService.getMergeRequestsForWorkspace", async () => {
    const mockService = {
      getMergeRequestsForWorkspace: mock(
        async (_workspaceId: string, _userId: string) => [{ id: "mr-1" }],
      ),
    } as unknown as MergeRequestService;

    const controller = new MergeRequestController(mockService);
    const result = await controller.findByWorkspace(req, "ws-1", {});

    expect(mockService.getMergeRequestsForWorkspace).toHaveBeenCalledWith(
      "ws-1",
      "user-1",
      { skip: undefined, take: undefined },
    );
    expect(result).toEqual([{ id: "mr-1" }] as any);
  });

  test("findOne delegates to mrService.getMergeRequestById", async () => {
    const mockService = {
      getMergeRequestById: mock(async (_id: string, _userId: string) => ({
        id: "mr-1",
      })),
    } as unknown as MergeRequestService;

    const controller = new MergeRequestController(mockService);
    const result = await controller.findOne(req, "mr-1");

    expect(mockService.getMergeRequestById).toHaveBeenCalledWith(
      "mr-1",
      "user-1",
    );
    expect(result).toEqual({ id: "mr-1" } as any);
  });
});
