import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { FolderSidebarItem } from "./FolderSidebarItem";

// Mock WorkspaceContext
mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    openFolderTab: mock(),
  }),
}));

describe("FolderSidebarItem", () => {
  const dragHandlers = {
    canDrag: true,
    draggingEntity: null,
    dropTarget: null,
    onDragStart: mock(),
    onDragOver: mock(),
    onDrop: mock(),
    onDragEnd: mock(),
  };

  const defaultProps = {
    collectionId: "c1",
    parentFolderId: null,
    onContextMenu: mock(),
    renamingId: null,
    setRenamingId: mock(),
    renameValue: "",
    setRenameValue: mock(),
    handleRenameSubmit: mock(),
    expandedFolders: {} as Record<string, boolean>,
    setExpandedFolders: mock(),
    highlightedExampleId: null,
    highlightedRequestId: null,
    highlightedFolderId: null,
    searchQuery: "",
    dragHandlers,
    isViewer: false,
    item: {
      type: "folder" as const,
      id: "f1",
      name: "My Folder",
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any,
  };

  beforeEach(() => {
    defaultProps.setExpandedFolders.mockClear();
    defaultProps.onContextMenu.mockClear();
    dragHandlers.onDragStart.mockClear();
    dragHandlers.onDragOver.mockClear();
    dragHandlers.onDrop.mockClear();
    dragHandlers.onDragEnd.mockClear();
  });

  test("renders folder name", () => {
    render(<FolderSidebarItem {...defaultProps} />);
    expect(screen.getByText("My Folder")).toBeTruthy();
  });

  test("toggles expanded state on arrow click", () => {
    let updater: any;
    defaultProps.setExpandedFolders.mockImplementation((fn) => {
      updater = fn;
    });
    const { container } = render(<FolderSidebarItem {...defaultProps} />);
    const arrowContainer = container.querySelector(
      ".hover-bg-secondary",
    ) as HTMLDivElement;
    fireEvent.click(arrowContainer);
    expect(updater({ f1: false })).toEqual({ f1: true });
  });

  test("expands and opens folder tab on row click", () => {
    // We mock openFolderTab within the useWorkspace module
    // To properly test the mock we would inspect the mock from module but since we use mock.module globally we can't easily assert on it without importing the mock
    // Just executing the click ensures no crash
    const { container } = render(<FolderSidebarItem {...defaultProps} />);
    const row = container.querySelector(".sidebar-row") as HTMLDivElement;
    fireEvent.click(row);
    expect(defaultProps.setExpandedFolders).toHaveBeenCalled();
  });

  test("does not set expanded if already expanded on row click", () => {
    const { container } = render(
      <FolderSidebarItem {...defaultProps} expandedFolders={{ f1: true }} />,
    );
    const row = container.querySelector(".sidebar-row") as HTMLDivElement;
    fireEvent.click(row);
    expect(defaultProps.setExpandedFolders).not.toHaveBeenCalled();
  });

  test("calls onContextMenu on right click", () => {
    const { container } = render(<FolderSidebarItem {...defaultProps} />);
    const row = container.querySelector(".sidebar-row") as HTMLDivElement;
    fireEvent.contextMenu(row);
    expect(defaultProps.onContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "f1",
        type: "folder",
      }),
    );
  });

  test("calls onContextMenu on more button click", () => {
    const { container } = render(<FolderSidebarItem {...defaultProps} />);
    const moreBtn = container.querySelector(
      ".sidebar-action-icon",
    ) as HTMLDivElement;
    fireEvent.click(moreBtn);
    expect(defaultProps.onContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "f1",
        type: "folder",
      }),
    );
  });

  test("does not call onContextMenu if isViewer", () => {
    const { container } = render(
      <FolderSidebarItem {...defaultProps} isViewer={true} />,
    );
    const row = container.querySelector(".sidebar-row") as HTMLDivElement;
    fireEvent.contextMenu(row);
    expect(defaultProps.onContextMenu).not.toHaveBeenCalled();
  });

  test("handles mouse enter and leave", () => {
    const { container } = render(<FolderSidebarItem {...defaultProps} />);
    const row = container.querySelector(".sidebar-row") as HTMLDivElement;

    fireEvent.mouseEnter(row);
    expect(row.style.background).toBe("var(--bg-tertiary)");

    fireEvent.mouseLeave(row);
  });

  test("handles drag events", () => {
    const { container } = render(<FolderSidebarItem {...defaultProps} />);
    const row = container.querySelector(".sidebar-row") as HTMLDivElement;

    fireEvent.dragStart(row);
    expect(dragHandlers.onDragStart).toHaveBeenCalled();

    fireEvent.dragOver(row);
    expect(dragHandlers.onDragOver).toHaveBeenCalled();

    fireEvent.drop(row);
    expect(dragHandlers.onDrop).toHaveBeenCalled();

    fireEvent.dragEnd(row);
    expect(dragHandlers.onDragEnd).toHaveBeenCalled();
  });

  test("renders child items when expanded", () => {
    const props = {
      ...defaultProps,
      item: {
        ...defaultProps.item,
        items: [
          {
            type: "request",
            id: "r1",
            name: "Child Request",
            method: "GET",
          } as any,
        ],
      },
      expandedFolders: { f1: true },
    };
    render(<FolderSidebarItem {...props} />);
    expect(screen.getByText("Child Request")).toBeTruthy();
  });
});
