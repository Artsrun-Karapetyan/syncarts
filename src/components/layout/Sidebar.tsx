import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { Folder, FolderPlus, FilePlus2, FileText, ChevronRight, ChevronDown, Plus, MoreHorizontal, Trash2, Download, Edit2, ListOrdered, ArrowDownAZ } from 'lucide-react';

import { useWorkspace, Folder as IFolder, SavedRequest } from '../../contexts/WorkspaceContext';
import { ConfirmModal } from '../ui/ConfirmModal';
import { exportToPostmanCollection } from '../../utils/postmanParser';
import { ImportModal } from '../workspace/ImportModal';

interface CtxMenuState {
  x: number;
  y: number;
  collectionId: string;
  itemId: string | null;
  itemType: 'collection' | 'folder' | 'request' | 'example';
  itemName?: string;
  requestId?: string;
}

interface SidebarItemProps {
  item: IFolder | SavedRequest;
  collectionId: string;
  parentFolderId: string | null;
  onContextMenu: (e: React.MouseEvent, itemId: string, type: 'folder' | 'request' | 'example', itemName: string, requestId?: string) => void;
  level?: number;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  renameValue: string;
  setRenameValue: (val: string) => void;
  handleRenameSubmit: () => void;
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: Dispatch<SetStateAction<Record<string, boolean>>>;
  highlightedRequestId: string | null;
}

