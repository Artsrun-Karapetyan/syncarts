import { describe, expect, test } from "bun:test";

import { MergeRequestService } from "../../src/merge-request/merge-request.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("MergeRequestService source collection", () => {
  test("returns stored MR data first", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({ id: "mr", data: { id: "collection" } }),
        },
      }),
    );

    await expect(service.getSourceCollection("mr")).resolves.toEqual({
      id: "collection",
    });
  });

  test("falls back to source workspace data", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            sourceWorkspaceId: "source",
            sourceCollectionId: "collection",
            data: null,
          }),
        },
        workspace: {
          findUnique: async () => ({
            data: {
              collections: [{ id: "collection", name: "API" }],
            },
          }),
        },
      }),
    );

    await expect(service.getSourceCollection("mr")).resolves.toEqual({
      id: "collection",
      name: "API",
    });
  });

  test("rejects missing merge request", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: { findUnique: async () => null },
      }),
    );

    await expect(service.getSourceCollection("missing")).rejects.toThrow(
      "Merge request not found",
    );
  });

  test("rejects missing fallback workspace data", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            sourceWorkspaceId: "source",
            sourceCollectionId: "collection",
            data: null,
          }),
        },
        workspace: { findUnique: async () => null },
      }),
    );

    await expect(service.getSourceCollection("mr")).rejects.toThrow(
      "Source workspace not found or empty",
    );
  });

  test("treats missing fallback collections as empty", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            sourceWorkspaceId: "source",
            sourceCollectionId: "collection",
            data: null,
          }),
        },
        workspace: { findUnique: async () => ({ data: {} }) },
      }),
    );

    await expect(service.getSourceCollection("mr")).rejects.toThrow(
      "Source collection not found in workspace",
    );
  });

  test("rejects missing fallback collection", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            sourceWorkspaceId: "source",
            sourceCollectionId: "missing",
            data: null,
          }),
        },
        workspace: {
          findUnique: async () => ({
            data: { collections: [{ id: "collection", name: "API" }] },
          }),
        },
      }),
    );

    await expect(service.getSourceCollection("mr")).rejects.toThrow(
      "Source collection not found in workspace",
    );
  });
});
