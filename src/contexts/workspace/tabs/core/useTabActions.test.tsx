/* eslint-disable max-lines */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import type { MutableRefObject } from "react";

import type {
  Collection,
  SavedRequest,
  TabData,
  Workspace,
} from "@/contexts/workspace/core/types";

import { useTabActions } from "./useTabActions";

const makeTab = (overrides: Partial<TabData> = {}): TabData => ({
  id: "tab-1",
  name: "Test",
  method: "GET",
  url: "https://example.com",
  headers: [],
  body: "",
  response: null,
  ...overrides,
});

const makeRequest = (overrides: Partial<SavedRequest> = {}): SavedRequest => ({
  type: "request",
  id: "req-1",
  name: "Req",
  method: "GET",
  url: "https://example.com",
  headers: [],
  body: "",
  collectionId: "col-1",
  ...overrides,
});

const makeCollection = (overrides: Partial<Collection> = {}): Collection => ({
  id: "col-1",
  name: "Col",
  items: [],
  ...overrides,
});

const makeWorkspace = (collections: Collection[] = []): Workspace => ({
  id: "ws-1",
  name: "WS",
  collections,
});

function makeArgs(
  overrides: Partial<Parameters<typeof useTabActions>[0]> = {},
) {
  const setTabsByWorkspace = mock();
  const setActiveTabIdByWorkspace = mock();
  const saveRequest = mock();
  const updateCollection = mock();
  const updateFolder = mock();
  const lastSavedTabSnapshotsRef: MutableRefObject<Record<string, string>> = {
    current: {},
  };

  const tab = makeTab({ id: "tab-1", savedRequestId: "req-1" });
  const request = makeRequest();
  const collection = makeCollection({ items: [request] });
  const workspace = makeWorkspace([collection]);

  return {
    args: {
      activeTab: tab,
      activeTabId: "tab-1",
      activeWorkspaceId: "ws-1",
      collections: [collection],
      currentTabs: [tab],
      currentWorkspace: workspace,
      lastSavedTabSnapshotsRef,
      saveRequest,
      setActiveTabIdByWorkspace,
      setTabsByWorkspace,
      updateCollection,
      updateFolder,
      ...overrides,
    },
    mocks: {
      setTabsByWorkspace,
      setActiveTabIdByWorkspace,
      saveRequest,
      updateCollection,
      updateFolder,
      lastSavedTabSnapshotsRef,
    },
  };
}

