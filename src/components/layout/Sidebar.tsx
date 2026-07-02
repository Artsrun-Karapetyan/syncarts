import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { SidebarCollections } from "@/components/layout/sidebar/collections/SidebarCollections";
import { SidebarContextMenu } from "@/components/layout/sidebar/context-menu/SidebarContextMenu";
import { SidebarDialogs } from "@/components/layout/sidebar/context-menu/SidebarDialogs";
import { useSidebarDragHandlers } from "@/components/layout/sidebar/drag-drop/useSidebarDragHandlers";
import { useSidebarExportHandlers } from "@/components/layout/sidebar/export/useSidebarExportHandlers";
import { useSidebarHighlight } from "@/components/layout/sidebar/hooks/useSidebarHighlight";
import { SIDEBAR_ROOT_STYLE } from "@/components/layout/sidebar/sidebarStyles";
import { SidebarToolbar } from "@/components/layout/sidebar/toolbar/SidebarToolbar";
import { useOpenMergeRequestCount } from "@/components/layout/sidebar/toolbar/useOpenMergeRequestCount";
import { useSidebarWatchActions } from "@/components/layout/sidebar/toolbar/useSidebarWatchActions";
import type {
  ContextMenuRequest,
  CtxMenuState,
  DeleteTarget,
  MergeRequestTarget,
} from "@/components/layout/sidebar/types";
import {
  filterCollections,
  renameMatchingItem,
} from "@/components/layout/sidebar/utils/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function Sidebar() {
  const {
    collections,
    addCollection,
    deleteCollection,
    deleteItem,
    addFolder,
    createBlankRequestInFolder,
    openCollectionTab,
    openFolderTab,
    addTab,
    renameItem,
    sortItems,
    deleteExample,
    addExample,
    duplicateCollection,
    duplicateItem,
    duplicateExample,
    activeTab,
    resolveTabSavedRequestId,
    forkCollection,
    pullCollection,
    activeWorkspaceId,
    moveSidebarItem,
    workspaces,
    userId,
  } = useWorkspace();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<
    Record<string, boolean>
  >({});
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [mergeRequestTarget, setMergeRequestTarget] =
    useState<MergeRequestTarget | null>(null);
  const openMrCount = useOpenMergeRequestCount(activeWorkspaceId);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    highlightedCollectionId,
    highlightedExampleId,
    highlightedFolderId,
    highlightedRequestId,
  } = useSidebarHighlight({
    activeTab,
    collections,
    resolveTabSavedRequestId,
    setExpandedCollections,
    setExpandedFolders,
  });
  const filteredCollections = filterCollections(collections, collectionSearch);
  const dragHandlers = useSidebarDragHandlers({
    collectionSearch,
    moveSidebarItem,
    setCtxMenu,
    setExpandedCollections,
    setExpandedFolders,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };
  const { handleExportCollection, handleExportFolder, handleExportRequest } =
    useSidebarExportHandlers(collections);
  const { handleToggleWorkspaceWatch, isWorkspaceWatched, watches } =
    useSidebarWatchActions(activeWorkspaceId, showToast);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setCtxMenu(null);
    };

    if (ctxMenu) document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [ctxMenu]);

  useEffect(() => {
    const handleOpenImport = () => setIsImportModalOpen(true);
    const handleCreateCollection = () => setIsAdding(true);

    window.addEventListener("syncarts:open-import", handleOpenImport);
    window.addEventListener(
      "syncarts:create-collection",
      handleCreateCollection,
    );

    return () => {
      window.removeEventListener("syncarts:open-import", handleOpenImport);
      window.removeEventListener(
        "syncarts:create-collection",
        handleCreateCollection,
      );
    };
  }, []);

  useEffect(() => {
    setExpandedCollections((current) => {
      const next = { ...current };

      for (const collection of collections) {
        if (next[collection.id] === undefined) next[collection.id] = true;
      }

      for (const key of Object.keys(next)) {
        if (!collections.some((collection) => collection.id === key))
          delete next[key];
      }

      return next;
    });
  }, [collections]);

  const handleAddCollection = () => {
    if (!newColName.trim()) return;
    addCollection(newColName.trim());
    setNewColName("");
    setIsAdding(false);
  };

  const handleContextMenu = (request: ContextMenuRequest) => {
    request.event.preventDefault();
    request.event.stopPropagation();
    setCtxMenu({
      x: request.event.clientX,
      y: request.event.clientY,
      collectionId: request.collectionId,
      itemId: request.itemId,
      itemType: request.itemType,
      itemName: request.itemName,
      requestId: request.requestId,
    });
  };

  const handleCreateFolder = () => {
    setIsCreatingFolder(true);
    setNewFolderName("");
  };

  const handleFolderSubmit = () => {
    if (!ctxMenu || !newFolderName.trim()) return;
    addFolder(
      ctxMenu.collectionId,
      ctxMenu.itemType === "folder" ? ctxMenu.itemId : null,
      newFolderName.trim(),
    );
    setNewFolderName("");
    setIsCreatingFolder(false);
    setCtxMenu(null);
  };

  const handleCreateRequest = () => {
    if (!ctxMenu) return;
    createBlankRequestInFolder(
      ctxMenu.collectionId,
      ctxMenu.itemType === "folder" ? ctxMenu.itemId : null,
    );
    setCtxMenu(null);
  };

  const handleRenameSubmit = () => {
    if (renamingId && renameValue.trim()) {
      renameMatchingItem({
        collections,
        targetId: renamingId,
        newName: renameValue.trim(),
        renameItem,
      });
    }
    setRenamingId(null);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget?.type === "collection") deleteCollection(deleteTarget.id);
    if (
      deleteTarget?.type === "example" &&
      deleteTarget.collectionId &&
      deleteTarget.requestId
    )
      deleteExample(
        deleteTarget.collectionId,
        deleteTarget.requestId,
        deleteTarget.id,
      );
    if (deleteTarget?.type === "item" && deleteTarget.collectionId)
      deleteItem(deleteTarget.collectionId, deleteTarget.id);
    setDeleteTarget(null);
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  // Offline (not signed in) has no cloud sync, so hide collaboration features
  // (merge requests, watch/notifications) just like a local-folder workspace.
  const isLocalWorkspace =
    activeWorkspace?.type === "local" || userId === "offline";
  const isOwner =
    !activeWorkspace?.ownerId || activeWorkspace.ownerId === userId;
  const isViewer =
    activeWorkspace?.members?.find((m) => m.userId === userId)?.role ===
    "VIEWER";

  return (
    <div style={SIDEBAR_ROOT_STYLE}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
          minHeight: 0,
        }}
      >
        <SidebarToolbar
          openMrCount={openMrCount}
          onMergeRequests={
            isLocalWorkspace
              ? undefined
              : () => navigate({ to: "/merge-requests" })
          }
          onImport={isViewer ? undefined : () => setIsImportModalOpen(true)}
          onNewRequest={isViewer ? undefined : () => addTab()}
          onNewCollection={
            isViewer
              ? undefined
              : () => {
                  setNewColName("");
                  setIsAdding(true);
                }
          }
          onToggleWorkspaceWatch={
            activeWorkspaceId && !isLocalWorkspace
              ? handleToggleWorkspaceWatch
              : undefined
          }
          isWorkspaceWatched={isWorkspaceWatched}
        />
        <SidebarCollections
          collections={collections}
          filteredCollections={filteredCollections}
          isAdding={isAdding}
          newColName={newColName}
          collectionSearch={collectionSearch}
          expandedCollections={expandedCollections}
          expandedFolders={expandedFolders}
          renamingId={renamingId}
          renameValue={renameValue}
          highlightedCollectionId={highlightedCollectionId}
          highlightedExampleId={highlightedExampleId}
          highlightedRequestId={highlightedRequestId}
          highlightedFolderId={highlightedFolderId}
          setIsAdding={setIsAdding}
          setNewColName={setNewColName}
          setCollectionSearch={setCollectionSearch}
          setExpandedCollections={setExpandedCollections}
          setExpandedFolders={setExpandedFolders}
          setRenamingId={setRenamingId}
          setRenameValue={setRenameValue}
          setDeleteTarget={setDeleteTarget}
          handleAddCollection={handleAddCollection}
          handleRenameSubmit={handleRenameSubmit}
          handleContextMenu={handleContextMenu}
          openCollectionTab={openCollectionTab}
          dragHandlers={dragHandlers}
          isViewer={isViewer}
        />
      </div>

      {ctxMenu &&
        (() => {
          return (
            <SidebarContextMenu
              ctxMenu={ctxMenu}
              menuRef={menuRef}
              collections={collections}
              activeHasResponse={!!activeTab?.response}
              activeTabStatus={activeTab?.response?.status}
              isCreatingFolder={isCreatingFolder}
              newFolderName={newFolderName}
              setCtxMenu={setCtxMenu}
              setRenamingId={setRenamingId}
              setRenameValue={setRenameValue}
              setDeleteTarget={setDeleteTarget}
              setMergeRequestTarget={setMergeRequestTarget}
              setIsCreatingFolder={setIsCreatingFolder}
              setNewFolderName={setNewFolderName}
              handleCreateFolder={handleCreateFolder}
              handleFolderSubmit={handleFolderSubmit}
              handleCreateRequest={handleCreateRequest}
              handleExportCollection={handleExportCollection}
              handleExportFolder={handleExportFolder}
              handleExportRequest={handleExportRequest}
              addExample={addExample}
              duplicateCollection={duplicateCollection}
              duplicateItem={duplicateItem}
              duplicateExample={duplicateExample}
              forkCollection={forkCollection}
              pullCollection={pullCollection}
              sortItems={sortItems}
              openCollectionTab={openCollectionTab}
              openFolderTab={openFolderTab}
              showToast={showToast}
              isWatched={watches.isWatched}
              toggleWatch={watches.toggleWatch}
              isOwner={isOwner}
              isViewer={isViewer}
              isLocalWorkspace={isLocalWorkspace}
            />
          );
        })()}

      <SidebarDialogs
        isImportModalOpen={isImportModalOpen}
        deleteTarget={deleteTarget}
        mergeRequestTarget={mergeRequestTarget}
        toastMessage={toastMessage}
        onCloseImport={() => setIsImportModalOpen(false)}
        onCancelDelete={() => setDeleteTarget(null)}
        onConfirmDelete={handleConfirmDelete}
        onCloseMergeRequest={() => setMergeRequestTarget(null)}
        onMergeRequestSuccess={() =>
          showToast("Merge Request created successfully!")
        }
      />
    </div>
  );
}
