import { describe, expect, test } from "bun:test";

import { MergeRequestService } from "../../src/merge-request/merge-request.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("MergeRequestService create/read", () => {
  const workspaceAccess = {
    findFirst: async ({ where }: any) => ({
      id: where.id,
      ownerId:
        where.id === "source" || where.id === "source-workspace"
          ? "author"
          : "owner",
      members: [{ userId: "author", role: "EDITOR" }],
    }),
    findUnique: async () => ({ id: "target", ownerId: "owner" }),
  };

  test("createMergeRequest requires target workspace", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        workspace: { findFirst: async () => null },
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
        workspace: workspaceAccess,
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

  test("createMergeRequest stores collection targets and data", async () => {
    let createData: any;
    const service = new MergeRequestService(
      createPrismaMock({
        workspace: workspaceAccess,
        mergeRequest: {
          create: async ({ data }: any) => {
            createData = data;
            return { id: "mr", ...data };
          },
        },
      }),
    );

    await service.createMergeRequest({
      title: "Sync API",
      sourceWorkspaceId: "source-workspace",
      targetWorkspaceId: "target-workspace",
      sourceCollectionId: "source-collection",
      targetCollectionId: "target-collection",
      authorId: "author",
      data: { requests: [{ id: "request" }] },
    });

    expect(createData).toMatchObject({
      title: "Sync API",
      sourceWorkspaceId: "source-workspace",
      targetWorkspaceId: "target-workspace",
      sourceCollectionId: "source-collection",
      targetCollectionId: "target-collection",
      data: { requests: [{ id: "request" }] },
      status: "OPEN",
    });
  });

  test("getMergeRequestsForWorkspace queries target workspace only", async () => {
    let query: any;
    const service = new MergeRequestService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({ id: "workspace", ownerId: "owner" }),
        },
        mergeRequest: {
          findMany: async (input: any) => {
            query = input;
            return [];
          },
        },
      }),
    );

    await service.getMergeRequestsForWorkspace("workspace", "owner");

    expect(query.where).toEqual({ targetWorkspaceId: "workspace" });
    expect(query.orderBy).toEqual({ createdAt: "desc" });
  });

  test("getMergeRequestsForWorkspace hides target merge requests from members", async () => {
    const service = new MergeRequestService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({ id: "workspace", ownerId: "owner" }),
        },
        mergeRequest: {
          findMany: async () => {
            throw new Error("should not query merge requests");
          },
        },
      }),
    );

    await expect(
      service.getMergeRequestsForWorkspace("workspace", "member"),
    ).resolves.toEqual([]);
  });

  test("getMergeRequestsForWorkspace includes author summary", async () => {
    let query: any;
    const service = new MergeRequestService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({ id: "workspace", ownerId: "owner" }),
        },
        mergeRequest: {
          findMany: async (input: any) => {
            query = input;
            return [];
          },
        },
      }),
    );

    await service.getMergeRequestsForWorkspace("workspace", "owner");

    expect(query.include.author.select).toEqual({
      id: true,
      name: true,
      email: true,
    });
  });

  test("getMergeRequestById queries by id and includes author summary", async () => {
    let query: any;
    const service = new MergeRequestService(
      createPrismaMock({
        mergeRequest: {
          findUnique: async (input: any) => {
            query = input;
            return {
              id: "mr",
              authorId: "a",
              targetWorkspaceId: "target",
              author: { id: "a", name: "A", email: "a@test.com" },
            } as any;
          },
        },
      }),
    );

    await expect(service.getMergeRequestById("mr", "a")).resolves.toMatchObject(
      {
        id: "mr",
        author: { id: "a", name: "A", email: "a@test.com" },
      },
    );
    expect(query).toEqual({
      where: { id: "mr" },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  });

  test("createMergeRequest snapshots target collection from workspace when not provided", async () => {
    let createData: any;
    const service = new MergeRequestService(
      createPrismaMock({
        workspace: workspaceAccess,
        workspaceCollection: {
          findMany: async () => [
            {
              id: "col-1",
              name: "Users API",
              sortOrder: 0,
              folders: [],
              requests: [
                {
                  id: "req-1",
                  name: "List Users",
                  method: "GET",
                  url: "/users",
                  headers: [],
                  body: "",
                  sortOrder: 0,
                  folderId: null,
                  examples: [],
                },
              ],
            },
            {
              id: "col-2",
              name: "Other",
              sortOrder: 1,
              folders: [],
              requests: [],
            },
          ],
        },
        mergeRequest: {
          create: async ({ data }: any) => {
            createData = data;
            return { id: "mr", ...data };
          },
        },
      }),
    );

    await service.createMergeRequest({
      title: "Test",
      sourceWorkspaceId: "source",
      targetWorkspaceId: "target",
      sourceCollectionId: "source-col",
      targetCollectionId: "col-1",
      authorId: "author",
      data: { id: "source-col" },
      // targetData NOT provided
    });

    expect(createData.targetData).toMatchObject({
      id: "col-1",
      name: "Users API",
      items: [{ id: "req-1", type: "request" }],
    });
  });

  test("createMergeRequest uses client-provided targetData over server fetch", async () => {
    let createData: any;
    const service = new MergeRequestService(
      createPrismaMock({
        workspace: workspaceAccess,
        mergeRequest: {
          create: async ({ data }: any) => {
            createData = data;
            return { id: "mr", ...data };
          },
        },
      }),
    );

    await service.createMergeRequest({
      title: "Test",
      sourceWorkspaceId: "source",
      targetWorkspaceId: "target",
      sourceCollectionId: "source-col",
      targetCollectionId: "col-1",
      authorId: "author",
      data: { id: "source-col" },
      targetData: { id: "col-1", name: "Client Version" },
    });

    expect(createData.targetData).toEqual({
      id: "col-1",
      name: "Client Version",
    });
  });
});
