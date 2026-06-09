import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useWorkspace, SavedRequest } from '../../contexts/WorkspaceContext';
import { Select } from '../ui/Select';

interface SaveDialogProps {
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function SaveDialog({ onClose, anchorRef }: SaveDialogProps) {
  const { activeTab, collections, saveRequest, updateActiveTab } = useWorkspace();
  const [requestName, setRequestName] = useState(activeTab?.name === 'Untitled Request' ? '' : activeTab?.name || '');
  
  // Build flattened options for collections and folders
  const destinationOptions: { value: string; label: string }[] = [];
  collections.forEach(col => {
    destinationOptions.push({ value: `col:${col.id}`, label: `📁 ${col.name}` });
    
    const addFolders = (items: any[], depth: number) => {
      items.forEach(item => {
        if (item.type === 'folder') {
          const prefix = '↳ '.padStart(depth * 3 + 2, '\u00A0');
          destinationOptions.push({ value: `fol:${col.id}:${item.id}`, label: `${prefix}📂 ${item.name}` });
          addFolders(item.items, depth + 1);
        }
      });
    };
    addFolders(col.items, 1);
  });

  // Find existing location
  let defaultDest = destinationOptions.length > 0 ? destinationOptions[0].value : '';
  if (activeTab?.savedRequestId) {
    let found = false;
    for (const col of collections) {
      const search = (items: any[], parentFolderId: string | null) => {
        for (const item of items) {
          if (item.type === 'request' && item.id === activeTab.savedRequestId) {
            defaultDest = parentFolderId ? `fol:${col.id}:${parentFolderId}` : `col:${col.id}`;
            found = true;
            return;
          }
          if (item.type === 'folder') {
            search(item.items, item.id);
            if (found) return;
          }
        }
      };
      search(col.items, null);
      if (found) break;
    }
  }

  const [selectedDestination, setSelectedDestination] = useState(defaultDest);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useLayoutEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 10,
      right: window.innerWidth - rect.right,
    });
  }, [anchorRef]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [onClose]);

  if (!activeTab) return null;

  const handleSave = () => {
    if (!selectedDestination) return;

    const destParts = selectedDestination.split(':');
    const destType = destParts[0];
    const collectionId = destParts[1];
    const folderId = destType === 'fol' ? destParts[2] : null;

    const finalName = requestName.trim() || 'Untitled Request';

    // Always generate a new UUID for Save As / initial save to prevent overwriting/moving existing requests unintentionally
    const reqId = crypto.randomUUID();

    const req: SavedRequest = {
      type: 'request',
      id: reqId,
      name: finalName,
      method: activeTab.method || 'GET',
      url: activeTab.url || '',
      headers: activeTab.headers || [],
      authType: activeTab.authType,
      bearerToken: activeTab.bearerToken,
      bodyType: activeTab.bodyType,
      formData: activeTab.formData,
      description: activeTab.description,
      preRequestScript: activeTab.preRequestScript,
      testScript: activeTab.testScript,
      body: activeTab.body || '',
    };

    saveRequest(collectionId, folderId, req);
    updateActiveTab({
      name: req.name,
      method: req.method,
      url: req.url,
      headers: req.headers,
      authType: req.authType,
      bearerToken: req.bearerToken,
      bodyType: req.bodyType,
      formData: req.formData,
      description: req.description,
      preRequestScript: req.preRequestScript,
      testScript: req.testScript,
      body: req.body,
      collectionId,
      folderId: folderId || undefined,
      savedRequestId: reqId,
    });
    onClose();
  };

  return createPortal(
    <div
      ref={panelRef}
      className="glass-panel animate-fade-in"
      style={{
        position: 'fixed',
        zIndex: 100,
        top: pos.top,
        right: pos.right,
        width: 420,
        padding: 22,
        background: 'rgba(12, 12, 12, 0.98)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-highlight)',
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18, letterSpacing: '-0.02em' }}>
        Save Request
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
            Request name
          </label>
          <input
            autoFocus
            className="input"
            style={{ width: '100%' }}
            placeholder="e.g. Get All Users"
            value={requestName}
            onChange={(e) => setRequestName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
            Save to location
          </label>
          {destinationOptions.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--status-delete)' }}>Please create a collection in the sidebar first.</div>
          ) : (
            <Select
              style={{ width: '100%' }}
              value={selectedDestination}
              onChange={setSelectedDestination}
              options={destinationOptions}
            />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
        <button
          className="btn"
          style={{ background: 'transparent', border: 'none' }}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.5rem' }}
          onClick={handleSave}
          disabled={!selectedDestination}
        >
          Save
        </button>
      </div>
    </div>,
    document.body
  );
}
