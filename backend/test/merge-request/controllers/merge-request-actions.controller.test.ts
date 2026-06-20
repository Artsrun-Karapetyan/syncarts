import "reflect-metadata";

import { describe, expect, mock, test } from "bun:test";

import { MergeRequestController } from "../../../src/merge-request/merge-request.controller.js";
import type { MergeRequestService } from "../../../src/merge-request/merge-request.service.js";

describe("MergeRequestController Actions", () => {
  const req = { authUser: { id: "user-1" } } as any;

  test("updateStatus delegates to mrService.updateMergeRequestStatus", async () => {
    const mockService = {
      updateMergeRequestStatus: mock(
        async (_id: string, _status: string, _userId: string) => ({
          id: "mr-1",
          status: "MERGED",
        }),
      ),
    } as unknown as MergeRequestService;

    const controller = new MergeRequestController(mockService);
    const result = await controller.updateStatus(req, "mr-1", {
      status: "MERGED",
    });

    expect(mockService.updateMergeRequestStatus).toHaveBeenCalledWith(
      "mr-1",
      "MERGED",
      "user-1",
    );
    expect(result).toEqual({ id: "mr-1", status: "MERGED" } as any);
  });

  test("getSourceCollection delegates to mrService.getSourceCollection", async () => {
    const mockService = {
      getSourceCollection: mock(async (_id: string, _userId: string) => ({
        items: [],
      })),
    } as unknown as MergeRequestService;

    const controller = new MergeRequestController(mockService);
    const result = await controller.getSourceCollection(req, "mr-1");

    expect(mockService.getSourceCollection).toHaveBeenCalledWith(
      "mr-1",
      "user-1",
    );
    expect(result).toEqual({ items: [] } as any);
  });
});
