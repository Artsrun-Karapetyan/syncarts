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
    ).rejects.toThrow("Unauthorized to update this merge request");
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

  test("allows merge request author", async () => {
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
    ).resolves.toMatchObject({ id: "mr", status: "CLOSED" });
  });

  test("allows target workspace member", async () => {
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
    ).resolves.toMatchObject({ id: "mr", status: "REJECTED" });
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
