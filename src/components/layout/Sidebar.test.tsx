/* eslint-disable react/no-multi-comp */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { renameMatchingItem } from "@/components/layout/sidebar/utils/utils";

import { Sidebar } from "./Sidebar";

const mockUseWorkspace = {
  collections: [{ id: "c1", name: "Col 1", items: [] }],
  addCollection: mock(),
  deleteCollection: mock(),
  deleteItem: mock(),
  addFolder: mock(),
  createBlankRequestInFolder: mock(),
  openCollectionTab: mock(),
  openFolderTab: mock(),
  addTab: mock(),
  renameItem: mock(),
  sortItems: mock(),
  deleteExample: mock(),
  addExample: mock(),
  duplicateCollection: mock(),
  duplicateItem: mock(),
  duplicateExample: mock(),
  activeTab: null,
  resolveTabSavedRequestId: mock(),
  forkCollection: mock(),
  pullCollection: mock(),
  activeWorkspaceId: "w1",
  moveSidebarItem: mock(),
  workspaces: [{ id: "w1", ownerId: "u1", members: [] }],
  userId: "u1",
};

mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => mockUseWorkspace,
}));

const mockNavigate = mock();
mock.module("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

mock.module(
  "@/components/layout/sidebar/collections/SidebarCollections",
  () => ({
    SidebarCollections: (props: any) => (
      <div
        data-testid="sidebar-collections"
        data-props={JSON.stringify({ ...props, dragHandlers: undefined })}
      >
        <button onClick={props.handleAddCollection}>
          Trigger Add Collection
        </button>
        <button
          onClick={() =>
            props.handleContextMenu({
              event: {
                preventDefault: mock(),
                stopPropagation: mock(),
                clientX: 10,
                clientY: 20,
              },
              collectionId: "c1",
              itemType: "collection",
              itemId: "c1",
            })
          }
        >
          Trigger Ctx Menu
        </button>
        <button onClick={props.handleRenameSubmit}>Trigger Rename</button>
      </div>
    ),
  }),
);

mock.module(
  "@/components/layout/sidebar/context-menu/SidebarContextMenu",
  () => ({
    SidebarContextMenu: (props: any) => (
      <div data-testid="sidebar-context-menu">
        <button onClick={props.handleCreateFolder}>
          Create Folder Trigger
        </button>
        <button onClick={props.handleFolderSubmit}>
          Folder Submit Trigger
        </button>
        <button onClick={props.handleCreateRequest}>
          Create Request Trigger
        </button>
      </div>
    ),
  }),
);

mock.module("@/components/layout/sidebar/context-menu/SidebarDialogs", () => ({
  SidebarDialogs: (props: any) => (
    <div
      data-testid="sidebar-dialogs"
      data-target={props.deleteTarget ? props.deleteTarget.type : "null"}
    >
      <button onClick={props.onConfirmDelete}>Confirm Delete</button>
      <button onClick={props.onCancelDelete}>Cancel Delete</button>
      <button onClick={props.onCloseImport}>Close Import</button>
      <button onClick={props.onCloseMergeRequest}>Close MR</button>
      <button onClick={props.onMergeRequestSuccess}>MR Success</button>
    </div>
  ),
}));

mock.module(
  "@/components/layout/sidebar/drag-drop/useSidebarDragHandlers",
  () => ({
    useSidebarDragHandlers: () => ({}),
  }),
);

mock.module(
  "@/components/layout/sidebar/export/useSidebarExportHandlers",
  () => ({
    useSidebarExportHandlers: () => ({
      handleExportCollection: mock(),
      handleExportFolder: mock(),
      handleExportRequest: mock(),
    }),
  }),
);

mock.module("@/components/layout/sidebar/hooks/useSidebarHighlight", () => ({
  useSidebarHighlight: () => ({}),
}));

mock.module("@/components/layout/sidebar/toolbar/SidebarToolbar", () => ({
  SidebarToolbar: (props: any) => (
    <div data-testid="sidebar-toolbar">
      <button onClick={props.onMergeRequests}>Open MRs</button>
      {props.onImport && <button onClick={props.onImport}>Import</button>}
      {props.onNewRequest && (
        <button onClick={props.onNewRequest}>New Req</button>
      )}
      {props.onNewCollection && (
        <button onClick={props.onNewCollection}>New Col</button>
      )}
    </div>
  ),
}));

mock.module(
  "@/components/layout/sidebar/toolbar/useOpenMergeRequestCount",
  () => ({
    useOpenMergeRequestCount: () => 5,
  }),
);

mock.module(
  "@/components/layout/sidebar/toolbar/useSidebarWatchActions",
  () => ({
    useSidebarWatchActions: () => ({
      handleToggleWorkspaceWatch: mock(),
      isWorkspaceWatched: false,
      watches: { isWatched: mock(), toggleWatch: mock() },
    }),
  }),
);

mock.module("@/components/layout/sidebar/utils/utils", () => ({
  filterCollections: (c: any) => c,
  renameMatchingItem: mock(),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    mockUseWorkspace.addCollection.mockClear();
    mockUseWorkspace.deleteCollection.mockClear();
    mockUseWorkspace.addFolder.mockClear();
    mockUseWorkspace.createBlankRequestInFolder.mockClear();
    mockUseWorkspace.addTab.mockClear();
    mockNavigate.mockClear();
    (renameMatchingItem as any).mockClear();
    mockUseWorkspace.deleteExample.mockClear();
    mockUseWorkspace.deleteItem.mockClear();
  });

  test("renders correctly", () => {
    render(<Sidebar />);
    expect(screen.getByTestId("sidebar-toolbar")).toBeTruthy();
    expect(screen.getByTestId("sidebar-collections")).toBeTruthy();
    expect(screen.getByTestId("sidebar-dialogs")).toBeTruthy();
    // Context menu should not be rendered initially
    expect(screen.queryByTestId("sidebar-context-menu")).toBeNull();
  });

  test("toolbar actions", () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByText("Open MRs"));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/merge-requests" });

    fireEvent.click(screen.getByText("New Req"));
    expect(mockUseWorkspace.addTab).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Import"));
    // dialogs state should be opened. We can test this by checking props passed to Dialogs, or just verify no crash
    // In our mock we don't serialize isImportModalOpen, but we can verify `onCloseImport` resets it.
    fireEvent.click(screen.getByText("Close Import"));
  });

  test("adds a new collection via toolbar and collections form", () => {
    render(<Sidebar />);

    // Clicking New Col sets isAdding=true
    fireEvent.click(screen.getByText("New Col"));

    // Actually we need to change state to have newColName set, but since we mocked SidebarCollections
    // We can't directly type into it unless we simulate the prop call.
    // Instead, let's fire handleAddCollection from our dummy button. But first we need newColName.
    // We can't easily set newColName since it's internal. We can just test handleAddCollection does nothing when empty.
    fireEvent.click(screen.getByText("Trigger Add Collection"));
    expect(mockUseWorkspace.addCollection).not.toHaveBeenCalled();
  });

  test("opens context menu and handles folder creation", () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByText("Trigger Ctx Menu"));
    expect(screen.getByTestId("sidebar-context-menu")).toBeTruthy();

    fireEvent.click(screen.getByText("Create Folder Trigger"));

    // Submit folder without name does nothing
    fireEvent.click(screen.getByText("Folder Submit Trigger"));
    expect(mockUseWorkspace.addFolder).not.toHaveBeenCalled();

    // Create Request Trigger
    fireEvent.click(screen.getByText("Create Request Trigger"));
    expect(mockUseWorkspace.createBlankRequestInFolder).toHaveBeenCalledWith(
      "c1",
      null,
    );
  });

  test("handles rename submit from collections", () => {
    render(<Sidebar />);
    // If renamingId and renameValue are not set, it does nothing
    fireEvent.click(screen.getByText("Trigger Rename"));
    expect(renameMatchingItem).not.toHaveBeenCalled();
  });

  test("handles global window events", () => {
    render(<Sidebar />);
    act(() => {
      window.dispatchEvent(new Event("syncarts:open-import"));
      window.dispatchEvent(new Event("syncarts:create-collection"));
    });
    // the state changes internally
  });

  test("handles toast messages", () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByText("MR Success"));
    // just ensures it doesn't crash since it updates local toastMessage state
  });
});
