import { describe, expect, test } from "bun:test";

import type { Folder, SavedRequest, TabData } from "../core/types";
import {
  addExampleToItems,
  addRequestToFolder,
  filterItemFromItems,
  hasRequestInTarget,
  sortItemsByTarget,
  updateRequestInItems,
} from "./collectionItemHelpers";

const request = (id: string, name = id): SavedRequest => ({
  type: "request",
  id,
  name,
  method: "GET",
  url: `/${id}`,
  headers: [],
  body: "",
});

const folder = (id: string, items: (Folder | SavedRequest)[] = []): Folder => ({
  type: "folder",
  id,
  name: id,
  items,
});

describe("collectionItemHelpers", () => {
  test("finds, updates, and moves requests inside nested folders", () => {
    const items = [folder("folder", [request("old")]), request("root")];
    const updated = updateRequestInItems(items, {
      ...request("old"),
      name: "Updated",
    });
    const moved = addRequestToFolder(
      filterItemFromItems(updated, "root"),
      "folder",
      request("root"),
    );

    expect(hasRequestInTarget(moved, "folder", "old")).toBe(true);
    expect(hasRequestInTarget(moved, null, "root")).toBe(false);
    expect(hasRequestInTarget(moved, "folder", "root")).toBe(true);
  });

  test("adds examples from active tab response and sorts folders first", () => {
    const activeTab = {
      response: {
        status: 201,
        status_text: "Created",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        time_ms: 10,
      },
    } as TabData;
    const withExample = addExampleToItems(
      [request("request")],
      "request",
      "Created example",
      activeTab,
    );
    const savedRequest = withExample[0] as SavedRequest;

    expect(savedRequest.examples?.[0]).toMatchObject({
      name: "Created example",
      code: 201,
      status: "Created",
    });
    expect(
      sortItemsByTarget([request("b"), folder("a")], null, "default")[0],
    ).toMatchObject({ type: "folder", id: "a" });
  });
});
