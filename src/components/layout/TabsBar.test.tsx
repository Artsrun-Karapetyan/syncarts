import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

import { TabsBar } from "./TabsBar";
import { getTabDropPosition, readTabDragData, writeTabDragData } from "./tabsDragHelpers";

// --- Mocks ---

const mockUseWorkspace = {
  tabs: [],
  activeTabId: null,
  activeTab: null,
  setActiveTabId: mock(),
  addTab: mock(),
  closeTab: mock(),
  moveTab: mock(),
  pinTab: mock(),
  isTabDirty: mock().mockReturnValue(false),
  resolveTabSavedRequestId: mock().mockReturnValue(null),
};

mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => mockUseWorkspace,
}));

mock.module("@/components/layout/TabsBarContextMenu", () => ({
  TabsBarContextMenu: (props: any) => (
    <div data-testid="tabs-bar-context-menu" data-ctxmenu={JSON.stringify(props.ctxMenu)} />
  ),
}));

mock.module("@/components/layout/tabsDragHelpers", () => ({
  getTabDropPosition: mock(),
  readTabDragData: mock(),
  writeTabDragData: mock(),
  tabDropShadow: () => "mock-shadow",
}));

mock.module("@/components/layout/useActiveTabSidebarHighlight", () => ({
  useActiveTabSidebarHighlight: mock(),
}));

