import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useWorkspace, SavedRequest } from '../../contexts/WorkspaceContext';

interface SaveDialogProps {
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function SaveDialog({ onClose, anchorRef }: SaveDialogProps) {
  const { activeTab, collections, saveRequest, updateActiveTab } = useWorkspace();
  const [requestName, setRequestName] = useState(activeTab?.name === 'Untitled Request' ? '' : activeTab?.name || '');
  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?.id || '');
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
    if (!selectedCollectionId) return;

    const finalName = requestName.trim() || 'Untitled Request';

    const reqId = activeTab.savedRequestId || crypto.randomUUID();

    const req: SavedRequest = {
      type: 'request',
      id: reqId,
      name: finalName,
      method: activeTab.method,
      url: activeTab.url,
      headers: activeTab.headers,
      body: activeTab.body,
    };

    saveRequest(selectedCollectionId, null, req);
    updateActiveTab({ name: finalName, savedRequestId: reqId });
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
            Save to collection
          </label>
          {collections.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--status-delete)' }}>Please create a collection in the sidebar first.</div>
          ) : (
            <select
              className="input"
              style={{ width: '100%' }}
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
            >
              {collections.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
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
          disabled={!selectedCollectionId}
        >
          Save
        </button>
      </div>
    </div>,
    document.body
  );
}
