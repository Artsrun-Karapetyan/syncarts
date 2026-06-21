import { describe, expect, test, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SidebarContextMenu } from "./SidebarContextMenu";
import React from "react";

// Mock createPortal to render children directly into the container
mock.module("react-dom", () => ({
  createPortal: (node: any) => node,
}));

// We mock WatchMenuButton for simplicity
mock.module("@/components/layout/sidebar/toolbar/WatchMenuButton", () => ({
  WatchMenuButton: (props: any) => (
    <button data-testid="watch-btn" onClick={() => props.onDone("watched!")}>
      Watch
    </button>
  ),
}));

// We mock NewFolderMenuInput
mock.module("@/components/layout/sidebar/context-menu/NewFolderMenuInput", () => ({
  NewFolderMenuInput: () => <input data-testid="new-folder-input" />,
}));

describe("SidebarContextMenu", () => {
  const defaultProps: any = {
    ctxMenu: {
      x: 0,
      y: 0,
      collectionId: "c1",
      itemType: "collection" as const,
      itemId: "c1",
      itemName: "My Collection",
    },
    menuRef: { current: null },
    collections: [{ id: "c1", name: "My Collection", items: [], createdAt: 0, updatedAt: 0, type: "collection" as const }],
    activeHasResponse: false,
    isCreatingFolder: false,
    newFolderName: "",
    setCtxMenu: mock(),
    setRenamingId: mock(),
    setRenameValue: mock(),
    setDeleteTarget: mock(),
    setMergeRequestTarget: mock(),
    setIsCreatingFolder: mock(),
    setNewFolderName: mock(),
    handleCreateFolder: mock(),
    handleFolderSubmit: mock(),
    handleCreateRequest: mock(),
    handleExportCollection: mock(),
    handleExportFolder: mock(),
    handleExportRequest: mock(),
    addExample: mock(),
    activeTabStatus: undefined,
    forkCollection: mock(),
    pullCollection: mock().mockResolvedValue(undefined),
    sortItems: mock(),
    showToast: mock(),
    duplicateCollection: mock(),
    duplicateItem: mock(),
    duplicateExample: mock(),
    isWatched: mock().mockReturnValue(false),
    toggleWatch: mock(),
    isOwner: true,
    isViewer: false,
    openCollectionTab: mock(),
    openFolderTab: mock(),
  };

  beforeEach(() => {
    mock.restore();
  });

  test("renders rename option and handles click", () => {
    render(<SidebarContextMenu {...defaultProps} />);
    const renameBtn = screen.getByText("Rename");
    fireEvent.click(renameBtn);
    expect(defaultProps.setRenameValue).toHaveBeenCalledWith("My Collection");
    expect(defaultProps.setRenamingId).toHaveBeenCalledWith("c1");
    expect(defaultProps.setCtxMenu).toHaveBeenCalledWith(null);
  });

  test("renders duplicate collection option", () => {
    render(<SidebarContextMenu {...defaultProps} />);
    const duplicateBtn = screen.getByText("Duplicate collection");
    fireEvent.click(duplicateBtn);
    expect(defaultProps.duplicateCollection).toHaveBeenCalledWith("c1");
  });

  test("renders duplicate folder option", () => {
    const ctxMenu = { ...defaultProps.ctxMenu, itemType: "folder" as const, itemId: "f1" };
    render(<SidebarContextMenu {...defaultProps} ctxMenu={ctxMenu} />);
    const duplicateBtn = screen.getByText("Duplicate folder");
    fireEvent.click(duplicateBtn);
    expect(defaultProps.duplicateItem).toHaveBeenCalledWith("c1", "f1");
  });

  test("renders duplicate request option", () => {
    const ctxMenu = { ...defaultProps.ctxMenu, itemType: "request" as const, itemId: "r1" };
    render(<SidebarContextMenu {...defaultProps} ctxMenu={ctxMenu} />);
    const duplicateBtn = screen.getByText("Duplicate request");
    fireEvent.click(duplicateBtn);
    expect(defaultProps.duplicateItem).toHaveBeenCalledWith("c1", "r1");
  });

  test("renders duplicate example option", () => {
    const ctxMenu = { ...defaultProps.ctxMenu, itemType: "example" as const, itemId: "e1", requestId: "r1" };
    render(<SidebarContextMenu {...defaultProps} ctxMenu={ctxMenu} />);
    const duplicateBtn = screen.getByText("Duplicate example");
    fireEvent.click(duplicateBtn);
    expect(defaultProps.duplicateExample).toHaveBeenCalledWith("c1", "r1", "e1");
  });

  test("renders run collection and folder options", () => {
    render(<SidebarContextMenu {...defaultProps} />);
    const runBtn = screen.getByText("Run collection");
    fireEvent.click(runBtn);
    expect(defaultProps.openCollectionTab).toHaveBeenCalledWith("c1", "runs");

    const ctxMenu = { ...defaultProps.ctxMenu, itemType: "folder" as const, itemId: "f1" };
    render(<SidebarContextMenu {...defaultProps} ctxMenu={ctxMenu} />);
    const runBtnFolder = screen.getByText("Run folder");
    fireEvent.click(runBtnFolder);
    expect(defaultProps.openFolderTab).toHaveBeenCalledWith("c1", "f1", "runs");
  });

  test("renders add example for request", () => {
    const ctxMenu = { ...defaultProps.ctxMenu, itemType: "request" as const, itemId: "r1" };
    render(<SidebarContextMenu {...defaultProps} ctxMenu={ctxMenu} activeTabStatus={200} />);
    const addExampleBtn = screen.getByText("Add example");
    fireEvent.click(addExampleBtn);
    expect(defaultProps.addExample).toHaveBeenCalledWith("c1", "r1", "200");
  });
  
  test("renders add example for request default status", () => {
    const ctxMenu = { ...defaultProps.ctxMenu, itemType: "request" as const, itemId: "r1" };
    render(<SidebarContextMenu {...defaultProps} ctxMenu={ctxMenu} activeTabStatus={undefined} />);
    const addExampleBtn = screen.getByText("Add example");
    fireEvent.click(addExampleBtn);
    expect(defaultProps.addExample).toHaveBeenCalledWith("c1", "r1", "New Example");
  });

  test("renders folder/request creation", () => {
    render(<SidebarContextMenu {...defaultProps} isCreatingFolder={true} />);
    const newFolderBtn = screen.getByText("New folder");
    fireEvent.click(newFolderBtn);
    expect(defaultProps.handleCreateFolder).toHaveBeenCalled();
    expect(screen.getByTestId("new-folder-input")).toBeTruthy();

    const newRequestBtn = screen.getByText("New request");
    fireEvent.click(newRequestBtn);
    expect(defaultProps.handleCreateRequest).toHaveBeenCalled();
  });

  test("renders export options", () => {
    render(<SidebarContextMenu {...defaultProps} />);
    const exportBtn = screen.getByText("Export collection");
    fireEvent.click(exportBtn);
    expect(defaultProps.handleExportCollection).toHaveBeenCalledWith("c1");

    const ctxFolder = { ...defaultProps.ctxMenu, itemType: "folder" as const, itemId: "f1" };
    render(<SidebarContextMenu {...defaultProps} ctxMenu={ctxFolder} />);
    const exportFolderBtn = screen.getByText("Export folder");
    fireEvent.click(exportFolderBtn);
    expect(defaultProps.handleExportFolder).toHaveBeenCalledWith("c1", "f1");

    const ctxRequest = { ...defaultProps.ctxMenu, itemType: "request" as const, itemId: "r1" };
    render(<SidebarContextMenu {...defaultProps} ctxMenu={ctxRequest} />);
    const exportRequestBtn = screen.getByText("Export request");
    fireEvent.click(exportRequestBtn);
    expect(defaultProps.handleExportRequest).toHaveBeenCalledWith("c1", "r1");
  });

  test("renders delete options correctly", () => {
    render(<SidebarContextMenu {...defaultProps} />);
    const deleteColBtn = screen.getByText("Delete collection");
    fireEvent.click(deleteColBtn);
    expect(defaultProps.setDeleteTarget).toHaveBeenCalledWith({ id: "c1", type: "collection" });

    const ctxItem = { ...defaultProps.ctxMenu, itemType: "folder" as const, itemId: "f1" };
    render(<SidebarContextMenu {...defaultProps} ctxMenu={ctxItem} />);
    const deleteItemBtn = screen.getByText("Delete folder");
    fireEvent.click(deleteItemBtn);
    expect(defaultProps.setDeleteTarget).toHaveBeenCalledWith({ id: "f1", type: "item", collectionId: "c1" });

    const ctxExample = { ...defaultProps.ctxMenu, itemType: "example" as const, itemId: "e1", requestId: "r1" };
    render(<SidebarContextMenu {...defaultProps} ctxMenu={ctxExample} />);
    const deleteExBtn = screen.getByText("Delete example");
    fireEvent.click(deleteExBtn);
    expect(defaultProps.setDeleteTarget).toHaveBeenCalledWith({ id: "e1", type: "example", collectionId: "c1", requestId: "r1" });
  });

  test("renders sort options", () => {
    render(<SidebarContextMenu {...defaultProps} />);
    // Since sort is in a submenu, we might need to find it by opening or if it's always rendered, we can find it
    // MenuSubmenu always renders its children conditionally on open, let's hover the submenu
    const submenuBtn = screen.getByText("Sort");
    fireEvent.mouseEnter(submenuBtn.parentElement!); // the div with relative
    
    const sortDefault = screen.getByText("Folders first");
    fireEvent.click(sortDefault);
    expect(defaultProps.sortItems).toHaveBeenCalledWith("c1", null, "default");

    fireEvent.mouseEnter(submenuBtn.parentElement!);
    const sortAZ = screen.getByText("A to Z");
    fireEvent.click(sortAZ);
    expect(defaultProps.sortItems).toHaveBeenCalledWith("c1", null, "az");
  });

  test("handles fork and pull options", async () => {
    const forkCol = { id: "c1", name: "Fork", type: "collection" as const, fork: { originalWorkspaceId: "w1", originalCollectionId: "oc1" }, items: [], createdAt: 0, updatedAt: 0 };
    render(<SidebarContextMenu {...defaultProps} collections={[forkCol]} />);
    
    const syncBtn = screen.getByText("Sync");
    fireEvent.mouseEnter(syncBtn.parentElement!);

    const forkBtn = screen.getByText("Fork collection");
    fireEvent.click(forkBtn);
    expect(defaultProps.forkCollection).toHaveBeenCalledWith("c1");

    fireEvent.mouseEnter(syncBtn.parentElement!);
    const pullBtn = screen.getByText("Pull latest");
    fireEvent.click(pullBtn);
    expect(defaultProps.pullCollection).toHaveBeenCalledWith("c1");

    fireEvent.mouseEnter(syncBtn.parentElement!);
    const mergeBtn = screen.getByText("Create Merge Request");
    fireEvent.click(mergeBtn);
    expect(defaultProps.setMergeRequestTarget).toHaveBeenCalledWith({
      sourceCollectionId: "c1",
      targetWorkspaceId: "w1",
      targetCollectionId: "oc1"
    });
  });

  test("pull collection error handling", async () => {
    const forkCol = { id: "c1", name: "Fork", type: "collection" as const, fork: { originalWorkspaceId: "w1", originalCollectionId: "oc1" }, items: [], createdAt: 0, updatedAt: 0 };
    const pullCollection = mock().mockRejectedValue(new Error("Network Error"));
    render(<SidebarContextMenu {...defaultProps} collections={[forkCol]} pullCollection={pullCollection} />);
    
    const syncBtn = screen.getByText("Sync");
    fireEvent.mouseEnter(syncBtn.parentElement!);

    const pullBtn = screen.getByText("Pull latest");
    fireEvent.click(pullBtn);
    
    await waitFor(() => {
      expect(defaultProps.showToast).toHaveBeenCalledWith("Network Error");
    });
  });

  test("renders WatchMenuButton and handles done", () => {
    render(<SidebarContextMenu {...defaultProps} />);
    const watchBtn = screen.getByTestId("watch-btn");
    fireEvent.click(watchBtn);
    expect(defaultProps.showToast).toHaveBeenCalledWith("watched!");
    expect(defaultProps.setCtxMenu).toHaveBeenCalledWith(null);
  });
});
