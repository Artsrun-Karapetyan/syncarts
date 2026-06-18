import { describe, expect, test } from "bun:test";

import type { Collection, Workspace } from "../core/types";
import {
  createPulledForkCollection,
  getWorkspaceCollections,
  replaceCollectionInWorkspace,
} from "./collectionPullHelpers";

describe("collection pull helpers", () => {
  test("pull keeps fork identity and replaces source-backed content", () => {
    const fork: Collection = {
      id: "fork",
      name: "Local fork name",
      items: [],
      fork: {
        originalWorkspaceId: "source-workspace",
        originalCollectionId: "source",
        forkedAt: 1,
      },
    };
    const source: Collection = {
      id: "source",
      name: "Source",
      description: "Latest",
      items: [
        {
          type: "request",
          id: "request",
          name: "New",
          method: "GET",
          url: "/",
          headers: [],
          body: "",
        },
      ],
    };

    expect(createPulledForkCollection(fork, source)).toMatchObject({
      id: "fork",
      name: "Local fork name",
      description: "Latest",
      fork: fork.fork,
      items: source.items,
    });
  });

  test("replaceCollectionInWorkspace updates only the target workspace collection", () => {
    const replacement = { id: "collection", name: "Updated", items: [] };
    const workspaces: Workspace[] = [
      {
        id: "workspace",
        name: "Workspace",
        collections: [{ id: "collection", name: "Old", items: [] }],
      },
      {
        id: "other",
        name: "Other",
        collections: [{ id: "collection", name: "Other old", items: [] }],
      },
    ];

    const result = replaceCollectionInWorkspace(
      workspaces,
      "workspace",
      "collection",
      replacement,
    );

    expect(result[0].collections[0].name).toBe("Updated");
    expect(result[1].collections[0].name).toBe("Other old");
  });

  test("getWorkspaceCollections supports full and normalized API responses", () => {
    const collections = [{ id: "collection", name: "API", items: [] }];

    expect(getWorkspaceCollections({ collections })).toBe(collections);
    expect(getWorkspaceCollections({ data: { collections } })).toBe(
      collections,
    );
    expect(getWorkspaceCollections({})).toEqual([]);
  });
});
