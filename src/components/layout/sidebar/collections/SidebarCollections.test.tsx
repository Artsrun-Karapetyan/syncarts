import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { SidebarCollections } from "./SidebarCollections";

// Mock WorkspaceContext for CollectionRow and its children
mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    openExampleTab: mock(),
    openRequestTab: mock(),
    openFolderTab: mock(),
  }),
}));

describe("SidebarCollections", () => {
  const defaultProps = {
    collections: [],
    filteredCollections: [],
    isAdding: false,
    newColName: "",
    collectionSearch: "",
    expandedCollections: {},
    expandedFolders: {},
    renamingId: null,
    renameValue: "",
    highlightedCollectionId: null,
    highlightedExampleId: null,
    highlightedRequestId: null,
    highlightedFolderId: null,
    setIsAdding: mock(),
    setNewColName: mock(),
    setCollectionSearch: mock(),
    setExpandedCollections: mock(),
    setExpandedFolders: mock(),
    setRenamingId: mock(),
    setRenameValue: mock(),
    setDeleteTarget: mock(),
    handleAddCollection: mock(),
    handleRenameSubmit: mock(),
    handleContextMenu: mock(),
    openCollectionTab: mock(),
    dragHandlers: {
      canDrag: true,
      draggingEntity: null,
      dropTarget: null,
      onDragStart: mock(),
      onDragOver: mock(),
      onDrop: mock(),
      onDragEnd: mock(),
    },
    isViewer: false,
  };

  beforeEach(() => {
    // Clear mocks if necessary
  });

  test("renders EmptyCollections when no collections and not adding", () => {
    render(<SidebarCollections {...defaultProps} />);
    expect(screen.getByText(/No collections yet/)).toBeTruthy();
  });

  test("renders NewCollectionInput when isAdding is true", () => {
    render(<SidebarCollections {...defaultProps} isAdding={true} />);
    expect(screen.getByPlaceholderText("Collection name")).toBeTruthy();
    // EmptyCollections should not be rendered if isAdding is true
    expect(screen.queryByText(/No collections yet/)).toBeNull();
  });

  test("renders filtered collections", () => {
    const collections: any[] = [
      {
        id: "col1",
        name: "Collection 1",
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "col2",
        name: "Collection 2",
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    render(
      <SidebarCollections
        {...defaultProps}
        collections={collections}
        filteredCollections={collections}
      />,
    );
    expect(screen.getByText("Collection 1")).toBeTruthy();
    expect(screen.getByText("Collection 2")).toBeTruthy();
    expect(screen.queryByText(/No collections yet/)).toBeNull();
  });

  test("renders search input", () => {
    render(
      <SidebarCollections {...defaultProps} collectionSearch="test query" />,
    );
    const input = screen.getByPlaceholderText(
      "Search collections & items...",
    ) as HTMLInputElement;
    expect(input.value).toBe("test query");
  });
});
