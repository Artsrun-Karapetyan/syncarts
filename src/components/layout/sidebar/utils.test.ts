import { describe, expect, it } from "bun:test";

import type {
  Collection,
  Folder,
  SavedRequest,
} from "../../../contexts/WorkspaceContext";
import {
  countItems,
  filterCollections,
  findFolder,
  findRequest,
  findRequestPath,
} from "./utils";

const request: SavedRequest = {
  type: "request",
  id: "request-1",
  name: "Get Users",
  method: "GET",
  url: "/users",
  headers: [],
  authType: "inherit",
  bodyType: "raw",
  body: "",
};

const folder: Folder = {
  type: "folder",
  id: "folder-1",
  name: "Users",
  items: [request],
};

const collections: Collection[] = [
  {
    id: "collection-1",
    name: "API",
    items: [folder],
  },
];

describe("sidebar utils", () => {
  it("counts requests inside nested folders", () => {
    expect(countItems(collections[0].items)).toBe(1);
  });

  it("finds nested folders and requests", () => {
    expect(findFolder(collections[0].items, "folder-1")).toBe(folder);
    expect(findRequest(collections[0].items, "request-1")).toBe(request);
  });

  it("finds a request path", () => {
    expect(findRequestPath(collections, "request-1")).toEqual({
      collectionId: "collection-1",
      folderIds: ["folder-1"],
    });
  });

  it("filters collections by nested request name", () => {
    expect(filterCollections(collections, "users")).toEqual(collections);
  });
});
