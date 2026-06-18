import { describe, expect, test } from "bun:test";

import { MergeRequestService } from "../../src/merge-request/merge-request.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("MergeRequestService status", () => {
  test("blocks outsiders", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            authorId: "author",
            targetWorkspaceId: "target",
          }),
        },
        workspace: { findUnique: async () => ({ ownerId: "owner" }) },
        workspaceMember: { findUnique: async () => null },
      }),
    );

    await expect(
      service.updateMergeRequestStatus("mr", "MERGED", "outsider"),
    ).rejects.toThrow(
      "Only the target workspace owner can update this merge request",
    );
  });

  test("allows target owner", async () => {
    let updateData: any;
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            authorId: "author",
            targetWorkspaceId: "target",
          }),
          update: async ({ data }: any) => {
            updateData = data;
            return { id: "mr", ...data };
          },
        },
        workspace: { findUnique: async () => ({ ownerId: "owner" }) },
        workspaceMember: { findUnique: async () => null },
      }),
    );

    const result = await service.updateMergeRequestStatus(
      "mr",
      "MERGED",
      "owner",
    );

    expect(result.status).toBe("MERGED");
    expect(updateData.updatedAt).toBeInstanceOf(Date);
  });

  test("blocks merge request author", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            authorId: "author",
            targetWorkspaceId: "target",
          }),
          update: async ({ data }: any) => ({ id: "mr", ...data }),
        },
        workspace: { findUnique: async () => ({ ownerId: "owner" }) },
        workspaceMember: { findUnique: async () => null },
      }),
    );

    await expect(
      service.updateMergeRequestStatus("mr", "CLOSED", "author"),
    ).rejects.toThrow(
      "Only the target workspace owner can update this merge request",
    );
  });

  test("blocks target workspace member", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async () => ({
            id: "mr",
            authorId: "author",
            targetWorkspaceId: "target",
          }),
          update: async ({ data }: any) => ({ id: "mr", ...data }),
        },
        workspace: { findUnique: async () => ({ ownerId: "owner" }) },
        workspaceMember: { findUnique: async () => ({ userId: "member" }) },
      }),
    );

    await expect(
      service.updateMergeRequestStatus("mr", "REJECTED", "member"),
    ).rejects.toThrow(
      "Only the target workspace owner can update this merge request",
    );
  });

  test("rejects missing merge request", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: { findUnique: async () => null },
      }),
    );

    await expect(
      service.updateMergeRequestStatus("missing", "MERGED", "user"),
    ).rejects.toThrow("Merge request not found");
  });
});
