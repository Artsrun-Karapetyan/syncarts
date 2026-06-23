import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { createRef } from "react";

import { createContainer, fireKey } from "./testHelpers";
import { useSidebarKeyboardNavigation } from "./useSidebarKeyboardNavigation";

describe("useSidebarKeyboardNavigation", () => {
  let container: HTMLDivElement;
  let rows: HTMLElement[];

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("ArrowDown moves focus to next row", () => {
    ({ container, rows } = createContainer(3));
    const ref = createRef<HTMLDivElement>();
    (ref as any).current = container;

    renderHook(() => useSidebarKeyboardNavigation(ref));

    rows[0].focus();
    fireKey(rows[0], "ArrowDown");
    expect(document.activeElement).toBe(rows[1]);
  });

  test("ArrowUp moves focus to previous row", () => {
    ({ container, rows } = createContainer(3));
    const ref = createRef<HTMLDivElement>();
    (ref as any).current = container;

    renderHook(() => useSidebarKeyboardNavigation(ref));

    rows[2].focus();
    fireKey(rows[2], "ArrowUp");
    expect(document.activeElement).toBe(rows[1]);
  });

  test("ArrowDown wraps to first row from last", () => {
    ({ container, rows } = createContainer(3));
    const ref = createRef<HTMLDivElement>();
    (ref as any).current = container;

    renderHook(() => useSidebarKeyboardNavigation(ref));

    rows[2].focus();
    fireKey(rows[2], "ArrowDown");
    expect(document.activeElement).toBe(rows[0]);
  });

  test("ArrowUp wraps to last row from first", () => {
    ({ container, rows } = createContainer(3));
    const ref = createRef<HTMLDivElement>();
    (ref as any).current = container;

    renderHook(() => useSidebarKeyboardNavigation(ref));

    rows[0].focus();
    fireKey(rows[0], "ArrowUp");
    expect(document.activeElement).toBe(rows[2]);
  });

  test("Enter triggers click on focused row", () => {
    ({ container, rows } = createContainer(2));
    const ref = createRef<HTMLDivElement>();
    (ref as any).current = container;

    renderHook(() => useSidebarKeyboardNavigation(ref));

    const clickHandler = mock();
    rows[0].addEventListener("click", clickHandler);
    rows[0].focus();
    fireKey(rows[0], "Enter");
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  test("ArrowDown from search input jumps to first row", () => {
    ({ container, rows } = createContainer(2, true));
    const ref = createRef<HTMLDivElement>();
    (ref as any).current = container;

    renderHook(() => useSidebarKeyboardNavigation(ref));

    const input = container.querySelector("input")!;
    input.focus();
    fireKey(input, "ArrowDown");
    expect(document.activeElement).toBe(rows[0]);
  });

  test("does nothing when focus is outside container", () => {
    ({ container, rows } = createContainer(2));
    const ref = createRef<HTMLDivElement>();
    (ref as any).current = container;

    renderHook(() => useSidebarKeyboardNavigation(ref));

    const outside = document.createElement("div");
    outside.tabIndex = 0;
    document.body.appendChild(outside);
    outside.focus();

    fireKey(outside, "ArrowDown");
    expect(document.activeElement).toBe(outside);
  });

  test("does nothing with null container ref", () => {
    const ref = createRef<HTMLDivElement>();
    // ref.current is null by default
    expect(() => {
      renderHook(() => useSidebarKeyboardNavigation(ref));
    }).not.toThrow();
  });

  test("cleans up event listener on unmount", () => {
    ({ container, rows } = createContainer(2));
    const ref = createRef<HTMLDivElement>();
    (ref as any).current = container;

    const removeSpy = mock();
    const origRemove = container.removeEventListener.bind(container);
    container.removeEventListener = (
      ...eventArgs: Parameters<typeof container.removeEventListener>
    ) => {
      removeSpy(...eventArgs);
      origRemove(...eventArgs);
    };

    const { unmount } = renderHook(() => useSidebarKeyboardNavigation(ref));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
