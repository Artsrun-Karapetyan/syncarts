import { describe, expect, it } from "bun:test";

import type { TabData } from "../core/types";
import {
  buildSavedRequestFromTab,
  findSavedRequestByIdInCollections,
} from "./tabHelpers";

describe("tabHelpers more cases", () => {
  it("returns null when the saved request is not found", () => {
    expect(
      findSavedRequestByIdInCollections(
        [{ id: "collection-1", name: "API", items: [] }],
        "missing",
      ),
    ).toBeNull();
  });

  it("uses fallback request name, method, url, and body", () => {
    expect(buildSavedRequestFromTab({} as TabData, "request-1")).toMatchObject({
      type: "request",
      id: "request-1",
      name: "Untitled Request",
      method: "GET",
      url: "",
      body: "",
    });
  });
});
