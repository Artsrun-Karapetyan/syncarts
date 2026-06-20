import { describe, expect, test } from "bun:test";

import type {
  SavedRequest,
  SavedRequestLocation,
  TabData,
} from "@/contexts/workspace/core/types";
import { requestSnapshot } from "@/contexts/workspace/tabs/helpers/tabHelpers";
import { normalizeTabsWithSavedRequests } from "@/contexts/workspace/tabs/helpers/tabSyncHelpers";

const savedRequest: SavedRequest = {
  type: "request",
  id: "saved",
  name: "Saved",
  method: "POST",
  url: "/saved",
  headers: [],
  body: "saved body",
};

const tab: TabData = {
  id: "tab",
  type: "request",
  savedRequestId: "saved",
  name: "Old",
  method: "GET",
  url: "/old",
  headers: [],
  body: "",
  response: {
    status: 200,
    status_text: "OK",
    headers: {},
    body: "",
    time_ms: 1,
  },
};

describe("normalizeTabsWithSavedRequests", () => {
  test("updates clean request tabs from saved requests and keeps response", () => {
    const lastSavedTabSnapshots = { tab: requestSnapshot(tab) };
    const findSavedRequestById = (): SavedRequestLocation => ({
      collectionId: "collection",
      folderId: null,
      request: savedRequest,
    });

    const result = normalizeTabsWithSavedRequests({
      currentTabs: [tab],
      findSavedRequestById,
      lastSavedTabSnapshots,
    });

    expect(result.changed).toBe(true);
    expect(result.normalizedTabs[0]).toMatchObject({
      id: "tab",
      name: "Saved",
      method: "POST",
      collectionId: "collection",
      response: tab.response,
    });
  });

  test("does not update dirty request tabs", () => {
    const result = normalizeTabsWithSavedRequests({
      currentTabs: [{ ...tab, body: "local change" }],
      findSavedRequestById: () => ({
        collectionId: "collection",
        folderId: null,
        request: savedRequest,
      }),
      lastSavedTabSnapshots: { tab: requestSnapshot(tab) },
    });

    expect(result.changed).toBe(false);
    expect(result.normalizedTabs[0].body).toBe("local change");
  });
});
