import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { useScrollHighlightedSidebarItem } from "./useScrollHighlightedSidebarItem";

describe("useScrollHighlightedSidebarItem", () => {
  const originalRequestAnimationFrame = global.requestAnimationFrame;
  const originalCancelAnimationFrame = global.cancelAnimationFrame;
  let rafMock: any;
  let cafMock: any;

  beforeEach(() => {
    rafMock = mock().mockImplementation((cb) => {
      cb();
      return 1;
    });
    cafMock = mock();
    global.requestAnimationFrame = rafMock;
    global.cancelAnimationFrame = cafMock;
  });

  afterEach(() => {
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  test("does nothing if no highlighted item", () => {
    const ref = { current: document.createElement("div") };
    renderHook(() =>
      useScrollHighlightedSidebarItem({
        highlightedCollectionId: null,
        highlightedExampleId: null,
        highlightedFolderId: null,
        highlightedRequestId: null,
        scrollContainerRef: ref,
      }),
    );

    expect(rafMock).not.toHaveBeenCalled();
  });

  test("does nothing if ref is null", () => {
    const ref = { current: null };
    renderHook(() =>
      useScrollHighlightedSidebarItem({
        highlightedCollectionId: "c1",
        highlightedExampleId: null,
        highlightedFolderId: null,
        highlightedRequestId: null,
        scrollContainerRef: ref,
      }),
    );
    // RAF runs, but inside it does nothing
    expect(rafMock).toHaveBeenCalled();
  });

  test("scrolls target into view vertically and restores horizontal scroll", () => {
    const div = document.createElement("div");
    const targetEl = document.createElement("div");
    targetEl.setAttribute("data-sidebar-kind", "collection");
    targetEl.setAttribute("data-sidebar-id", "c1");
    div.appendChild(targetEl);

    div.scrollLeft = 42;
    const scrollIntoViewMock = mock(() => {
      // simulate the browser also nudging horizontally
      div.scrollLeft = 0;
    });
    targetEl.scrollIntoView = scrollIntoViewMock as any;

    renderHook(() =>
      useScrollHighlightedSidebarItem({
        highlightedCollectionId: "c1",
        highlightedExampleId: null,
        highlightedFolderId: null,
        highlightedRequestId: null,
        scrollContainerRef: { current: div },
      }),
    );

    expect(rafMock).toHaveBeenCalled();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: "nearest" });
    // horizontal scroll must be restored after the vertical scroll
    expect(div.scrollLeft).toBe(42);
  });

  test("does not scroll if target element not found", () => {
    const div = document.createElement("div");
    const ref = { current: div };

    renderHook(() =>
      useScrollHighlightedSidebarItem({
        highlightedCollectionId: "c1",
        highlightedExampleId: null,
        highlightedFolderId: null,
        highlightedRequestId: null,
        scrollContainerRef: ref,
      }),
    );

    expect(rafMock).toHaveBeenCalled();
  });
});
