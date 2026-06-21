import { describe, expect, test, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { SidebarItem } from "./SidebarItem";
import React from "react";
// Mock WorkspaceContext
mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    openRequestTab: mock(),
    openFolderTab: mock(),
  }),
}));

describe("SidebarItem", () => {
  const dragHandlers = {
    canDrag: false,
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
    expandedFolders: {},
    setExpandedFolders: mock(),
    highlightedExampleId: null,
    highlightedRequestId: null,
    highlightedFolderId: null,
    dragHandlers,
  };

  test("renders RequestSidebarItem when item type is request", () => {
    const item = { type: "request", id: "r1", name: "My Request", method: "GET" } as any;
    render(<SidebarItem {...defaultProps} item={item} />);
    expect(screen.getByText("My Request")).toBeTruthy();
  });

  test("renders FolderSidebarItem when item type is folder", () => {
    const item = { type: "folder", id: "f1", name: "My Folder" } as any;
    render(<SidebarItem {...defaultProps} item={item} />);
    expect(screen.getByText("My Folder")).toBeTruthy();
  });
});
