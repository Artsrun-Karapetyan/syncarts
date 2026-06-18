import { describe, expect, test } from "bun:test";

import { MergeRequestService } from "../../src/merge-request/merge-request.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("MergeRequestService target collection", () => {
  test("returns stored target data snapshot", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            authorId: "author",
            targetWorkspaceId: "target",
            targetData: { id: "target-col", name: "API" },
          }),
        },
      }),
    );

    await expect(service.getTargetCollection("mr", "author")).resolves.toEqual({
      id: "target-col",
      name: "API",
    });
  });

  test("rejects when target snapshot is missing", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            authorId: "author",
            targetWorkspaceId: "target",
            targetCollectionId: "col",
            targetData: null,
          }),
        },
      }),
    );

    await expect(service.getTargetCollection("mr", "author")).rejects.toThrow(
      "Merge request has no target snapshot",
    );
  });

  test("rejects missing merge request", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: { findUnique: async () => null },
      }),
    );

    await expect(
      service.getTargetCollection("missing", "author"),
    ).rejects.toThrow("Merge request not found");
  });
});
