import { useState, useEffect } from 'react';
import { useWorkspace, Folder as IFolder, SavedRequest } from '../../contexts/WorkspaceContext';
import { Folder, FileText, ChevronRight, ChevronDown, Plus, MoreHorizontal } from 'lucide-react';

interface CtxMenuState {
  x: number;
  y: number;
  collectionId: string;
  folderId: string | null;
}

function SidebarItem({ item, collectionId, onContextMenu, level = 1 }: { item: IFolder | SavedRequest, collectionId: string, onContextMenu: (e: React.MouseEvent, folderId: string | null) => void, level?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { addTab } = useWorkspace();
  const getMethodColor = (m: string) => `text-status-${m.toLowerCase()}`;

  const paddingLeft = `${level * 12}px`;

  if (item.type === 'request') {
    return (
      <div 
        className="flex items-center gap-2 text-sm text-secondary py-1.5 px-2 hover:bg-tertiary hover:text-primary rounded-md cursor-pointer transition-smooth group"
        style={{ paddingLeft }}
        onClick={() => addTab({ ...item, id: crypto.randomUUID(), response: null })}
      >
        <FileText size={14} className="opacity-50 shrink-0" />
        <span className={`text-[10px] font-bold shrink-0 w-8 ${getMethodColor(item.method)}`}>{item.method}</span>
        <span className="truncate flex-1">{item.name}</span>
      </div>
    );
  }

  return (
    <div>
      <div 
        className="flex items-center gap-2 text-sm text-secondary py-1.5 px-2 hover:bg-tertiary hover:text-primary rounded-md cursor-pointer transition-smooth group"
        style={{ paddingLeft }}
        onClick={() => setIsOpen(!isOpen)}
        onContextMenu={(e) => onContextMenu(e, item.id)}
      >
        {isOpen ? <ChevronDown size={14} className="shrink-0 opacity-70" /> : <ChevronRight size={14} className="shrink-0 opacity-70" />}
        <Folder size={14} className="text-accent shrink-0" />
        <span className="truncate flex-1">{item.name}</span>
        <div 
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded transition-fast flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e, item.id);
          }}
        >
          <MoreHorizontal size={14} />
        </div>
      </div>
      {isOpen && (
        <div className="flex flex-col border-l border-color ml-4 mt-0.5 gap-0.5">
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
  const [isAdding, setIsAdding] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);

  useEffect(() => {
    const closeMenu = () => setCtxMenu(null);
    if (ctxMenu) document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [ctxMenu]);

  const handleAddCollection = () => {
    if (newColName.trim()) {
      addCollection(newColName.trim());
      setNewColName('');
      setIsAdding(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, collectionId: string, folderId: string | null) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, collectionId, folderId });
  };

  const handleCreateFolder = () => {
    if (!ctxMenu) return;
    const name = window.prompt('Enter folder name:');
    if (name) {
      addFolder(ctxMenu.collectionId, ctxMenu.folderId, name);
    }
  };

  const handleCreateRequest = () => {
    if (!ctxMenu) return;
    createBlankRequestInFolder(ctxMenu.collectionId, ctxMenu.folderId);
  };

  return (
    <div className="w-64 border-r border-color h-full bg-secondary p-6 flex flex-col gap-6 overflow-hidden relative">
      <div className="shrink-0">
        <h1 className="font-bold text-xl text-primary tracking-tight">Syncarts</h1>
        <div className="text-sm text-tertiary mt-1">API Client</div>
      </div>
      
      <div className="flex flex-col gap-2 flex-1 overflow-auto min-h-0 pr-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-tertiary uppercase tracking-wider">Collections</div>
          <div 
            className="p-1 hover:bg-tertiary rounded text-secondary hover:text-primary transition-fast cursor-pointer flex items-center justify-center"
            onClick={() => setIsAdding(!isAdding)}
            title="New Collection"
          >
            <Plus size={14} />
          </div>
        </div>

        {isAdding && (
          <div className="flex gap-2 mb-2">
            <input 
              autoFocus
              className="input text-sm flex-1 p-1 px-2"
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
          <div key={col.id} className="flex flex-col mb-4">
            <div 
              className="flex items-center gap-2 text-sm text-primary font-semibold p-2 bg-tertiary rounded-md cursor-pointer group"
              onContextMenu={(e) => handleContextMenu(e, col.id, null)}
            >
              <Folder size={14} className="text-accent shrink-0" />
              <span className="truncate flex-1">{col.name}</span>
              <div 
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded transition-fast flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, col.id, null);
                }}
              >
                <MoreHorizontal size={14} />
              </div>
            </div>
            <div className="flex flex-col border-l border-color ml-3 mt-1 gap-0.5">
              {col.items.map(item => (
                <SidebarItem 
                  key={item.id} 
                  item={item} 
                  collectionId={col.id} 
                  onContextMenu={(e, folderId) => handleContextMenu(e, col.id, folderId)} 
                />
              ))}
            </div>
          </div>
        ))}
        
        {collections.length === 0 && !isAdding && (
          <div className="text-xs text-tertiary mt-4 opacity-50">No collections yet. Click + to create one.</div>
        )}
      </div>

      {/* Context Menu Floating */}
      {ctxMenu && (
        <div 
          className="fixed z-50 bg-secondary border border-color rounded-md shadow-lg py-1 min-w-40 flex flex-col"
          style={{ top: `${ctxMenu.y}px`, left: `${ctxMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 text-sm cursor-pointer hover:bg-tertiary transition-fast text-primary" onClick={handleCreateFolder}>
            New Folder
          </div>
          <div className="px-4 py-2 text-sm cursor-pointer hover:bg-tertiary transition-fast text-primary" onClick={handleCreateRequest}>
            New Request
          </div>
        </div>
      )}
    </div>
  );
}
