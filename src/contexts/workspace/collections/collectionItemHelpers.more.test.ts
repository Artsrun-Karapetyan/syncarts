import { describe, expect, test } from "bun:test";

import type { Folder, SavedRequest } from "../core/types";
import {
  deleteExampleFromItems,
  renameItemInItems,
} from "./collectionItemHelpers";

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
  });
});
