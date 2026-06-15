import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { useWorkspace } from "../../contexts/WorkspaceContext";
import { exportCollectionFile } from "./sidebar/exportCollectionFile";
import { SidebarCollections } from "./sidebar/SidebarCollections";
import { SidebarContextMenu } from "./sidebar/SidebarContextMenu";
import { SidebarDialogs } from "./sidebar/SidebarDialogs";
import { SIDEBAR_ROOT_STYLE } from "./sidebar/sidebarStyles";
import { SidebarToolbar } from "./sidebar/SidebarToolbar";
import type {
  ContextMenuRequest,
  CtxMenuState,
  DeleteTarget,
  MergeRequestTarget,
} from "./sidebar/types";
import { useOpenMergeRequestCount } from "./sidebar/useOpenMergeRequestCount";
import { useSidebarHighlight } from "./sidebar/useSidebarHighlight";
import {
  filterCollections,
  findFolder,
  findRequest,
  renameMatchingItem,
} from "./sidebar/utils";

export function Sidebar() {
  const {
    collections,
    addCollection,
    deleteCollection,
    deleteItem,
    addFolder,
    createBlankRequestInFolder,
    openCollectionTab,
    addTab,
    renameItem,
    sortItems,
    deleteExample,
    addExample,
    activeTab,
    resolveTabSavedRequestId,
    forkCollection,
    activeWorkspaceId,
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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

  const handleExportCollection = async (collectionId: string) => {
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection) return;
    await exportCollectionFile(collection.name || "collection", collection);
  };

  const handleExportFolder = async (collectionId: string, folderId: string) => {
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection) return;
    const folder = findFolder(collection.items, folderId);
    if (!folder) return;
    await exportCollectionFile(folder.name || "folder", {
      ...collection,
      name: folder.name,
      description: folder.description || "",
      items: [folder],
    });
  };

  const handleExportRequest = async (
    collectionId: string,
    requestId: string,
  ) => {
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection) return;
    const request = findRequest(collection.items, requestId);
    if (!request) return;
    await exportCollectionFile(request.name || "request", {
      ...collection,
      name: request.name,
      description: request.description || "",
      items: [request],
    });
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
          onMergeRequests={() => navigate({ to: "/merge-requests" })}
          onImport={() => setIsImportModalOpen(true)}
          onNewRequest={() => addTab()}
          onNewCollection={() => {
            setNewColName("");
            setIsAdding(true);
          }}
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
        />
      </div>

      {ctxMenu && (
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
          forkCollection={forkCollection}
          sortItems={sortItems}
          showToast={showToast}
        />
      )}

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
