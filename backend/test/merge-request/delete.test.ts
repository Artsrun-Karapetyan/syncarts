import { describe, expect, mock, test } from "bun:test";

import { MergeRequestService } from "../../src/merge-request/merge-request.service";
import { createPrismaMock } from "../helpers/prismaMock";

describe("MergeRequestService delete", () => {
  test("deletes merge request if user is author", async () => {
    const deleteMock = mock();
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            authorId: "user-1",
            targetWorkspaceId: "ws-1",
          }),
          delete: deleteMock,
        },
        workspace: {
          findUnique: async () => ({
            id: "ws-1",
            ownerId: "user-2",
          }),
        },
      }),
    );

    await service.deleteMergeRequest("mr", "user-1");
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "mr" } });
  });

  test("deletes merge request if user is target workspace owner", async () => {
    const deleteMock = mock();
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            authorId: "user-1",
            targetWorkspaceId: "ws-1",
          }),
          delete: deleteMock,
        },
        workspace: {
          findUnique: async () => ({
            id: "ws-1",
            ownerId: "user-2",
          }),
        },
      }),
    );

    await service.deleteMergeRequest("mr", "user-2");
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "mr" } });
  });

  test("throws error if user is neither author nor target owner", async () => {
    const deleteMock = mock();
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            authorId: "user-1",
            targetWorkspaceId: "ws-1",
          }),
          delete: deleteMock,
        },
        workspace: {
          findUnique: async () => ({
            id: "ws-1",
            ownerId: "user-2",
          }),
        },
      }),
    );

    await expect(
      service.deleteMergeRequest("mr", "random-user"),
    ).rejects.toThrow(
      "Only the author or the target workspace owner can delete this merge request",
    );
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
