import { describe, expect, test } from "bun:test";

import { MergeRequestService } from "../../src/merge-request/merge-request.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("MergeRequestService source collection", () => {
  test("returns stored MR data snapshot", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            authorId: "author",
            targetWorkspaceId: "target",
            data: { id: "collection" },
          }),
        },
      }),
    );

    await expect(service.getSourceCollection("mr", "author")).resolves.toEqual({
      id: "collection",
    });
  });

  test("rejects when snapshot is missing", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            authorId: "author",
            targetWorkspaceId: "target",
            sourceWorkspaceId: "source",
            sourceCollectionId: "collection",
            data: null,
          }),
        },
      }),
    );

    await expect(service.getSourceCollection("mr", "author")).rejects.toThrow(
      "Merge request has no source snapshot",
    );
  });

  test("rejects missing merge request", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: { findUnique: async () => null },
      }),
    );

    await expect(
      service.getSourceCollection("missing", "author"),
    ).rejects.toThrow("Merge request not found");
  });
});