function SidebarItem({
  item,
  collectionId,
  parentFolderId,
  onContextMenu,
  level = 1,
  renamingId,
  setRenamingId,
  renameValue,
  setRenameValue,
  handleRenameSubmit,
  expandedFolders,
  setExpandedFolders,
  highlightedRequestId,
}: SidebarItemProps) {
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const { openFolderTab, openExampleTab, openRequestTab } = useWorkspace();

  const paddingLeft = `${level * 12 + 8}px`;

  if (item.type === 'request') {
    return (
      <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: highlightedRequestId === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: highlightedRequestId === item.id ? 'var(--bg-tertiary)' : 'transparent',
          boxShadow: highlightedRequestId === item.id ? 'inset 0 0 0 1px var(--accent-primary)' : 'none',
          padding: '4px 8px',
          paddingLeft,
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all 0.4s ease-out',
        }}
        onClick={() => openRequestTab(collectionId, parentFolderId, item.id)}
        onContextMenu={(e) => onContextMenu(e, item.id, 'request', item.name)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-tertiary)';
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.transform = 'translateX(2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = highlightedRequestId === item.id ? 'var(--bg-tertiary)' : 'transparent';
          e.currentTarget.style.color = highlightedRequestId === item.id ? 'var(--text-primary)' : 'var(--text-secondary)';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <div 
          onClick={(e) => {
            if (item.examples && item.examples.length > 0) {
              e.stopPropagation();
              setIsExamplesOpen(!isExamplesOpen);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 14,
            height: 14,
            cursor: item.examples && item.examples.length > 0 ? 'pointer' : 'default',
            color: 'var(--text-tertiary)'
          }}
        >
          {item.examples && item.examples.length > 0 ? (
            isExamplesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <FileText size={14} style={{ opacity: 0.45 }} />
          )}
        </div>
        <span
          className="font-mono"
          style={{
            fontSize: 10,
            fontWeight: 700,
            flexShrink: 0,
            width: 40,
            color: `var(--status-${item.method.toLowerCase()})`,
          }}
        >
          {item.method}
        </span>
        {renamingId === item.id ? (
          <input
            autoFocus
            className="input"
            style={{ fontSize: 13, flex: 1, padding: '2px 6px', margin: '-2px -6px' }}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setRenamingId(null);
            }}
            onBlur={() => handleRenameSubmit()}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span style={{ whiteSpace: 'nowrap', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.name}
          </span>
        )}
        <div
          style={{
            opacity: 0,
            width: 22,
            height: 22,
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            transition: 'all var(--transition-fast)',
            flexShrink: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e, item.id, 'request', item.name);
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'transparent'; }}
        >
          <MoreHorizontal size={13} />
        </div>
      </div>
      {isExamplesOpen && item.examples && item.examples.length > 0 && (
        <div>
          {item.examples.map((example) => (
            <div
              key={example.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--text-tertiary)',
                padding: '4px 8px',
                paddingLeft: `${level * 12 + 24}px`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => openExampleTab(collectionId, example.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContextMenu(e, example.id, 'example', example.name, item.id);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <FileText size={13} style={{ opacity: 0.3 }} />
              {renamingId === example.id ? (
                <input
                  autoFocus
                  className="input"
                  style={{ fontSize: 13, flex: 1, padding: '2px 6px', margin: '-2px -6px' }}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onBlur={() => handleRenameSubmit()}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span style={{ whiteSpace: 'nowrap', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {example.name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      </>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--text-secondary)',
          padding: '4px 8px',
          paddingLeft,
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
        onClick={() => {
          if (!expandedFolders[item.id]) {
            setExpandedFolders((prev) => ({ ...prev, [item.id]: true }));
          }
          openFolderTab(collectionId, item.id);
        }}
        onContextMenu={(e) => onContextMenu(e, item.id, 'folder', item.name)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-tertiary)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpandedFolders((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
          }}
          style={{ display: 'flex', alignItems: 'center', padding: 2, margin: -2, borderRadius: 4 }}
          className="hover-bg-secondary"
        >
          {expandedFolders[item.id] ? <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.6 }} /> : <ChevronRight size={14} style={{ flexShrink: 0, opacity: 0.6 }} />}
        </div>
        <Folder size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        {renamingId === item.id ? (
          <input
            autoFocus
            className="input"
            style={{ fontSize: 13, flex: 1, padding: '2px 6px', margin: '-2px -6px' }}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setRenamingId(null);
            }}
            onBlur={() => handleRenameSubmit()}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span style={{ whiteSpace: 'nowrap', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
        )}
        <div
          style={{
            opacity: 0,
            width: 22,
            height: 22,
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            transition: 'all var(--transition-fast)',
            flexShrink: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e, item.id, 'folder', item.name);
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'transparent'; }}
        >
          <MoreHorizontal size={13} />
        </div>
      </div>
      {expandedFolders[item.id] && (
        <div style={{ borderLeft: '1px solid var(--border-color)', marginLeft: 20, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {item.items.map(subItem => (
            <SidebarItem 
              key={subItem.id} 
              item={subItem} 
              collectionId={collectionId} 
              parentFolderId={item.id}
              onContextMenu={onContextMenu} 
              level={level + 1} 
              renamingId={renamingId}
              setRenamingId={setRenamingId}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              handleRenameSubmit={handleRenameSubmit}
              expandedFolders={expandedFolders}
              setExpandedFolders={setExpandedFolders}
              highlightedRequestId={highlightedRequestId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { 
    collections, addCollection, deleteCollection, deleteItem, addFolder, createBlankRequestInFolder,
    openCollectionTab,
    renameItem, sortItems, deleteExample, addExample, activeTab, resolveTabSavedRequestId
  } = useWorkspace();
  const [isAdding, setIsAdding] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'collection' | 'item' | 'example', collectionId?: string, requestId?: string } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null);

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
        if (next[collection.id] === undefined) {
          next[collection.id] = true;
        }
      }

      for (const key of Object.keys(next)) {
        if (!collections.some((collection) => collection.id === key)) {
          delete next[key];
        }
      }

      return next;
    });
  }, [collections]);

  const highlightRequest = (savedRequestId?: string) => {
    if (!savedRequestId) return;

    let requestPath: { collectionId: string; folderIds: string[] } | null = null;

    for (const col of collections) {
      const walk = (items: (IFolder | SavedRequest)[], folderIds: string[]): boolean => {
        for (const item of items) {
          if (item.type === 'request' && item.id === savedRequestId) {
            requestPath = { collectionId: col.id, folderIds };
            return true;
          }
          if (item.type === 'folder' && walk(item.items, [...folderIds, item.id])) {
            return true;
          }
        }
        return false;
      };

      if (walk(col.items, [])) break;
    }

    if (!requestPath) return;

    setExpandedCollections((prev) => ({
      ...prev,
      [requestPath!.collectionId]: true,
    }));
    setExpandedFolders((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const folderId of requestPath!.folderIds) {
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
    if (savedRequestId) {
      highlightRequest(savedRequestId);
    } else {
      setHighlightedRequestId(null);
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
    if (newColName.trim()) {
      addCollection(newColName.trim());
      setNewColName('');
      setIsAdding(false);
    }
  };


  const handleExportCollection = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;

    try {
      const jsonStr = exportToPostmanCollection(collection);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collection.name || 'collection'}.postman_collection.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export collection:', err);
      alert('Failed to export collection.');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, collectionId: string, itemId: string | null, itemType: 'collection' | 'folder' | 'request' | 'example', itemName?: string, requestId?: string) => {
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
    const folderId = ctxMenu.itemType === 'folder' ? ctxMenu.itemId : null;
    addFolder(ctxMenu.collectionId, folderId, newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
    setCtxMenu(null);
  };

  const handleCreateRequest = () => {
    if (!ctxMenu) return;
    const folderId = ctxMenu.itemType === 'folder' ? ctxMenu.itemId : null;
    createBlankRequestInFolder(ctxMenu.collectionId, folderId);
    setCtxMenu(null);
  };

  const handleRenameSubmit = () => {
    if (renamingId && renameValue.trim()) {
      // Find collection id from context or anywhere?
      // Actually we need collectionId for renameItem. We can store the renaming target explicitly or assume it from state.
      // Wait, we don't have collectionId easily here if we just use renamingId.
      // But renamingId is set via context menu, so we can use ctxMenu.collectionId? No, ctxMenu is null while renaming.
      // We can just find it by traversing collections.
      for (const col of collections) {
        if (col.id === renamingId) {
          renameItem(col.id, renamingId, renameValue.trim());
          break;
        }
        let found = false;
        const findInItems = (items: any[]) => {
          for (const item of items) {
            if (item.id === renamingId) {
              renameItem(col.id, renamingId, renameValue.trim());
              found = true;
              break;
            }
            if (item.examples?.some((e: any) => e.id === renamingId)) {
              renameItem(col.id, renamingId, renameValue.trim());
              found = true;
              break;
            }
            if (item.type === 'folder') findInItems(item.items);
          }
        };
        findInItems(col.items);
        if (found) break;
      }
    }
    setRenamingId(null);
  };



  const countItems = (items: (IFolder | SavedRequest)[]): number => {
    return items.reduce((acc, item) => {
      if (item.type === 'folder') return acc + countItems(item.items);
      return acc + 1;
    }, 0);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-secondary)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div style={{ flexShrink: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 240, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Syncarts Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.4)' }} />
        </div>
        <div>
          <h1 style={{ 
            fontWeight: 800, 
            fontSize: 22, 
            letterSpacing: '-0.03em', 
            margin: 0,
            background: 'linear-gradient(135deg, #00f0ff 0%, #b000ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 10px rgba(176, 0, 255, 0.2)'
          }}>
            Syncarts
          </h1>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>API Client</div>
        </div>
      </div>

      {/* Collections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto', minHeight: 0, paddingRight: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collections</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              className="tooltip-trigger"
              data-tooltip="Import Data"
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => setIsImportModalOpen(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              <Download size={14} />
            </div>
            <div
              className="tooltip-trigger"
              data-tooltip="New Collection"
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => {
                setNewColName('');
                setIsAdding(true);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              <Plus size={15} />
            </div>
          </div>
        </div>

        <div style={{ minWidth: 'max-content', paddingRight: 8, paddingBottom: 8 }}>
          {isAdding && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input
                autoFocus
                className="input"
                style={{ fontSize: 13, flex: 1, padding: '6px 10px' }}
                placeholder="Collection name"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCollection()}
                onBlur={() => {
                  setTimeout(() => {
                    if (newColName.trim()) handleAddCollection();
                    else setIsAdding(false);
                  }, 100);
                }}
              />
            </div>
          )}

          {collections.map(col => (
          <div key={col.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--text-primary)',
                fontWeight: 600,
                padding: '8px 10px',
                background: 'var(--bg-tertiary)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => {
                if (!expandedCollections[col.id]) {
                  setExpandedCollections(prev => ({ ...prev, [col.id]: true }));
                }
                openCollectionTab(col.id);
              }}
              onContextMenu={(e) => handleContextMenu(e, col.id, null, 'collection', col.name)}
            >
              <button
                type="button"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                  flexShrink: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color var(--transition-fast)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedCollections(prev => ({ ...prev, [col.id]: !prev[col.id] }));
                }}
                aria-label={expandedCollections[col.id] ? 'Collapse collection' : 'Expand collection'}
              >
                {expandedCollections[col.id] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              <Folder size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              {renamingId === col.id ? (
                <input
                  autoFocus
                  className="input"
                  style={{ fontSize: 13, flex: 1, padding: '2px 6px', margin: '-2px -6px' }}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onBlur={() => handleRenameSubmit()}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span style={{ whiteSpace: 'nowrap', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.name}</span>
              )}
              {/* Item count badge */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  padding: '1px 7px',
                  flexShrink: 0,
                }}
              >
                {countItems(col.items)}
              </span>
              <div
                style={{
                  opacity: 0,
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-delete)',
                  transition: 'all var(--transition-fast)',
                  flexShrink: 0,
                  marginRight: 4,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget({ id: col.id, type: 'collection' });
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--status-delete-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'transparent'; }}
                title="Delete Collection"
              >
                <Trash2 size={13} />
              </div>
              <div
                style={{
                  opacity: 0,
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                  transition: 'all var(--transition-fast)',
                  flexShrink: 0,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, col.id, col.id, 'collection', col.name); // passing col.id as itemId for rename
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'transparent'; }}
              >
                <MoreHorizontal size={13} />
              </div>
            </div>
            {expandedCollections[col.id] && (
              <div style={{ borderLeft: '1px solid var(--border-color)', marginLeft: 14, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {col.items.map(item => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    collectionId={col.id}
                    parentFolderId={null}
                    onContextMenu={(e, itemId, type, itemName, requestId) => handleContextMenu(e, col.id, itemId, type, itemName, requestId)}
                    renamingId={renamingId}
                    setRenamingId={setRenamingId}
                    renameValue={renameValue}
                    setRenameValue={setRenameValue}
                    handleRenameSubmit={handleRenameSubmit}
                    expandedFolders={expandedFolders}
                    setExpandedFolders={setExpandedFolders}
                    highlightedRequestId={highlightedRequestId}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {collections.length === 0 && !isAdding && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 32, color: 'var(--text-tertiary)' }}>
            <FolderPlus size={28} style={{ opacity: 0.4 }} />
            <div style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.5 }}>
              No collections yet.<br />Click <strong>+</strong> to create one.
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        createPortal(
          <div
            ref={menuRef}
            className="animate-fade-in"
            style={{
              position: 'fixed',
              zIndex: 99999,
              border: '1px solid var(--border-highlight)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              top: `${ctxMenu.y}px`,
              left: `${ctxMenu.x}px`,
              minWidth: 200,
              background: 'rgba(15, 23, 42, 0.97)',
              backdropFilter: 'blur(20px)',
              padding: 4,
            }}
          >
            {/* RENAME ACTION */}
            {ctxMenu.itemId && (
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                  textAlign: 'left',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRenameValue(ctxMenu.itemName || '');
                  setRenamingId(ctxMenu.itemId);
                  setCtxMenu(null);
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    flexShrink: 0,
                  }}
                >
                  <Edit2 size={13} />
                </span>
                <span style={{ fontWeight: 500 }}>Rename</span>
              </button>
            )}

            {ctxMenu.itemType === 'request' && (
              <>
                <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                    textAlign: 'left',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (ctxMenu.itemId && activeTab?.response) {
                      addExample(ctxMenu.collectionId, ctxMenu.itemId, 'Example Response');
                    } else if (ctxMenu.itemId) {
                      addExample(ctxMenu.collectionId, ctxMenu.itemId, 'New Example');
                    }
                    setCtxMenu(null);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={13} />
                  </span>
                  <span style={{ fontWeight: 500 }}>Add example</span>
                </button>
              </>
            )}

            {ctxMenu.itemType !== 'request' && ctxMenu.itemType !== 'example' && (
              <>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
                textAlign: 'left',
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCreateFolder();
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              >
                <FolderPlus size={13} />
              </span>
              <span style={{ fontWeight: 500 }}>New folder</span>
            </button>
            {isCreatingFolder && (
              <div style={{ padding: '6px 12px' }}>
                <input
                  autoFocus
                  className="input"
                  style={{ width: '100%', fontSize: 13, padding: '6px 10px' }}
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFolderSubmit();
                    if (e.key === 'Escape') { setIsCreatingFolder(false); setCtxMenu(null); }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      if (newFolderName.trim()) handleFolderSubmit();
                      else { setIsCreatingFolder(false); setCtxMenu(null); }
                    }, 100);
                  }}
                />
              </div>
            )}
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
                textAlign: 'left',
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCreateRequest();
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              >
                <FilePlus2 size={13} />
              </span>
              <span style={{ fontWeight: 500 }}>New request</span>
            </button>
            </>
            )}

            {ctxMenu.itemType === 'collection' && (
              <>
                <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                    textAlign: 'left',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExportCollection(ctxMenu.collectionId);
                    setCtxMenu(null);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <Download size={13} />
                  </span>
                  <span style={{ fontWeight: 500 }}>Export collection</span>
                </button>
              </>
            )}

            {(ctxMenu.itemType === 'collection' || ctxMenu.itemType === 'folder') && (
              <>
                <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                    textAlign: 'left',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sortItems(ctxMenu.collectionId, ctxMenu.itemType === 'folder' ? ctxMenu.itemId : null, 'default');
                    setCtxMenu(null);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <ListOrdered size={13} />
                  </span>
                  <span style={{ fontWeight: 500 }}>Sort (Folders first)</span>
                </button>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                    textAlign: 'left',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sortItems(ctxMenu.collectionId, ctxMenu.itemType === 'folder' ? ctxMenu.itemId : null, 'az');
                    setCtxMenu(null);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <ArrowDownAZ size={13} />
                  </span>
                  <span style={{ fontWeight: 500 }}>Sort (A to Z)</span>
                </button>
              </>
            )}

            <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--status-delete)',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
                textAlign: 'left',
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (ctxMenu.itemType === 'collection') {
                  setDeleteTarget({ id: ctxMenu.collectionId, type: 'collection' });
                } else if (ctxMenu.itemType === 'example' && ctxMenu.itemId && ctxMenu.requestId) {
                  setDeleteTarget({ id: ctxMenu.itemId, type: 'example', collectionId: ctxMenu.collectionId, requestId: ctxMenu.requestId });
                } else if (ctxMenu.itemId) {
                  setDeleteTarget({ id: ctxMenu.itemId, type: 'item', collectionId: ctxMenu.collectionId });
                }
                setCtxMenu(null);
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--status-delete-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-delete)',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={13} />
              </span>
              <span style={{ fontWeight: 500 }}>Delete {ctxMenu.itemType}</span>
            </button>
          </div>,
          document.body
        )
      )}

      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title={deleteTarget?.type === 'collection' ? "Delete Collection" : deleteTarget?.type === 'example' ? "Delete Example" : "Delete Item"}
        message={`Are you sure you want to delete this ${deleteTarget?.type}? ${deleteTarget?.type === 'collection' || deleteTarget?.type === 'item' ? 'All contents inside it will be permanently lost.' : ''} This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTarget) {
            if (deleteTarget.type === 'collection') {
              deleteCollection(deleteTarget.id);
            } else if (deleteTarget.type === 'example' && deleteTarget.collectionId && deleteTarget.requestId) {
              deleteExample(deleteTarget.collectionId, deleteTarget.requestId, deleteTarget.id);
            } else if (deleteTarget.type === 'item' && deleteTarget.collectionId) {
              deleteItem(deleteTarget.collectionId, deleteTarget.id);
            }
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
