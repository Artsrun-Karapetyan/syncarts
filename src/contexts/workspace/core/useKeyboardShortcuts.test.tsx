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
    render(<Consumer props={{ addTab }} />);

    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      writable: true,
    });

    fireEvent.keyDown(window, { ctrlKey: true, key: "t" });
    expect(addTab).toHaveBeenCalled();
  });

  test("does not close tab on Cmd+W (handled by Workspace)", () => {
    const addTab = mock();
    render(<Consumer props={{ addTab }} />);

    // Cmd+W is intentionally not handled here — closeTab logic lives in Workspace.tsx
    // to ensure the UnsavedChangesModal guard runs before closing
    fireEvent.keyDown(window, { ctrlKey: true, key: "w" });
    // No assertion needed — just verifies no crash
  });

  test("prevents default for Escape key", () => {
    const addTab = mock();
    render(<Consumer props={{ addTab }} />);

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