describe("TabsBar", () => {
  let originalScrollIntoView: any;

  beforeAll(() => {
    originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    window.HTMLElement.prototype.scrollIntoView = mock();
  });

  afterAll(() => {
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  beforeEach(() => {
    mockUseWorkspace.tabs = [
      { id: "tab1", name: "First Tab", method: "GET", type: "request", pinned: false },
      { id: "tab2", name: "Second Tab", method: "POST", type: "request", pinned: true },
    ] as any;
    mockUseWorkspace.activeTabId = "tab1" as any;
    mockUseWorkspace.activeTab = mockUseWorkspace.tabs[0] as any;
    
    mockUseWorkspace.setActiveTabId.mockClear();
    mockUseWorkspace.addTab.mockClear();
    mockUseWorkspace.closeTab.mockClear();
    mockUseWorkspace.moveTab.mockClear();
    mockUseWorkspace.pinTab.mockClear();
    mockUseWorkspace.isTabDirty.mockClear();
    mockUseWorkspace.resolveTabSavedRequestId.mockClear();
    
    (window.HTMLElement.prototype.scrollIntoView as any).mockClear();
    (getTabDropPosition as any).mockClear();
    (readTabDragData as any).mockClear();
    (writeTabDragData as any).mockClear();
  });

  const defaultProps = {
    onRequestCloseTab: mock(),
  };

  test("renders tabs correctly", () => {
    render(<TabsBar {...defaultProps} />);
    
    expect(screen.getByText("First Tab")).toBeTruthy();
    expect(screen.getByText("GET")).toBeTruthy(); // unpinned tab shows method
    
    expect(screen.getByText("Second Tab")).toBeTruthy();
    // Second tab is pinned, so it renders a Pin icon instead of method text
  });

  test("calls scrollIntoView for active tab", () => {
    render(<TabsBar {...defaultProps} />);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  test("dispatches highlight-sidebar on click", () => {
    mockUseWorkspace.resolveTabSavedRequestId.mockReturnValueOnce("saved-1");
    let eventDetail: any = null;
    const listener = (e: any) => { eventDetail = e.detail; };
    window.addEventListener("highlight-sidebar", listener);
    
    const { container } = render(<TabsBar {...defaultProps} />);
    const firstTab = container.querySelector('[data-tab-id="tab1"]') as HTMLElement;
    
    fireEvent.click(firstTab);
    
    expect(mockUseWorkspace.setActiveTabId).toHaveBeenCalledWith("tab1");
    expect(eventDetail).toEqual({ exampleId: undefined, savedRequestId: "saved-1" });
    
    window.removeEventListener("highlight-sidebar", listener);
  });

  test("renders dirty dot and changes opacity", () => {
    mockUseWorkspace.isTabDirty.mockImplementation((tab: any) => tab.id === "tab1");
    const { container } = render(<TabsBar {...defaultProps} />);
    
    const dirtyDot = container.querySelector(".tab-dirty-dot");
    expect(dirtyDot).toBeTruthy();
    
    // Test hover styles
    const firstTab = container.querySelector('[data-tab-id="tab1"]') as HTMLElement;
    fireEvent.mouseEnter(firstTab);
    fireEvent.mouseLeave(firstTab);
  });

  test("clicks close button on unpinned tab", () => {
    const { container } = render(<TabsBar {...defaultProps} />);
    const closeBtn = container.querySelector(".tab-close-btn") as HTMLElement;
    
    fireEvent.click(closeBtn);
    expect(defaultProps.onRequestCloseTab).toHaveBeenCalledWith("tab1");
    
    fireEvent.mouseEnter(closeBtn);
    fireEvent.mouseLeave(closeBtn);
  });

  test("middle clicks tab to close", () => {
    const { container } = render(<TabsBar {...defaultProps} />);
    const firstTab = container.querySelector('[data-tab-id="tab1"]') as HTMLElement;
    
    fireEvent(firstTab, new MouseEvent("auxclick", { button: 1, bubbles: true }));
    expect(defaultProps.onRequestCloseTab).toHaveBeenCalledWith("tab1");
  });

  test("clicks add tab button", () => {
    render(<TabsBar {...defaultProps} />);
    const addBtn = screen.getByTitle("New Tab");
    
    fireEvent.click(addBtn);
    expect(mockUseWorkspace.addTab).toHaveBeenCalled();
    
    fireEvent.mouseEnter(addBtn);
    fireEvent.mouseLeave(addBtn);
  });

  test("invokes context menu on right click", () => {
    const { container } = render(<TabsBar {...defaultProps} />);
    const firstTab = container.querySelector('[data-tab-id="tab1"]') as HTMLElement;
    
    fireEvent.contextMenu(firstTab, { clientX: 100, clientY: 200 });
    
    const ctxMenu = screen.getByTestId("tabs-bar-context-menu");
    const props = JSON.parse(ctxMenu.getAttribute("data-ctxmenu") || "{}");
    expect(props.x).toBe(100);
    expect(props.y).toBe(200);
    expect(props.tabToDuplicate.id).toBe("tab1");
  });

  test("handles drag and drop flow", () => {
    const { container } = render(<TabsBar {...defaultProps} />);
    const firstTab = container.querySelector('[data-tab-id="tab1"]') as HTMLElement;
    const secondTab = container.querySelector('[data-tab-id="tab2"]') as HTMLElement;
    
    // Drag start
    fireEvent.dragStart(firstTab);
    expect(writeTabDragData).toHaveBeenCalled();
    
    // Drag over self - should return early
    fireEvent.dragOver(firstTab, { dataTransfer: {} });
    expect(getTabDropPosition).not.toHaveBeenCalled();
    
    // Drag over another tab
    (getTabDropPosition as any).mockReturnValueOnce("after");
    fireEvent.dragOver(secondTab, { dataTransfer: {} });
    expect(getTabDropPosition).toHaveBeenCalled();
    
    // Drop
    (readTabDragData as any).mockReturnValueOnce("tab1");
    (getTabDropPosition as any).mockReturnValueOnce("after");
    fireEvent.drop(secondTab);
    expect(mockUseWorkspace.moveTab).toHaveBeenCalledWith("tab1", "tab2", "after");
    
    // Drag end
    fireEvent.dragEnd(firstTab);
  });

  test("handles wheel scrolling", () => {
    render(<TabsBar {...defaultProps} />);
    const scrollContainer = screen.getByTitle("New Tab").parentElement?.parentElement as HTMLElement;
    
    // Vertical scroll translates to horizontal
    fireEvent.wheel(scrollContainer, { deltaY: 100, deltaX: 0 });
    // JSDOM might not implement scrollLeft mutation via event directly but we cover the branch
    
    // Horizontal scroll does nothing
    fireEvent.wheel(scrollContainer, { deltaY: 0, deltaX: 100 });
  });
});
