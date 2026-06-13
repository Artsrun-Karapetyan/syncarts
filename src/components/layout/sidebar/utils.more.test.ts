import { describe, expect, it } from "bun:test";

import type { Collection } from "../../../contexts/WorkspaceContext";
import {
  filterCollections,
  findRequestPath,
  renameMatchingItem,
} from "./utils";

const collections: Collection[] = [
  {
    id: "collection-1",
    name: "API",
    items: [
      {
        type: "folder",
        id: "folder-1",
        name: "Users",
        items: [
          {
            type: "request",
            id: "request-1",
            name: "Get Users",
            method: "GET",
            url: "/users",
            headers: [],
            authType: "inherit",
            bodyType: "raw",
            body: "",
          },
        ],
      },
    ],
  },
];

describe("sidebar utils more cases", () => {
  it("returns the original collections when query is empty", () => {
    expect(filterCollections(collections, "")).toBe(collections);
  });

  it("returns null when a request path is missing", () => {
    expect(findRequestPath(collections, "missing")).toBeNull();
  });

  it("renames a matching nested item through the collection id", () => {
    const calls: string[][] = [];

    renameMatchingItem({
      collections,
      targetId: "request-1",
      newName: "Renamed",
      renameItem: (collectionId, itemId, name) => {
        calls.push([collectionId, itemId, name]);
      },
    });

    expect(calls).toEqual([["collection-1", "request-1", "Renamed"]]);
  });
});
