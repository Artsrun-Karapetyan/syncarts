import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { TabsBarContextMenu } from "./TabsBarContextMenu";

describe("TabsBarContextMenu", () => {
  const defaultProps = {
    ctxMenu: {
      x: 100,
      y: 200,
      tabToDuplicate: { id: "t1", name: "Tab 1", pinned: false },
    },
    setCtxMenu: mock(),
    menuRef: { current: null },
    addTab: mock(),
    closeTab: mock(),
    pinTab: mock(),
    onRequestCloseTab: mock(),
    tabs: [
      { id: "t1", name: "Tab 1", pinned: false },
      { id: "t2", name: "Tab 2", pinned: true },
      { id: "t3", name: "Tab 3", pinned: false },
    ],
  };

  beforeEach(() => {
    defaultProps.setCtxMenu.mockClear();
    defaultProps.addTab.mockClear();
    defaultProps.closeTab.mockClear();
    defaultProps.pinTab.mockClear();
    defaultProps.onRequestCloseTab.mockClear();
  });

  test("returns null if ctxMenu is null", () => {
    const { container } = render(
      <TabsBarContextMenu {...defaultProps} ctxMenu={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders menu at correct coordinates", () => {
    const { container } = render(<TabsBarContextMenu {...defaultProps} />);
    const menu = container.firstChild as HTMLElement;
    expect(menu.style.top).toBe("200px");
    expect(menu.style.left).toBe("100px");
  });

  test("handles New Request click", () => {
    render(<TabsBarContextMenu {...defaultProps} />);
    const btn = screen.getByText("New Request");
    fireEvent.click(btn);
    expect(defaultProps.addTab).toHaveBeenCalledWith();
    expect(defaultProps.setCtxMenu).toHaveBeenCalledWith(null);
  });

  test("handles Duplicate Tab click and strips IDs", () => {
    const props = {
      ...defaultProps,
      ctxMenu: {
        x: 0,
        y: 0,
        tabToDuplicate: {
          id: "t1",
          name: "Tab 1",
          pinned: false,
          savedRequestId: "sr1",
          collectionId: "c1",
          folderId: "f1",
          exampleId: "e1",
          method: "GET",
        },
      },
    };
    render(<TabsBarContextMenu {...props} />);
    const btn = screen.getByText("Duplicate Tab");
    fireEvent.click(btn);

    expect(defaultProps.addTab).toHaveBeenCalledWith({
      method: "GET",
      name: "Tab 1 (Copy)",
    });
    expect(defaultProps.setCtxMenu).toHaveBeenCalledWith(null);
  });

  test("handles Duplicate Tab click with no name", () => {
    const props = {
      ...defaultProps,
      ctxMenu: { x: 0, y: 0, tabToDuplicate: { id: "t1", pinned: false } },
    };
    render(<TabsBarContextMenu {...props} />);
    fireEvent.click(screen.getByText("Duplicate Tab"));
    expect(defaultProps.addTab).toHaveBeenCalledWith({
      name: "Untitled Request (Copy)",
    });
  });

  test("handles Pin Tab click", () => {
    render(<TabsBarContextMenu {...defaultProps} />);
    const btn = screen.getByText("Pin Tab");
    fireEvent.click(btn);
    expect(defaultProps.pinTab).toHaveBeenCalledWith("t1");
    expect(defaultProps.setCtxMenu).toHaveBeenCalledWith(null);
  });

  test("handles Unpin Tab click", () => {
    const props = {
      ...defaultProps,
      ctxMenu: { x: 0, y: 0, tabToDuplicate: { id: "t1", pinned: true } },
    };
    render(<TabsBarContextMenu {...props} />);
    const btn = screen.getByText("Unpin Tab");
    fireEvent.click(btn);
    expect(defaultProps.pinTab).toHaveBeenCalledWith("t1");
  });

  test("handles Close Tab click", () => {
    render(<TabsBarContextMenu {...defaultProps} />);
    const btn = screen.getByText("Close Tab");
    fireEvent.click(btn);
    expect(defaultProps.onRequestCloseTab).toHaveBeenCalledWith("t1");
    expect(defaultProps.setCtxMenu).toHaveBeenCalledWith(null);
  });

  test("handles Force Close Tab click", () => {
    render(<TabsBarContextMenu {...defaultProps} />);
    const btn = screen.getByText("Force Close Tab");
    fireEvent.click(btn);
    expect(defaultProps.closeTab).toHaveBeenCalledWith("t1");
    expect(defaultProps.setCtxMenu).toHaveBeenCalledWith(null);
  });

  test("handles Close Other Tabs click", () => {
    render(<TabsBarContextMenu {...defaultProps} />);
    const btn = screen.getByText("Close Other Tabs");
    fireEvent.click(btn);
    // Skips t1 (itself) and t2 (pinned)
    expect(defaultProps.closeTab).toHaveBeenCalledWith("t3");
    expect(defaultProps.closeTab).not.toHaveBeenCalledWith("t1");
    expect(defaultProps.closeTab).not.toHaveBeenCalledWith("t2");
    expect(defaultProps.setCtxMenu).toHaveBeenCalledWith(null);
  });

  test("handles Close Unpinned Tabs click", () => {
    render(<TabsBarContextMenu {...defaultProps} />);
    const btn = screen.getByText("Close Unpinned Tabs");
    fireEvent.click(btn);
    // Calls onRequestCloseTab on t1 and t3, but not t2
    expect(defaultProps.onRequestCloseTab).toHaveBeenCalledWith("t1");
    expect(defaultProps.onRequestCloseTab).toHaveBeenCalledWith("t3");
    expect(defaultProps.onRequestCloseTab).not.toHaveBeenCalledWith("t2");
    expect(defaultProps.setCtxMenu).toHaveBeenCalledWith(null);
  });

  test("handles Force Close All Tabs click", () => {
    render(<TabsBarContextMenu {...defaultProps} />);
    const btn = screen.getByText("Force Close All Tabs");
    fireEvent.click(btn);
    expect(defaultProps.closeTab).toHaveBeenCalledWith("t1");
    expect(defaultProps.closeTab).toHaveBeenCalledWith("t2");
    expect(defaultProps.closeTab).toHaveBeenCalledWith("t3");
    expect(defaultProps.setCtxMenu).toHaveBeenCalledWith(null);
  });

  test("hover states for CtxMenuItem", () => {
    render(<TabsBarContextMenu {...defaultProps} />);
    const normalBtn = screen.getByText("New Request").parentElement
      ?.parentElement as HTMLElement;

    // Normal button hover
    fireEvent.mouseEnter(normalBtn);
    expect(normalBtn.style.background).toBe("var(--bg-secondary)");
    expect(normalBtn.style.color).toBe("var(--text-primary)");

    fireEvent.mouseLeave(normalBtn);
    expect(normalBtn.style.color).toBe("var(--text-secondary)");
  });

  test("hover states for danger CtxMenuItem", () => {
    render(<TabsBarContextMenu {...defaultProps} />);
    const dangerBtn = screen.getByText("Force Close All Tabs").parentElement
      ?.parentElement as HTMLElement;

    fireEvent.mouseEnter(dangerBtn);
    expect(dangerBtn.style.background).toBe("var(--status-delete-bg)");
    expect(dangerBtn.style.color).toBe("var(--status-delete)");

    fireEvent.mouseLeave(dangerBtn);
    expect(dangerBtn.style.color).toBe("var(--status-delete)");
  });
});
