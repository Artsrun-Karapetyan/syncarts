import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { CollectionRow } from "./CollectionRow";

// Mock WorkspaceContext
mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    openExampleTab: mock(),
    openRequestTab: mock(),
    openFolderTab: mock(),
  }),
}));

// Mock utilities
mock.module("@/components/layout/sidebar/utils/utils", () => ({
  countItems: (items: any[]) => items.length,
}));

describe("CollectionRow", () => {
  const mockDragHandlers = {
    canDrag: true,
    draggingEntity: null,
    dropTarget: null,
    onDragStart: mock(),
    onDragOver: mock(),
    onDrop: mock(),
    onDragEnd: mock(),
  };

  const defaultProps: any = {
    collection: {
      id: "col1",
      name: "Test Collection",
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    expandedCollections: {} as Record<string, boolean>,
    setExpandedCollections: mock(),
    highlightedCollectionId: null,
    openCollectionTab: mock(),
    renamingId: null,
    renameValue: "",
    setRenameValue: mock(),
    handleRenameSubmit: mock(),
    setRenamingId: mock(),
    handleContextMenu: mock(),
    dragHandlers: mockDragHandlers,
    isViewer: false,
    expandedFolders: {},
    setExpandedFolders: mock(),
    highlightedExampleId: null,
    highlightedRequestId: null,
    highlightedFolderId: null,
    collectionSearch: "",
  };

  beforeEach(() => {
    defaultProps.setExpandedCollections.mockClear();
    defaultProps.openCollectionTab.mockClear();
    defaultProps.handleContextMenu.mockClear();
    mockDragHandlers.onDragStart.mockClear();
    mockDragHandlers.onDragOver.mockClear();
    mockDragHandlers.onDrop.mockClear();
    mockDragHandlers.onDragEnd.mockClear();
  });

  test("renders collection name and item count", () => {
    render(<CollectionRow {...defaultProps} />);
    expect(screen.getByText("Test Collection")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy(); // Items count
  });

  test("toggles expanded state when chevron is clicked", () => {
    render(<CollectionRow {...defaultProps} />);
    const chevronBtn = screen.getByLabelText("Expand collection");
    fireEvent.click(chevronBtn);
    expect(defaultProps.setExpandedCollections).toHaveBeenCalled();
    const updater = defaultProps.setExpandedCollections.mock.calls[0][0];
    expect(updater({ col1: false })).toEqual({ col1: true });
  });

  test("opens collection tab and expands if collapsed on row click", () => {
    render(<CollectionRow {...defaultProps} />);
    const row = screen.getByText("Test Collection").closest(".sidebar-row")!;
    fireEvent.click(row);
    expect(defaultProps.setExpandedCollections).toHaveBeenCalled();
    const updater = defaultProps.setExpandedCollections.mock.calls[0][0];
    expect(updater({ col1: false })).toEqual({ col1: true });
    expect(defaultProps.openCollectionTab).toHaveBeenCalledWith("col1");
  });

  test("only opens tab if already expanded", () => {
    render(
      <CollectionRow {...defaultProps} expandedCollections={{ col1: true }} />,
    );
    const row = screen.getByText("Test Collection").closest(".sidebar-row")!;
    fireEvent.click(row);
    expect(defaultProps.setExpandedCollections).not.toHaveBeenCalled();
    expect(defaultProps.openCollectionTab).toHaveBeenCalledWith("col1");
  });

  test("calls handleContextMenu on right click", () => {
    render(<CollectionRow {...defaultProps} />);
    const row = screen.getByText("Test Collection").closest(".sidebar-row")!;
    fireEvent.contextMenu(row);
    expect(defaultProps.handleContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionId: "col1",
        itemId: "col1",
        itemType: "collection",
      }),
    );
  });

  test("calls handleContextMenu on more button click", () => {
    const { container } = render(<CollectionRow {...defaultProps} />);
    const moreBtn = container.querySelector(
      ".sidebar-action-icon",
    ) as HTMLDivElement;
    fireEvent.click(moreBtn);
    expect(defaultProps.handleContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionId: "col1",
        itemId: "col1",
        itemType: "collection",
      }),
    );
  });

  test("does not call handleContextMenu if isViewer", () => {
    render(<CollectionRow {...defaultProps} isViewer={true} />);
    const row = screen.getByText("Test Collection").closest(".sidebar-row")!;
    fireEvent.contextMenu(row);
    expect(defaultProps.handleContextMenu).not.toHaveBeenCalled();
  });

  test("drag events are bound", () => {
    render(<CollectionRow {...defaultProps} />);
    const row = screen.getByText("Test Collection").closest(".sidebar-row")!;

    fireEvent.dragStart(row);
    expect(mockDragHandlers.onDragStart).toHaveBeenCalled();

    fireEvent.dragOver(row);
    expect(mockDragHandlers.onDragOver).toHaveBeenCalled();

    fireEvent.drop(row);
    expect(mockDragHandlers.onDrop).toHaveBeenCalled();

    fireEvent.dragEnd(row);
    expect(mockDragHandlers.onDragEnd).toHaveBeenCalled();
  });

  test("renders child items when expanded", () => {
    const propsWithItems = {
      ...defaultProps,
      collection: {
        ...defaultProps.collection,
        items: [
          {
            id: "req1",
            type: "request" as const,
            name: "Test Request",
            method: "GET",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            folderId: null,
            collectionId: "col1",
            examples: [],
          },
        ],
      },
      expandedCollections: { col1: true },
    };
    render(<CollectionRow {...propsWithItems} />);
    expect(screen.getByText("Test Request")).toBeTruthy();
  });

  test("passes onContextMenu to children", () => {
    const propsWithItems = {
      ...defaultProps,
      collection: {
        ...defaultProps.collection,
        items: [
          {
            id: "req1",
            type: "request" as const,
            name: "Test Request",
            method: "GET",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            folderId: null,
            collectionId: "col1",
            examples: [],
          },
        ],
      },
      expandedCollections: { col1: true },
    };
    render(<CollectionRow {...propsWithItems} />);
    const childRow = screen.getByText("Test Request").closest(".sidebar-row")!;
    fireEvent.contextMenu(childRow);
    expect(defaultProps.handleContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionId: "col1",
        itemId: "req1",
        itemType: "request",
      }),
    );
  });
});
