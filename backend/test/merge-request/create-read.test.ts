import { describe, expect, test } from "bun:test";

import { MergeRequestService } from "../../src/merge-request/merge-request.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("MergeRequestService create/read", () => {
  test("createMergeRequest requires target workspace", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        workspace: { findUnique: async () => null },
      }),
    );

    await expect(
      service.createMergeRequest({
        title: "MR",
        sourceWorkspaceId: "source",
        targetWorkspaceId: "target",
        sourceCollectionId: "source-col",
        targetCollectionId: "target-col",
        authorId: "author",
      }),
    ).rejects.toThrow("Target workspace not found");
  });

  test("createMergeRequest stores open merge request", async () => {
    let createData: any;
    const service = new MergeRequestService(
      createPrismaMock({
        workspace: { findUnique: async () => ({ id: "target" }) },
        mergeRequest: {
          create: async ({ data }: any) => {
            createData = data;
            return { id: "mr", ...data };
          },
        },
      }),
    );

    const result = await service.createMergeRequest({
      title: "MR",
      description: "Changes",
      sourceWorkspaceId: "source",
      targetWorkspaceId: "target",
      sourceCollectionId: "source-col",
      targetCollectionId: "target-col",
      authorId: "author",
      data: { id: "source-col" },
    });

    expect(result.status).toBe("OPEN");
    expect(createData.authorId).toBe("author");
  });

  test("getMergeRequestsForWorkspace includes source and target workspaces", async () => {
    let query: any;
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findMany: async (input: any) => {
            query = input;
            return [];
          },
        },
      }),
    );

    await service.getMergeRequestsForWorkspace("workspace");

    expect(query.where.OR).toEqual([
      { targetWorkspaceId: "workspace" },
      { sourceWorkspaceId: "workspace" },
    ]);
    expect(query.orderBy).toEqual({ createdAt: "desc" });
  });
});
