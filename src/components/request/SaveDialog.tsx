import { useEffect, useRef, useState } from 'react';

import { useWorkspace, SavedRequest } from '../../contexts/WorkspaceContext';

interface SaveDialogProps {
  onClose: () => void;
}

export function SaveDialog({ onClose }: SaveDialogProps) {
  const { activeTab, collections, saveRequest, updateActiveTab } = useWorkspace();
  const [requestName, setRequestName] = useState(activeTab?.name === 'Untitled Request' ? '' : activeTab?.name || '');
  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?.id || '');
  const panelRef = useRef<HTMLDivElement | null>(null);

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

    const req: SavedRequest = {
      type: 'request',
      id: crypto.randomUUID(),
      name: finalName,
      method: activeTab.method,
      url: activeTab.url,
      headers: activeTab.headers,
      body: activeTab.body,
    };

    saveRequest(selectedCollectionId, null, req);
    updateActiveTab({ name: finalName });
    onClose();
  };

  return (
    <div
      ref={panelRef}
      className="glass-panel absolute z-40"
      style={{
        top: 'calc(100% + 14px)',
        right: 122,
        width: 420,
        padding: '22px',
        background: 'rgba(12, 12, 12, 0.98)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <h2 className="text-xl font-bold text-primary tracking-tight" style={{ marginBottom: 18 }}>
        Save Request
      </h2>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-tertiary uppercase tracking-wider block mb-2">Request name</label>
          <input
            autoFocus
            className="input w-full"
            placeholder="e.g. Get All Users"
            value={requestName}
            onChange={(e) => setRequestName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-tertiary uppercase tracking-wider block mb-2">Save to collection</label>
          {collections.length === 0 ? (
            <div className="text-sm text-status-delete">Please create a collection in the sidebar first.</div>
          ) : (
            <select
              className="input w-full"
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

      <div className="flex gap-3 justify-end" style={{ marginTop: 22 }}>
        <button className="btn bg-transparent border-transparent" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary px-6"
          onClick={handleSave}
          disabled={!selectedCollectionId}
        >
          Save
        </button>
      </div>
    </div>
  );
}
