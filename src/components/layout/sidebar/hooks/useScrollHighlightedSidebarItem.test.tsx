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

  test("scrolls target element into view", () => {
    const div = document.createElement("div");
    const targetEl = document.createElement("div");
    targetEl.setAttribute("data-sidebar-kind", "collection");
    targetEl.setAttribute("data-sidebar-id", "c1");
    targetEl.scrollIntoView = mock();
    div.appendChild(targetEl);

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
    expect(targetEl.scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "smooth",
    });
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