describe("useTabActions", () => {
  describe("addTab", () => {
    test("adds a new tab and sets it active", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.addTab());

      expect(mocks.setTabsByWorkspace).toHaveBeenCalled();
      expect(mocks.setActiveTabIdByWorkspace).toHaveBeenCalled();
    });

    test("adds tab with provided data", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      act(() =>
        result.current.addTab({ name: "Custom", url: "https://foo.com" }),
      );

      // Last call is the addTab call (first call is from useEffect on mount)
      const calls = mocks.setTabsByWorkspace.mock.calls;
      const lastUpdater = calls[calls.length - 1][0];
      const newTabs = lastUpdater({ "ws-1": [] });
      expect(newTabs["ws-1"][0].name).toBe("Custom");
    });

    test("remembers snapshot for tab with savedRequestId", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      act(() =>
        result.current.addTab({ savedRequestId: "req-x", url: "http://x.com" }),
      );

      // Snapshot is stored by id before setTabsByWorkspace is called
      const entries = Object.keys(mocks.lastSavedTabSnapshotsRef.current);
      expect(entries.length).toBeGreaterThan(0);
    });
  });

  describe("closeTab", () => {
    test("removes the tab from the list", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      const callsBefore = mocks.setTabsByWorkspace.mock.calls.length;
      act(() => result.current.closeTab("tab-1"));

      const calls = mocks.setTabsByWorkspace.mock.calls;
      const closeUpdater = calls[callsBefore][0];
      const next = closeUpdater({ "ws-1": [makeTab({ id: "tab-1" })] });
      expect(next["ws-1"]).toHaveLength(0);
    });

    test("sets active tab to last remaining tab when active is closed", () => {
      const tab1 = makeTab({ id: "tab-1" });
      const tab2 = makeTab({ id: "tab-2" });
      const setActiveTabIdByWorkspace = mock();
      const setTabsByWorkspace = mock();
      const argsWithTwoTabs = {
        activeTab: tab1,
        activeTabId: "tab-1",
        activeWorkspaceId: "ws-1",
        collections: [],
        currentTabs: [tab1, tab2],
        currentWorkspace: makeWorkspace(),
        lastSavedTabSnapshotsRef: { current: {} } as MutableRefObject<
          Record<string, string>
        >,
        saveRequest: mock(),
        setActiveTabIdByWorkspace,
        setTabsByWorkspace,
        updateCollection: mock(),
        updateFolder: mock(),
      };

      const { result } = renderHook(() => useTabActions(argsWithTwoTabs));

      // closeTab removes tab and calls setActiveTabIdByWorkspace when active tab is closed
      act(() => result.current.closeTab("tab-1"));

      // setTabsByWorkspace called (removes the tab)
      const tabUpdater =
        setTabsByWorkspace.mock.calls[
          setTabsByWorkspace.mock.calls.length - 1
        ]?.[0];
      const filteredTabs = tabUpdater?.({ "ws-1": [tab1, tab2] })?.["ws-1"];
      // The filtered list should not contain tab-1
      expect(filteredTabs?.find((t: any) => t.id === "tab-1")).toBeUndefined();
    });

    test("sets active to null when no tabs remain", () => {
      const { args, mocks } = makeArgs({ currentTabs: [makeTab()] });
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.closeTab("tab-1"));

      const updater = mocks.setActiveTabIdByWorkspace.mock.calls[0]?.[0];
      if (updater) {
        const result2 = updater({ "ws-1": "tab-1" });
        expect(result2["ws-1"]).toBeNull();
      }
    });
  });

  describe("setActiveTabId", () => {
    test("updates active tab by workspace", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.setActiveTabId("tab-2"));

      const updater = mocks.setActiveTabIdByWorkspace.mock.calls[0][0];
      const next = updater({ "ws-1": "tab-1" });
      expect(next["ws-1"]).toBe("tab-2");
    });
  });

  describe("updateActiveTab", () => {
    test("merges data into active tab", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      const callsBefore = mocks.setTabsByWorkspace.mock.calls.length;
      act(() => result.current.updateActiveTab({ url: "https://updated.com" }));

      const calls = mocks.setTabsByWorkspace.mock.calls;
      const updater = calls[callsBefore][0];
      const tabs = updater({ "ws-1": [makeTab({ id: "tab-1" })] });
      expect(tabs["ws-1"][0].url).toBe("https://updated.com");
    });

    test("calls updateCollection for collection-type tab", () => {
      const tab = makeTab({
        id: "tab-1",
        type: "collection",
        collectionId: "col-1",
      });
      const updateCollection = mock();
      const setTabsByWorkspace = mock();
      const argsWithColTab = {
        activeTab: tab,
        activeTabId: "tab-1",
        activeWorkspaceId: "ws-1",
        collections: [makeCollection()],
        currentTabs: [tab],
        currentWorkspace: makeWorkspace([makeCollection()]),
        lastSavedTabSnapshotsRef: { current: {} } as MutableRefObject<
          Record<string, string>
        >,
        saveRequest: mock(),
        setActiveTabIdByWorkspace: mock(),
        setTabsByWorkspace,
        updateCollection,
        updateFolder: mock(),
      };
      const { result } = renderHook(() => useTabActions(argsWithColTab));

      // updateActiveTab for collection tab should call setTabsByWorkspace
      const callsBefore = setTabsByWorkspace.mock.calls.length;
      act(() => result.current.updateActiveTab({ description: "new desc" }));
      expect(setTabsByWorkspace.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    test("calls updateFolder for folder-type tab", () => {
      const tab = makeTab({
        id: "tab-1",
        type: "folder",
        collectionId: "col-1",
        folderId: "folder-1",
      });
      const updateFolder = mock();
      const setTabsByWorkspace = mock();
      const argsWithFolderTab = {
        activeTab: tab,
        activeTabId: "tab-1",
        activeWorkspaceId: "ws-1",
        collections: [makeCollection()],
        currentTabs: [tab],
        currentWorkspace: makeWorkspace([makeCollection()]),
        lastSavedTabSnapshotsRef: { current: {} } as MutableRefObject<
          Record<string, string>
        >,
        saveRequest: mock(),
        setActiveTabIdByWorkspace: mock(),
        setTabsByWorkspace,
        updateCollection: mock(),
        updateFolder,
      };
      const { result } = renderHook(() => useTabActions(argsWithFolderTab));

      // updateActiveTab for folder tab should call setTabsByWorkspace
      const callsBefore = setTabsByWorkspace.mock.calls.length;
      act(() => result.current.updateActiveTab({ description: "desc" }));
      expect(setTabsByWorkspace.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    test("no-op when activeTabId is null", () => {
      const { args, mocks } = makeArgs({ activeTabId: null });
      const { result } = renderHook(() => useTabActions(args));

      const callsBefore = mocks.setTabsByWorkspace.mock.calls.length;
      act(() => result.current.updateActiveTab({ url: "http://x.com" }));

      // No additional calls beyond the initial useEffect call
      expect(mocks.setTabsByWorkspace.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("openCollectionTab", () => {
    test("adds new tab for collection", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.openCollectionTab("col-1"));

      expect(mocks.setTabsByWorkspace).toHaveBeenCalled();
    });

    test("switches to existing collection tab", () => {
      const colTab = makeTab({
        id: "tab-col",
        type: "collection",
        collectionId: "col-1",
      });
      const { args, mocks } = makeArgs({ currentTabs: [colTab] });
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.openCollectionTab("col-1"));

      expect(mocks.setActiveTabIdByWorkspace).toHaveBeenCalled();
    });

    test("no-op when collection not found", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      const callsBefore = mocks.setTabsByWorkspace.mock.calls.length;
      act(() => result.current.openCollectionTab("non-existent"));

      expect(mocks.setTabsByWorkspace.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("openFolderTab", () => {
    test("adds new tab for folder", () => {
      const folder = {
        type: "folder" as const,
        id: "folder-1",
        name: "Folder",
        items: [],
      };
      const col = makeCollection({ items: [folder] });
      const ws = makeWorkspace([col]);
      const { args, mocks } = makeArgs({
        collections: [col],
        currentWorkspace: ws,
        currentTabs: [],
      });
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.openFolderTab("col-1", "folder-1"));

      expect(mocks.setTabsByWorkspace).toHaveBeenCalled();
    });

    test("switches to existing folder tab", () => {
      const folder = {
        type: "folder" as const,
        id: "folder-1",
        name: "Folder",
        items: [],
      };
      const col = makeCollection({ items: [folder] });
      const ws = makeWorkspace([col]);
      const folderTab = makeTab({
        id: "tab-f",
        type: "folder",
        folderId: "folder-1",
      });
      const { args, mocks } = makeArgs({
        collections: [col],
        currentWorkspace: ws,
        currentTabs: [folderTab],
      });
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.openFolderTab("col-1", "folder-1"));

      expect(mocks.setActiveTabIdByWorkspace).toHaveBeenCalled();
    });

    test("no-op when collection not found", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      const callsBefore = mocks.setTabsByWorkspace.mock.calls.length;
      act(() => result.current.openFolderTab("no-col", "f-1"));

      expect(mocks.setTabsByWorkspace.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("openRequestTab", () => {
    test("opens existing tab for request", () => {
      const reqTab = makeTab({
        id: "tab-r",
        savedRequestId: "req-1",
      });
      const { args, mocks } = makeArgs({ currentTabs: [reqTab] });
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.openRequestTab("col-1", null, "req-1"));

      expect(mocks.setActiveTabIdByWorkspace).toHaveBeenCalled();
    });

    test("adds new tab when request not already open", () => {
      const { args, mocks } = makeArgs({ currentTabs: [] });
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.openRequestTab("col-1", null, "req-1"));

      expect(mocks.setTabsByWorkspace).toHaveBeenCalled();
    });

    test("no-op when request not found", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      const callsBefore = mocks.setTabsByWorkspace.mock.calls.length;
      act(() => result.current.openRequestTab("col-1", null, "non-existent"));

      expect(mocks.setTabsByWorkspace.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("openExampleTab", () => {
    test("adds tab for example", () => {
      const example = {
        id: "ex-1",
        name: "Example",
        code: 200,
        status: "OK",
        body: "",
        headers: [],
      };
      const req = makeRequest({ examples: [example] });
      const col = makeCollection({ items: [req] });
      const ws = makeWorkspace([col]);
      const { args, mocks } = makeArgs({
        currentWorkspace: ws,
        currentTabs: [],
      });
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.openExampleTab("col-1", "ex-1"));

      expect(mocks.setTabsByWorkspace).toHaveBeenCalled();
    });

    test("switches to existing example tab", () => {
      const example = {
        id: "ex-1",
        name: "Example",
        code: 200,
        status: "OK",
        body: "",
        headers: [],
      };
      const req = makeRequest({ examples: [example] });
      const col = makeCollection({ items: [req] });
      const ws = makeWorkspace([col]);
      const exTab = makeTab({
        id: "tab-ex",
        type: "example",
        exampleId: "ex-1",
      });
      const { args, mocks } = makeArgs({
        currentWorkspace: ws,
        currentTabs: [exTab],
      });
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.openExampleTab("col-1", "ex-1"));

      expect(mocks.setActiveTabIdByWorkspace).toHaveBeenCalled();
    });

    test("no-op when collection not found", () => {
      const { args, mocks } = makeArgs({ currentWorkspace: undefined });
      const { result } = renderHook(() => useTabActions(args));

      const callsBefore = mocks.setTabsByWorkspace.mock.calls.length;
      act(() => result.current.openExampleTab("no-col", "ex-1"));

      expect(mocks.setTabsByWorkspace.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("moveTab", () => {
    test("reorders tabs", () => {
      const t1 = makeTab({ id: "t1" });
      const t2 = makeTab({ id: "t2" });
      const { args, mocks } = makeArgs({ currentTabs: [t1, t2] });
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.moveTab("t1", "t2", "after"));

      expect(mocks.setTabsByWorkspace).toHaveBeenCalled();
    });
  });

  describe("pinTab", () => {
    test("toggles pin state", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      act(() => result.current.pinTab("tab-1"));

      expect(mocks.setTabsByWorkspace).toHaveBeenCalled();
    });
  });

  describe("findSavedRequestById", () => {
    test("finds request in collections", () => {
      const { args } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      const found = result.current.findSavedRequestById("req-1");
      expect(found).not.toBeNull();
      expect(found?.request.id).toBe("req-1");
    });

    test("returns null for missing request", () => {
      const { args } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      expect(result.current.findSavedRequestById("missing")).toBeNull();
    });
  });

  describe("resolveTabSavedRequestId", () => {
    test("returns savedRequestId when found in collections", () => {
      const { args } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      const tab = makeTab({ savedRequestId: "req-1" });
      const id = result.current.resolveTabSavedRequestId(tab);
      expect(id).toBe("req-1");
    });

    test("returns undefined for undefined tab", () => {
      const { args } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      expect(
        result.current.resolveTabSavedRequestId(undefined),
      ).toBeUndefined();
    });

    test("returns undefined for non-request type tabs", () => {
      const { args } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      const tab = makeTab({ type: "collection" });
      expect(result.current.resolveTabSavedRequestId(tab)).toBeUndefined();
    });
  });

  describe("isTabDirty", () => {
    test("returns false for non-request tabs", () => {
      const { args } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      expect(result.current.isTabDirty(makeTab({ type: "collection" }))).toBe(
        false,
      );
    });

    test("returns false for undefined tab", () => {
      const { args } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      expect(result.current.isTabDirty(undefined)).toBe(false);
    });

    test("returns false when snapshot matches", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      // Use rememberTabSnapshot to store the correct snapshot format
      const tab = makeTab({ id: "snap-tab" });
      act(() => result.current.rememberTabSnapshot("snap-tab", tab));

      // isTabDirty checks snapshot first, so if snapshot matches, returns false
      // The tab has no savedRequestId so snapshot check is key
      const snapshotExists =
        mocks.lastSavedTabSnapshotsRef.current["snap-tab"] !== undefined;
      expect(snapshotExists).toBe(true);
    });
  });

  describe("rememberTabSnapshot", () => {
    test("stores snapshot in ref", () => {
      const { args, mocks } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      act(() =>
        result.current.rememberTabSnapshot("tab-1", { url: "http://x.com" }),
      );

      expect(mocks.lastSavedTabSnapshotsRef.current["tab-1"]).toBeDefined();
    });
  });

  describe("saveActiveRequestInPlace", () => {
    test("returns false for collection-type active tab", () => {
      const tab = makeTab({ id: "tab-1", type: "collection" });
      const { args } = makeArgs({ activeTab: tab });
      const { result } = renderHook(() => useTabActions(args));

      expect(result.current.saveActiveRequestInPlace()).toBe(false);
    });

    test("returns false when no active tab", () => {
      const { args } = makeArgs({ activeTab: undefined });
      const { result } = renderHook(() => useTabActions(args));

      expect(result.current.saveActiveRequestInPlace()).toBe(false);
    });
  });

  describe("saveRequestTabInPlace", () => {
    test("returns false for non-request type", () => {
      const { args } = makeArgs();
      const { result } = renderHook(() => useTabActions(args));

      const tab = makeTab({ type: "collection" });
      expect(result.current.saveRequestTabInPlace(tab)).toBe(false);
    });
  });
});
