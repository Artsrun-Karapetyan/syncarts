import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { useSidebarHighlight } from "./useSidebarHighlight";

const findRequestPathMock = mock();
const findExamplePathMock = mock();

mock.module("@/components/layout/sidebar/utils/utils", () => ({
  findRequestPath: findRequestPathMock,
  findExamplePath: findExamplePathMock,
}));

describe("useSidebarHighlight", () => {
  const collections: any[] = [];
  const defaultArgs = {
    activeTab: undefined,
    collections,
    resolveTabSavedRequestId: mock(),
    setExpandedCollections: mock(),
    setExpandedFolders: mock(),
  };

  beforeEach(() => {
    defaultArgs.resolveTabSavedRequestId.mockClear();
    defaultArgs.setExpandedCollections.mockClear();
    defaultArgs.setExpandedFolders.mockClear();
    findRequestPathMock.mockClear();
    findExamplePathMock.mockClear();
  });

  test("initializes correctly with no tab", () => {
    const { result } = renderHook(() => useSidebarHighlight(defaultArgs));
    expect(result.current.highlightedCollectionId).toBeNull();
    expect(result.current.highlightedFolderId).toBeNull();
    expect(result.current.highlightedRequestId).toBeNull();
    expect(result.current.highlightedExampleId).toBeNull();
  });

  test("highlights collection tab", () => {
    const activeTab: any = { type: "collection", collectionId: "c1" };
    const { result } = renderHook(() =>
      useSidebarHighlight({ ...defaultArgs, activeTab }),
    );

    expect(result.current.highlightedCollectionId).toBe("c1");
    expect(defaultArgs.setExpandedCollections).toHaveBeenCalled();
    const updater = defaultArgs.setExpandedCollections.mock.calls[0][0];
    expect(updater({})).toEqual({ c1: true });
  });

  test("highlights folder tab", () => {
    const activeTab: any = {
      type: "folder",
      collectionId: "c1",
      folderId: "f1",
    };
    const { result } = renderHook(() =>
      useSidebarHighlight({ ...defaultArgs, activeTab }),
    );

    expect(result.current.highlightedFolderId).toBe("f1");
    expect(defaultArgs.setExpandedCollections).toHaveBeenCalled();
    expect(defaultArgs.setExpandedFolders).toHaveBeenCalled();

    const colUpdater = defaultArgs.setExpandedCollections.mock.calls[0][0];
    expect(colUpdater({})).toEqual({ c1: true });
    const folUpdater = defaultArgs.setExpandedFolders.mock.calls[0][0];
    expect(folUpdater({})).toEqual({ f1: true });
  });

  test("highlights request tab", () => {
    const activeTab: any = { type: "request" as const, requestId: "r1" };
    defaultArgs.resolveTabSavedRequestId.mockReturnValue("r1");
    findRequestPathMock.mockReturnValue({
      collectionId: "c1",
      folderIds: ["f1"],
    });

    const { result } = renderHook(() =>
      useSidebarHighlight({ ...defaultArgs, activeTab }),
    );

    expect(result.current.highlightedRequestId).toBe("r1");
    expect(defaultArgs.setExpandedCollections).toHaveBeenCalled();
    expect(defaultArgs.setExpandedFolders).toHaveBeenCalled();

    // Check updaters
    const setColUpdater = defaultArgs.setExpandedCollections.mock.calls[0][0];
    expect(setColUpdater({})).toEqual({ c1: true });

    const setFolUpdater = defaultArgs.setExpandedFolders.mock.calls[0][0];
    expect(setFolUpdater({})).toEqual({ f1: true });

    // Check folder updater when folder already expanded
    expect(setFolUpdater({ f1: true })).toEqual({ f1: true });
  });

  test("handles request tab missing path", () => {
    const activeTab: any = { type: "request" as const, requestId: "r1" };
    defaultArgs.resolveTabSavedRequestId.mockReturnValue("r1");
    findRequestPathMock.mockReturnValue(null);

    const { result } = renderHook(() =>
      useSidebarHighlight({ ...defaultArgs, activeTab }),
    );

    expect(result.current.highlightedRequestId).toBeNull();
  });

  test("highlights example tab", () => {
    const activeTab: any = { type: "example" as const, exampleId: "e1" };
    findExamplePathMock.mockReturnValue({ collectionId: "c1", folderIds: [] });

    const { result } = renderHook(() =>
      useSidebarHighlight({ ...defaultArgs, activeTab }),
    );

    expect(result.current.highlightedExampleId).toBe("e1");
  });

  test("handles example tab missing path", () => {
    const activeTab: any = { type: "example" as const, exampleId: "e1" };
    findExamplePathMock.mockReturnValue(null);

    const { result } = renderHook(() =>
      useSidebarHighlight({ ...defaultArgs, activeTab }),
    );

    expect(result.current.highlightedExampleId).toBeNull();
  });

  test("listens to highlight-sidebar event for request", () => {
    findRequestPathMock.mockReturnValue({ collectionId: "c1", folderIds: [] });
    const { result } = renderHook(() => useSidebarHighlight(defaultArgs));

    act(() => {
      const event = new CustomEvent("highlight-sidebar", {
        detail: { savedRequestId: "r2" },
      });
      window.dispatchEvent(event);
    });

    expect(result.current.highlightedRequestId).toBe("r2");
  });

  test("listens to highlight-sidebar event for example", () => {
    findExamplePathMock.mockReturnValue({ collectionId: "c1", folderIds: [] });
    const { result } = renderHook(() => useSidebarHighlight(defaultArgs));

    act(() => {
      const event = new CustomEvent("highlight-sidebar", {
        detail: { exampleId: "e2" },
      });
      window.dispatchEvent(event);
    });

    expect(result.current.highlightedExampleId).toBe("e2");
  });
});
