import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { invoke } from '@tauri-apps/api/core';

import { useWorkspace } from '../../contexts/WorkspaceContext';
import { api } from '../../lib/api';
import { exportToPostmanCollection } from '../../utils/postmanParser';
import { SidebarCollections } from './sidebar/SidebarCollections';
import { SidebarContextMenu } from './sidebar/SidebarContextMenu';
import { SidebarDialogs } from './sidebar/SidebarDialogs';
import { SidebarToolbar } from './sidebar/SidebarToolbar';
import type { CtxMenuState, DeleteTarget, MergeRequestTarget, SidebarItemType } from './sidebar/types';
import { filterCollections, findFolder, findRequest, findRequestPath, renameMatchingItem } from './sidebar/utils';

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
  const [newColName, setNewColName] = useState('');
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [mergeRequestTarget, setMergeRequestTarget] = useState<MergeRequestTarget | null>(null);
  const [openMrCount, setOpenMrCount] = useState(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [collectionSearch, setCollectionSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const highlightedCollectionId = activeTab?.type === 'collection' ? activeTab.collectionId || null : null;
  const highlightedFolderId = activeTab?.type === 'folder' ? activeTab.folderId || null : null;
  const filteredCollections = filterCollections(collections, collectionSearch);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const fetchMrs = async () => {
      try {
        const res = await api.get(`/merge-requests/workspace/${activeWorkspaceId}`);
        const mrs = res.data || [];
        setOpenMrCount(mrs.filter((mr: any) => mr.status === 'OPEN').length);
      } catch (err) {
        console.error('Failed to fetch MRs for badge:', err);
      }
    };
    fetchMrs();
    const interval = setInterval(fetchMrs, 15000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setCtxMenu(null);
    };

    if (ctxMenu) document.addEventListener('pointerdown', closeMenu);
    return () => document.removeEventListener('pointerdown', closeMenu);
  }, [ctxMenu]);

  useEffect(() => {
    setExpandedCollections((current) => {
      const next = { ...current };

      for (const collection of collections) {
        if (next[collection.id] === undefined) next[collection.id] = true;
      }

      for (const key of Object.keys(next)) {
        if (!collections.some((collection) => collection.id === key)) delete next[key];
      }

      return next;
    });
  }, [collections]);

  const highlightRequest = (savedRequestId?: string) => {
    if (!savedRequestId) return;

    const requestPath = findRequestPath(collections, savedRequestId);
    if (!requestPath) return;

    setExpandedCollections((prev) => ({ ...prev, [requestPath.collectionId]: true }));
    setExpandedFolders((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const folderId of requestPath.folderIds) {
        if (!next[folderId]) {
          next[folderId] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setHighlightedRequestId(savedRequestId);
  };

  useEffect(() => {
    const savedRequestId = resolveTabSavedRequestId(activeTab);
    if (savedRequestId) highlightRequest(savedRequestId);
    else setHighlightedRequestId(null);

    if (activeTab?.type === 'collection' && activeTab.collectionId) {
      setExpandedCollections((prev) => ({ ...prev, [activeTab.collectionId!]: true }));
    }

    if (activeTab?.type === 'folder' && activeTab.collectionId && activeTab.folderId) {
      setExpandedCollections((prev) => ({ ...prev, [activeTab.collectionId!]: true }));
      setExpandedFolders((prev) => ({ ...prev, [activeTab.folderId!]: true }));
    }
  }, [activeTab, collections, resolveTabSavedRequestId]);

  useEffect(() => {
    const onHighlightEvent = (e: Event) => {
      const savedRequestId = (e as CustomEvent<{ savedRequestId?: string }>).detail?.savedRequestId;
      highlightRequest(savedRequestId);
    };
    window.addEventListener('highlight-sidebar', onHighlightEvent);
    return () => window.removeEventListener('highlight-sidebar', onHighlightEvent);
  }, [collections]);

  const handleAddCollection = () => {
    if (!newColName.trim()) return;
    addCollection(newColName.trim());
    setNewColName('');
    setIsAdding(false);
  };

  const handleExportCollection = async (collectionId: string) => {
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection) return;
    await exportCollectionFile(collection.name || 'collection', collection);
  };

  const handleExportFolder = async (collectionId: string, folderId: string) => {
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection) return;
    const folder = findFolder(collection.items, folderId);
    if (!folder) return;
    await exportCollectionFile(folder.name || 'folder', { ...collection, name: folder.name, description: folder.description || '', items: [folder] });
  };

  const handleExportRequest = async (collectionId: string, requestId: string) => {
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection) return;
    const request = findRequest(collection.items, requestId);
    if (!request) return;
    await exportCollectionFile(request.name || 'request', { ...collection, name: request.name, description: request.description || '', items: [request] });
  };

  const handleContextMenu = (e: React.MouseEvent, collectionId: string, itemId: string | null, itemType: SidebarItemType, itemName?: string, requestId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, collectionId, itemId, itemType, itemName, requestId });
  };

  const handleCreateFolder = () => {
    setIsCreatingFolder(true);
    setNewFolderName('');
  };

  const handleFolderSubmit = () => {
    if (!ctxMenu || !newFolderName.trim()) return;
    addFolder(ctxMenu.collectionId, ctxMenu.itemType === 'folder' ? ctxMenu.itemId : null, newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
    setCtxMenu(null);
  };

  const handleCreateRequest = () => {
    if (!ctxMenu) return;
    createBlankRequestInFolder(ctxMenu.collectionId, ctxMenu.itemType === 'folder' ? ctxMenu.itemId : null);
    setCtxMenu(null);
  };

  const handleRenameSubmit = () => {
    if (renamingId && renameValue.trim()) {
      renameMatchingItem(collections, renamingId, renameValue.trim(), renameItem);
    }
    setRenamingId(null);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget?.type === 'collection') deleteCollection(deleteTarget.id);
    if (deleteTarget?.type === 'example' && deleteTarget.collectionId && deleteTarget.requestId) deleteExample(deleteTarget.collectionId, deleteTarget.requestId, deleteTarget.id);
    if (deleteTarget?.type === 'item' && deleteTarget.collectionId) deleteItem(deleteTarget.collectionId, deleteTarget.id);
    setDeleteTarget(null);
  };

  const exportCollectionFile = async (defaultName: string, collection: Parameters<typeof exportToPostmanCollection>[0]) => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const filePath = await save({
        defaultPath: `${defaultName}.postman_collection.json`,
        filters: [{ name: 'Postman Collection', extensions: ['json'] }],
      });

      if (!filePath) return;

      await invoke('save_response_body', {
        path: filePath,
        body: exportToPostmanCollection(collection),
      });
    } catch (err) {
      console.error('Failed to export collection:', err);
      alert('Failed to export collection.');
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', padding: 16, display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto', minHeight: 0, paddingRight: 4 }}>
        <SidebarToolbar
          openMrCount={openMrCount}
          onMergeRequests={() => navigate({ to: '/merge-requests' })}
          onImport={() => setIsImportModalOpen(true)}
          onNewRequest={() => addTab()}
          onNewCollection={() => {
            setNewColName('');
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
        onMergeRequestSuccess={() => showToast('Merge Request created successfully!')}
      />
    </div>
  );
}
