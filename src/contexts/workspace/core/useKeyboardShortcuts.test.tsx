import { fireEvent, render } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

function Consumer({ props }: { props: any }) {
  useKeyboardShortcuts(props);
  return <div>Shortcuts active</div>;
}

describe("useKeyboardShortcuts", () => {
  test("triggers addTab on Cmd+T / Ctrl+T", () => {
    const addTab = mock();
    const closeTab = mock();
    render(
      <Consumer
        props={{ addTab, closeTab, activeTabId: "t1", activeTabPinned: false }}
      />,
    );

    // Mock platform to non-Mac for Ctrl trigger
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      writable: true,
    });

    fireEvent.keyDown(window, { ctrlKey: true, key: "t" });
    expect(addTab).toHaveBeenCalled();
  });

  test("triggers closeTab on Cmd+W / Ctrl+W if not pinned", () => {
    const addTab = mock();
    const closeTab = mock();
    render(
      <Consumer
        props={{ addTab, closeTab, activeTabId: "t1", activeTabPinned: false }}
      />,
    );

    fireEvent.keyDown(window, { ctrlKey: true, key: "w" });
    expect(closeTab).toHaveBeenCalledWith("t1");
  });

  test("does not trigger closeTab if tab is pinned", () => {
    const addTab = mock();
    const closeTab = mock();
    render(
      <Consumer
        props={{ addTab, closeTab, activeTabId: "t1", activeTabPinned: true }}
      />,
    );

    fireEvent.keyDown(window, { ctrlKey: true, key: "w" });
    expect(closeTab).not.toHaveBeenCalled();
  });

  test("prevents default for Escape key", () => {
    const addTab = mock();
    const closeTab = mock();
    render(<Consumer props={{ addTab, closeTab, activeTabId: null }} />);

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      cancelable: true,
    });
    let prevented = false;
    Object.defineProperty(event, "preventDefault", {
      value: () => {
        prevented = true;
      },
      configurable: true,
    });
    window.dispatchEvent(event);

    expect(prevented).toBe(true);
  });
});
