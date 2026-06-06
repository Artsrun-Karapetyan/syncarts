import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Folder, FolderPlus, FilePlus2, FileText, ChevronRight, ChevronDown, Plus, MoreHorizontal, Settings2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { useWorkspace, Folder as IFolder, SavedRequest } from '../../contexts/WorkspaceContext';
import { useStoredUser } from '../../lib/session';

interface CtxMenuState {
  x: number;
  y: number;
  collectionId: string;
  folderId: string | null;
}

function SidebarItem({ item, collectionId, onContextMenu, level = 1 }: { item: IFolder | SavedRequest, collectionId: string, onContextMenu: (e: React.MouseEvent, folderId: string | null) => void, level?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { addTab } = useWorkspace();

  const paddingLeft = `${level * 12 + 8}px`;

  if (item.type === 'request') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--text-secondary)',
          padding: '7px 12px',
          paddingLeft,
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
        onClick={() => addTab({ ...item, id: crypto.randomUUID(), response: null })}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-tertiary)';
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.transform = 'translateX(2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <FileText size={14} style={{ opacity: 0.45, flexShrink: 0 }} />
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
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {item.name}
        </span>
      </div>
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
          padding: '7px 12px',
          paddingLeft,
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
        onClick={() => setIsOpen(!isOpen)}
        onContextMenu={(e) => onContextMenu(e, item.id)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-tertiary)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        {isOpen ? <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.6 }} /> : <ChevronRight size={14} style={{ flexShrink: 0, opacity: 0.6 }} />}
        <Folder size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.name}</span>
      </div>
      {isOpen && (
        <div style={{ borderLeft: '1px solid var(--border-color)', marginLeft: 20, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {item.items.map(subItem => (
            <SidebarItem key={subItem.id} item={subItem} collectionId={collectionId} onContextMenu={onContextMenu} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { collections, addCollection, addFolder, createBlankRequestInFolder } = useWorkspace();
  const user = useStoredUser();
  const [isAdding, setIsAdding] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  const handleAddCollection = () => {
    if (newColName.trim()) {
      addCollection(newColName.trim());
      setNewColName('');
      setIsAdding(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, collectionId: string, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, collectionId, folderId });
  };

  const handleCreateFolder = () => {
    if (!ctxMenu) return;
    const name = window.prompt('Enter folder name:');
    if (name?.trim()) {
      addFolder(ctxMenu.collectionId, ctxMenu.folderId, name);
      setCtxMenu(null);
    }
  };

  const handleCreateRequest = () => {
    if (!ctxMenu) return;
    createBlankRequestInFolder(ctxMenu.collectionId, ctxMenu.folderId);
    setCtxMenu(null);
  };

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections((current) => ({
      ...current,
      [collectionId]: !current[collectionId],
    }));
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
        width: 280,
        borderRight: '1px solid var(--border-color)',
        height: '100%',
        background: 'var(--bg-secondary)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Syncarts</h1>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, fontWeight: 500 }}>API Client</div>
      </div>

      {/* Profile */}
      <Link
        to="/profile"
        style={{
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-primary)',
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          transition: 'border-color var(--transition-fast)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-highlight)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.35), rgba(99, 102, 241, 0.1))',
            border: '2px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            flexShrink: 0,
          }}
        >
          {(user?.name?.trim()?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name?.trim() || 'Your profile'}
          </div>
        </div>
        <Settings2 size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      </Link>

      {/* Collections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto', minHeight: 0, paddingRight: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collections</div>
          <div
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
            onClick={() => setIsAdding(!isAdding)}
            title="New Collection"
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
              onClick={() => toggleCollection(col.id)}
              onContextMenu={(e) => handleContextMenu(e, col.id, null)}
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
                  toggleCollection(col.id);
                }}
                aria-label={expandedCollections[col.id] ? 'Collapse collection' : 'Expand collection'}
              >
                {expandedCollections[col.id] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              <Folder size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{col.name}</span>
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
                  color: 'var(--text-tertiary)',
                  transition: 'all var(--transition-fast)',
                  flexShrink: 0,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, col.id, null);
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
                    onContextMenu={(e, folderId) => handleContextMenu(e, col.id, folderId)}
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

      {/* Context Menu */}
      {ctxMenu && (
        createPortal(
          <div
            ref={menuRef}
            className="animate-fade-in"
            style={{
              position: 'fixed',
              zIndex: 50,
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
              onPointerDown={(e) => {
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
              onPointerDown={(e) => {
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
          </div>,
          document.body
        )
      )}
    </div>
  );
}
