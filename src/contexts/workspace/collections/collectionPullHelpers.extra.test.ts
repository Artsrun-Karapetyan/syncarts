import { describe, expect, mock, test } from "bun:test";

import { api } from "@/lib/api";

import {
  getWorkspaceCollections,
  pullForkCollection,
} from "./collectionPullHelpers";

describe("collectionPullHelpers extra cases", () => {
  test("getWorkspaceCollections variations", () => {
    expect(
      getWorkspaceCollections({
        data: { collections: [{ id: "c1" }] },
      } as any)[0].id,
    ).toBe("c1");
    expect(
      getWorkspaceCollections({ collections: [{ id: "c2" }] } as any)[0].id,
    ).toBe("c2");
    expect(getWorkspaceCollections({} as any)).toEqual([]);
  });

  test("pullForkCollection throws if not a fork", async () => {
    const update = mock();
    expect(
      pullForkCollection({
        activeWorkspaceId: "w1",
        collectionId: "c1",
        updateWorkspaces: update,
        workspaces: [{ id: "w1", collections: [{ id: "c1" }] }] as any[],
      }),
    ).rejects.toThrow("Only forked collections can pull changes");
  });

  test("pullForkCollection executes pull", async () => {
    const update = mock();
    api.get = mock().mockResolvedValue({
      data: { collections: [{ id: "origC1", name: "OriginalName" }] },
    });

    await pullForkCollection({
      activeWorkspaceId: "w1",
      collectionId: "c1",
      updateWorkspaces: (cb: any) => {
        const res = cb([{ id: "w1", collections: [{ id: "c1" }] }]);
        update(res);
      },
      workspaces: [
        {
          id: "w1",
          collections: [
            {
              id: "c1",
              fork: {
                originalWorkspaceId: "w2",
                originalCollectionId: "origC1",
              },
            },
          ],
        },
      ] as any[],
    });

    expect(update).toHaveBeenCalled();
  });
});
