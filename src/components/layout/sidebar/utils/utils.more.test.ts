import { describe, expect, it } from "bun:test";

import {
  filterCollections,
  findFolder,
  findRequest,
  findRequestPath,
  renameMatchingItem,
} from "@/components/layout/sidebar/utils/utils";
import type { Collection } from "@/contexts/WorkspaceContext";

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

  it("finds deeply nested folders and requests", () => {
    const deepCollections: Collection[] = [
      {
        id: "c-1",
        name: "C1",
        items: [
          {
            type: "folder",
            id: "f-1",
            name: "F1",
            items: [
              {
                type: "folder",
                id: "f-2",
                name: "F2",
                items: [
                  {
                    type: "request",
                    id: "r-1",
                    name: "R1",
                    method: "GET",
                    url: "",
                    headers: [],
                    authType: "inherit",
                    bodyType: "raw",
                    body: "",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    expect(findFolder(deepCollections[0].items, "f-2")?.name).toBe("F2");
    expect(findRequest(deepCollections[0].items, "r-1")?.name).toBe("R1");
    expect(findFolder(deepCollections[0].items, "missing")).toBeUndefined();
    expect(findRequest(deepCollections[0].items, "missing")).toBeUndefined();
  });

  it("filters collections and matches nested folder children", () => {
    const deepCollections: Collection[] = [
      {
        id: "c-1",
        name: "C1",
        items: [
          {
            type: "folder",
            id: "f-1",
            name: "F1",
            items: [
              {
                type: "request",
                id: "r-1",
                name: "Target",
                method: "GET",
                url: "",
                headers: [],
                authType: "inherit",
                bodyType: "raw",
                body: "",
              },
            ],
          },
        ],
      },
      {
        id: "c-2",
        name: "Target Collection",
        items: [],
      },
      {
        id: "c-3",
        name: "Empty",
        items: [{ type: "folder", id: "empty", name: "empty", items: [] }],
      },
    ];

    const result = filterCollections(deepCollections, "Target");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("c-1");
    // @ts-expect-error test
    expect(result[0].items[0].items[0].id).toBe("r-1");
    expect(result[1].id).toBe("c-2");
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

  it("renames the collection itself", () => {
    const calls: string[][] = [];

    renameMatchingItem({
      collections,
      targetId: "collection-1",
      newName: "Renamed Collection",
      renameItem: (collectionId, itemId, name) => {
        calls.push([collectionId, itemId, name]);
      },
    });

    expect(calls).toEqual([
      ["collection-1", "collection-1", "Renamed Collection"],
    ]);
  });

  it("does nothing if item to rename is not found", () => {
    const calls: string[][] = [];

    renameMatchingItem({
      collections,
      targetId: "missing",
      newName: "Renamed",
      renameItem: (collectionId, itemId, name) => {
        calls.push([collectionId, itemId, name]);
      },
    });

    expect(calls).toEqual([]);
  });

  it("renames an example inside a request", () => {
    const collectionsWithExample: Collection[] = [
      {
        id: "c-1",
        name: "C1",
        items: [
          {
            type: "request",
            id: "r-1",
            name: "R1",
            method: "GET",
            url: "",
            headers: [],
            authType: "inherit",
            bodyType: "raw",
            body: "",
            examples: [
              {
                id: "e-1",
                name: "Example 1",
                request: null as any,
                response: null as any,
              },
            ],
          },
        ],
      },
    ];

    const calls: string[][] = [];
    renameMatchingItem({
      collections: collectionsWithExample,
      targetId: "e-1",
      newName: "Renamed Example",
      renameItem: (collectionId, itemId, name) => {
        calls.push([collectionId, itemId, name]);
      },
    });

    expect(calls).toEqual([["c-1", "e-1", "Renamed Example"]]);
  });
});
