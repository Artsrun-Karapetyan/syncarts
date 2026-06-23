import { describe, expect, test } from "bun:test";

import {
  addExampleToItems,
  addRequestToFolder,
  deleteExampleFromItems,
  hasRequestInTarget,
  removeRequestFromItems,
  renameItemInItems,
  sortItemsByTarget,
} from "@/contexts/workspace/collections/collectionItemHelpers";
import type { Folder, SavedRequest } from "@/contexts/workspace/core/types";

const request: SavedRequest = {
  type: "request",
  id: "request",
  name: "Request",
  method: "GET",
  url: "/",
  headers: [],
  body: "",
  examples: [
    {
      id: "example",
      name: "Example",
      code: 200,
      status: "OK",
      body: "",
      headers: [],
    },
  ],
};

describe("collectionItemHelpers extra cases", () => {
  test("renames examples and deletes examples inside nested requests", () => {
    const items: (Folder | SavedRequest)[] = [
      { type: "folder", id: "folder", name: "Folder", items: [request] },
    ];
    const renamed = renameItemInItems(items, "example", "Renamed");
    const nestedRequest = (renamed[0] as Folder).items[0] as SavedRequest;
    const deleted = deleteExampleFromItems(renamed, "request", "example");
    const deletedRequest = (deleted[0] as Folder).items[0] as SavedRequest;

    expect(nestedRequest.examples?.[0].name).toBe("Renamed");
    expect(deletedRequest.examples).toEqual([]);

    // Cover lines 102-103, 152-153 fallback
    expect(renameItemInItems([request], "unknown", "Renamed")).toEqual([
      request,
    ]);
    expect(deleteExampleFromItems([request], "unknown", "example")).toEqual([
      request,
    ]);
  });

  test("removeRequestFromItems removes deeply nested request", () => {
    const items: (Folder | SavedRequest)[] = [
      {
        type: "folder",
        id: "folder-1",
        name: "Folder 1",
        items: [
          {
            type: "folder",
            id: "folder-2",
            name: "Folder 2",
            items: [request],
          },
        ],
      },
      request,
    ];

    const result = removeRequestFromItems(items, "request");
    // Should remove both top level and deeply nested
    expect(((result[0] as Folder).items[0] as Folder).items).toEqual([]);
    expect(result.length).toBe(1);
  });

  test("addRequestToFolder adds to deep nested folder", () => {
    const items: (Folder | SavedRequest)[] = [
      {
        type: "folder",
        id: "folder-1",
        name: "Folder 1",
        items: [{ type: "folder", id: "target", name: "Target", items: [] }],
      },
    ];

    const result = addRequestToFolder(items, "target", request);
    expect(((result[0] as Folder).items[0] as Folder).items).toHaveLength(1);
  });

  test("addExampleToItems adds example to nested folder request", () => {
    const items: (Folder | SavedRequest)[] = [
      { type: "folder", id: "folder-1", name: "Folder 1", items: [request] },
    ];
    const result = addExampleToItems(items, "request", "New Ex", undefined);
    const req = (result[0] as Folder).items[0] as SavedRequest;
    expect(req.examples?.length).toBe(2);
    expect(req.examples?.[1].name).toBe("New Ex");
  });

  test("sortItemsByTarget az and target folder", () => {
    const aReq: SavedRequest = { ...request, id: "a", name: "A" };
    const bReq: SavedRequest = { ...request, id: "b", name: "B" };
    const items: (Folder | SavedRequest)[] = [
      { type: "folder", id: "target", name: "Target", items: [bReq, aReq] },
      bReq,
      aReq,
    ];

    // default sorts folders first but az sorts purely by name
    const sorted = sortItemsByTarget(items, "target", "az");
    // Top-level is not sorted, only the target folder
    expect(sorted[0].name).toBe("Target");

    // the target folder's items should also be sorted
    const targetFolder = sorted[0] as Folder;
    expect(targetFolder.items[0].name).toBe("A");
    expect(targetFolder.items[1].name).toBe("B");
  });

  test("hasRequestInTarget covers deeply nested folder not found", () => {
    const items: (Folder | SavedRequest)[] = [
      { type: "folder", id: "folder-1", name: "Folder 1", items: [] },
    ];
    // This covers findFolder nested recursion returning null
    expect(hasRequestInTarget(items, "missing-folder", "request")).toBe(false);
  });
});
