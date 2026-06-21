import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import {
  createDefaultActiveEnvByWorkspace,
  createDefaultActiveTabByWorkspace,
  createDefaultTabsByWorkspace,
  createDefaultWorkspaces,
} from "./initializers";

describe("initializers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Test 1
  test("createDefaultWorkspaces returns default workspace when localStorage is empty", () => {
    const res = createDefaultWorkspaces("user-1", "w-default");
    expect(res).toEqual([
      {
        id: "w-default",
        name: "My Workspace",
        ownerId: "user-1",
        collections: [],
      },
    ]);
  });

  // Test 2
  test("createDefaultWorkspaces parses and migrates v3 workspaces, removing the v3 key", () => {
    const mockV3 = [
      { id: "w-3", name: "V3 Workspace", ownerId: "u3", collections: [] },
    ];
    localStorage.setItem("syncarts-workspaces-v3", JSON.stringify(mockV3));

    const res = createDefaultWorkspaces("user-1", "w-default");
    expect(res).toEqual(mockV3);
    expect(localStorage.getItem("syncarts-workspaces-v3")).toBeNull();
  });

  // Test 3
  test("createDefaultWorkspaces parses and migrates v2 collections, removing the v2 key", () => {
    const mockV2Cols = [{ id: "c-2", name: "V2 Col", items: [] }];
    localStorage.setItem("syncarts-collections-v2", JSON.stringify(mockV2Cols));

    const res = createDefaultWorkspaces("user-1", "w-default");
    expect(res).toEqual([
      {
        id: "w-default",
        name: "My Workspace",
        ownerId: "user-1",
        collections: mockV2Cols,
      },
    ]);
    expect(localStorage.getItem("syncarts-collections-v2")).toBeNull();
  });

  // Test 4
  test("createDefaultWorkspaces catches JSON parsing errors and returns default workspace", () => {
    localStorage.setItem("syncarts-workspaces-v3", "{invalid json");
    const res = createDefaultWorkspaces("user-1", "w-default");
    expect(res[0].id).toBe("w-default");
  });

  // Test 5
  test("createDefaultTabsByWorkspace returns default empty tabs record when localStorage is empty", () => {
    const res = createDefaultTabsByWorkspace("w-default");
    expect(res).toEqual({ "w-default": [] });
  });

  // Test 6
  test("createDefaultTabsByWorkspace parses and migrates v3 tabs, removing the v3 key", () => {
    const mockV3Tabs = { "w-3": [{ id: "t1", type: "request" }] };
    localStorage.setItem(
      "syncarts-tabs-by-workspace-v3",
      JSON.stringify(mockV3Tabs),
    );

    const res = createDefaultTabsByWorkspace("w-default");
    expect(res).toEqual(mockV3Tabs as any);
    expect(localStorage.getItem("syncarts-tabs-by-workspace-v3")).toBeNull();
  });

  // Test 7
  test("createDefaultTabsByWorkspace parses and migrates v2 tabs, removing the v2 key", () => {
    const mockV2Tabs = [{ id: "t2", type: "request" }];
    localStorage.setItem("syncarts-tabs-v2", JSON.stringify(mockV2Tabs));

    const res = createDefaultTabsByWorkspace("w-default");
    expect(res).toEqual({ "w-default": mockV2Tabs as any });
    expect(localStorage.getItem("syncarts-tabs-v2")).toBeNull();
  });

  // Test 8
  test("createDefaultTabsByWorkspace catches errors and returns default empty tabs", () => {
    localStorage.setItem("syncarts-tabs-v2", "{invalid json");
    const res = createDefaultTabsByWorkspace("w-default");
    expect(res).toEqual({ "w-default": [] });
  });

  // Test 9
  test("createDefaultActiveTabByWorkspace returns default, migrates v3, migrates v2, and handles errors", () => {
    // Default
    expect(createDefaultActiveTabByWorkspace("w-default")).toEqual({
      "w-default": null,
    });

    // Migrate v3
    localStorage.setItem(
      "syncarts-active-tab-by-workspace-v3",
      JSON.stringify({ "w-3": "tab3" }),
    );
    expect(createDefaultActiveTabByWorkspace("w-default")).toEqual({
      "w-3": "tab3",
    });
    expect(
      localStorage.getItem("syncarts-active-tab-by-workspace-v3"),
    ).toBeNull();

    // Migrate v2
    localStorage.setItem("syncarts-active-tab-v2", JSON.stringify("tab2"));
    expect(createDefaultActiveTabByWorkspace("w-default")).toEqual({
      "w-default": "tab2",
    });
    expect(localStorage.getItem("syncarts-active-tab-v2")).toBeNull();

    // Catch error
    localStorage.setItem("syncarts-active-tab-v2", "{bad json");
    expect(createDefaultActiveTabByWorkspace("w-default")).toEqual({
      "w-default": null,
    });
  });

  // Test 10
  test("createDefaultActiveEnvByWorkspace returns default, migrates v3, and handles errors", () => {
    // Default
    expect(createDefaultActiveEnvByWorkspace("w-default")).toEqual({
      "w-default": null,
    });

    // Migrate v3
    localStorage.setItem(
      "syncarts-active-env-by-workspace-v3",
      JSON.stringify({ "w-3": "env3" }),
    );
    expect(createDefaultActiveEnvByWorkspace("w-default")).toEqual({
      "w-3": "env3",
    });
    expect(
      localStorage.getItem("syncarts-active-env-by-workspace-v3"),
    ).toBeNull();

    // Catch error
    localStorage.setItem("syncarts-active-env-by-workspace-v3", "{bad json");
    expect(createDefaultActiveEnvByWorkspace("w-default")).toEqual({
      "w-default": null,
    });
  });
});
